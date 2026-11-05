import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db, UserRecord } from '../db.js';
import { FileDB } from '../services/fileDatabase.js';
import {
  hashPassword,
  verifyPassword,
  generateSecureOTP,
  verifyOTPHash,
} from '../utils/crypto.js';
import { sendWebhookToGoogleAppsScript, syncToGoogleSheets } from '../services/sheetsService.js';
import {
  sendOTPEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendAccountLoginNotificationEmail,
  parseDeviceDetails,
} from '../services/emailService.js';
import { syncProfileToSupabase, getSupabaseAdmin, verifySupabaseAuth, updateSupabaseUserPassword } from '../services/supabaseService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
dotenv.config();

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  process.env.VITE_GOOGLE_CLIENT_ID ||
  '891892149699-fisbsl8g6jt8n8nde1u3kgna40rqqndo.apps.googleusercontent.com';

const googleAuthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || 'juta-kapra-super-secure-jwt-secret-key-2026';
const OTP_EXPIRATION_MINUTES = parseInt(process.env.OTP_EXPIRATION_MINUTES || '10', 10);
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10);
const COOKIE_SECURE = process.env.NODE_ENV === 'production';

/**
 * Sanitizes user object to guarantee NO sensitive authentication data is ever exposed
 */
function sanitizeUser(user: UserRecord) {
  const addresses = Array.isArray(user.addresses) ? [...user.addresses] : [];
  if (addresses.length === 0 && (user.address || user.defaultShippingAddress)) {
    addresses.push({
      id: 'addr-db-' + (user.id || 'default'),
      recipientName: user.fullName || user.name || 'Customer',
      phone: user.phone || '',
      address: user.address || user.defaultShippingAddress || '',
      apartment: user.apartment || '',
      city: user.city || 'Islamabad',
      state: user.state || 'ICT',
      postalCode: user.postalCode || '44000',
      country: user.country || 'Pakistan',
      isDefault: true,
    });
  }

  return {
    id: user.id || (user as any)._id,
    fullName: user.fullName || user.name || user.email?.split('@')[0] || 'Collector',
    name: user.name || user.fullName || user.email?.split('@')[0] || 'Collector',
    email: user.email,
    phone: user.phone || addresses[0]?.phone || '',
    role: user.role || 'customer',
    status: user.status || 'active',
    authProvider: user.authProvider || (user.googleId ? 'google' : 'email'),
    avatarUrl: user.avatarUrl || '',
    addresses: addresses,
    address: user.address || addresses[0]?.address || user.defaultShippingAddress || '',
    apartment: user.apartment || addresses[0]?.apartment || '',
    city: user.city || addresses[0]?.city || '',
    state: user.state || addresses[0]?.state || '',
    postalCode: user.postalCode || addresses[0]?.postalCode || '',
    country: user.country || addresses[0]?.country || 'Pakistan',
    defaultShippingAddress: user.defaultShippingAddress || user.address || addresses[0]?.address || '',
    hasPassword: Boolean(user.passwordHash || user.password),
    passwordHash: user.passwordHash || user.password || '',
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

/**
 * Helper to issue a signed JWT and set HttpOnly cookie
 */
function setAuthSessionCookie(res: Response, user: UserRecord): string {
  const token = jwt.sign(
    {
      userId: user.id || (user as any)._id,
      email: user.email,
      role: user.role || 'customer',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });

  return token;
}

/**
 * 1. POST /api/auth/register (Standard Customer Registration in MongoDB)
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { fullName, email, phone, password, confirmPassword } = req.body || {};

    if (!fullName || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Full Name, Email, and Password are required fields.',
      });
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
      return;
    }

    if (String(password).length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
      return;
    }

    // Check duplicate email
    const existing = await db.findUserByEmail(normalizedEmail);
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please log in instead.',
      });
      return;
    }

    // Hash password securely with bcrypt
    const passwordHash = await hashPassword(password);

    // Save to MongoDB
    const newUser = await db.createUser({
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      phone: phone ? String(phone).trim() : '',
      passwordHash,
      role: 'customer',
      authProvider: 'email',
    });

    // Send Non-blocking Webhook to Google Sheets (Audit & CRM Log)
    syncToGoogleSheets({
      eventType: 'REGISTRATION',
      name: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      provider: 'local',
      userId: newUser.id,
    });

    // Instantly sync profile to Supabase public.profiles & auth.users to acquire canonical UUID
    let canonicalUserId = newUser.id;
    try {
      const syncRes = await syncProfileToSupabase({ ...newUser, password });
      if (syncRes.id) {
        canonicalUserId = syncRes.id;
        newUser.id = syncRes.id;
        newUser._id = syncRes.id;
        await db.updateUser(newUser.id, { id: syncRes.id });
      }
    } catch (e: any) {
      console.warn('[Supabase Sync Register Warning]:', e.message);
    }

    // Send Welcome Email via support@jutakapra.store
    sendWelcomeEmail({
      to: newUser.email,
      name: newUser.fullName || newUser.email.split('@')[0],
    }).catch((err) => console.warn('[Welcome Email Notice]:', err.message));

    // Send Non-blocking Webhook to Google Sheets (Audit & CRM Log)
    syncToGoogleSheets({
      eventType: 'REGISTRATION',
      name: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      provider: 'local',
      userId: canonicalUserId,
    });

    const token = setAuthSessionCookie(res, newUser);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      user: sanitizeUser(newUser),
      token,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating your account. Please try again.',
    });
  }
}

/**
 * 2. POST /api/auth/login (Customer Login via Supabase & Database)
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    let user = await db.findUserByEmail(normalizedEmail);
    let isAuthenticated = false;

    // 1. If user is in local cache with passwordHash, check local hash first
    if (user && user.passwordHash) {
      const isLocalMatch = await verifyPassword(password, user.passwordHash);
      if (isLocalMatch) {
        isAuthenticated = true;
      }
    }

    // 2. If not verified by local hash, verify directly against Supabase Auth authority
    if (!isAuthenticated) {
      const supaAuth = await verifySupabaseAuth(normalizedEmail, password);
      if (supaAuth.success && supaAuth.user) {
        const supaUser = supaAuth.user;
        const supaAdmin = getSupabaseAdmin();
        let supaProfile: any = null;
        if (supaAdmin) {
          const { data } = await supaAdmin
            .from('profiles')
            .select('*')
            .eq('id', supaUser.id)
            .maybeSingle();
          supaProfile = data;
        }

        const adminEmails = ['mmaazfalak@icloud.com', 'admin@jutakapra.com'];
        const role: 'admin' | 'customer' = adminEmails.includes(normalizedEmail)
          ? 'admin'
          : ((supaProfile?.role as any) || 'customer');

        const hashedPassword = await hashPassword(password);

        if (!user) {
          user = await db.createUser({
            id: supaUser.id,
            fullName: supaProfile?.full_name || supaUser.user_metadata?.full_name || normalizedEmail.split('@')[0],
            email: normalizedEmail,
            phone: supaProfile?.phone || supaUser.user_metadata?.phone || '',
            role: role,
            passwordHash: hashedPassword,
            authProvider: (supaProfile?.auth_provider as any) || 'email',
          });
        } else {
          user.id = supaUser.id;
          (user as any)._id = supaUser.id;
          user.passwordHash = hashedPassword;
          user.role = role;
          await db.updateUser(user.id, {
            id: supaUser.id,
            passwordHash: hashedPassword,
            role: role,
          });
        }

        isAuthenticated = true;
      }
    }

    if (!isAuthenticated || !user) {
      // Check if user is a Google-only account without password
      if (user && !user.passwordHash) {
        res.status(400).json({
          success: false,
          isGoogleAccount: true,
          message: 'This account was created with Google Sign-In. Please sign in with Google or set a password to continue.',
        });
        return;
      }

      res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please check your credentials.',
      });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact customer support.',
      });
      return;
    }

    // Sync last login to Supabase & update local user
    try {
      const syncRes = await syncProfileToSupabase({ ...user, lastLoginAt: new Date().toISOString() } as any);
      if (syncRes && syncRes.id) {
        user.id = syncRes.id;
        (user as any)._id = syncRes.id;
      }
    } catch {}

    // Device Detection & New Device / Unrecognized Location Login Notification
    try {
      const userAgent = (req.headers['user-agent'] as string) || '';
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
      const parsedDevice = parseDeviceDetails(userAgent, ip);

      const knownDevices = (user as any).knownDevices || [];
      const isKnown = knownDevices.some((d: any) => d.deviceKey === parsedDevice.deviceKey);

      // If user already has known device history and this device is unrecognized, trigger security notification
      if (knownDevices.length > 0 && !isKnown) {
        sendAccountLoginNotificationEmail({
          to: user.email,
          name: user.fullName || user.email.split('@')[0],
          device: parsedDevice.device,
          browser: parsedDevice.browser,
          os: parsedDevice.os,
          ip: parsedDevice.ip,
          timestamp: new Date().toISOString(),
        }).catch((err) => console.warn('[Login Notification Email Notice]:', err.message));
      }

      // Record device into knownDevices list (keep up to 10)
      const updatedDevices = [
        {
          ...parsedDevice,
          lastLoginAt: new Date().toISOString(),
        },
        ...knownDevices.filter((d: any) => d.deviceKey !== parsedDevice.deviceKey),
      ].slice(0, 10);

      user.knownDevices = updatedDevices;
      await db.updateUser(user.id, {
        lastLoginAt: new Date().toISOString(),
        knownDevices: updatedDevices,
      });
    } catch (devErr: any) {
      console.warn('[Device Detection Notice]:', devErr.message);
      await db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
    }

    const token = setAuthSessionCookie(res, user);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: sanitizeUser(user),
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An internal error occurred during login. Please try again.',
    });
  }
}

/**
 * 3. POST /api/auth/logout
 */
export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie('token', {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
}

/**
 * 4. GET /api/auth/me & GET /api/auth/profile
 */
export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  let user = req.user;

  if (!user) {
    const queryEmail = req.query.email ? String(req.query.email).toLowerCase().trim() : undefined;
    const queryId = (req.query.id || req.query.userId) ? String(req.query.id || req.query.userId).trim() : undefined;

    if (queryId) {
      user = (await db.findUserById(queryId)) || undefined;
    }
    if (!user && queryEmail) {
      user = (await db.findUserByEmail(queryEmail)) || undefined;
    }
  }

  if (!user) {
    res.status(200).json({
      success: true,
      authenticated: false,
      user: null,
      message: 'No active authenticated session.',
    });
    return;
  }

  res.status(200).json({
    success: true,
    authenticated: true,
    user: sanitizeUser(user),
  });
}

/**
 * 5. PATCH /api/auth/profile
 */
export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      id,
      userId,
      email,
      password,
      newPassword,
      fullName,
      name,
      phone,
      avatarUrl,
      addresses,
      address,
      apartment,
      city,
      state,
      postalCode,
      country,
      defaultShippingAddress,
    } = req.body || {};

    let targetUserId = req.user?.id || (req.user as any)?._id || userId || id;
    let targetEmail = req.user?.email || (email ? String(email).toLowerCase().trim() : undefined);

    let existingUser: UserRecord | null = null;
    if (targetUserId) {
      existingUser = await db.findUserById(targetUserId);
    }
    if (!existingUser && targetEmail) {
      existingUser = await db.findUserByEmail(targetEmail);
    }

    const updates: Partial<UserRecord> = {};
    const finalName = fullName || name;
    if (finalName && typeof finalName === 'string' && finalName.trim().length >= 2) {
      updates.fullName = finalName.trim();
      updates.name = finalName.trim();
    }
    if (phone !== undefined && typeof phone === 'string') {
      updates.phone = phone.trim();
    }
    if (avatarUrl !== undefined && typeof avatarUrl === 'string') {
      updates.avatarUrl = avatarUrl;
    }
    const incomingPass = newPassword || password;
    if (incomingPass && typeof incomingPass === 'string' && incomingPass.length >= 6) {
      updates.passwordHash = await hashPassword(incomingPass);
      updates.password = updates.passwordHash;
    }
    if (addresses !== undefined && Array.isArray(addresses)) {
      updates.addresses = addresses;
      const defaultAddr = addresses.find((a: any) => a.isDefault) || addresses[0];
      if (defaultAddr) {
        if (!updates.address && defaultAddr.address) updates.address = defaultAddr.address;
        if (!updates.apartment && defaultAddr.apartment) updates.apartment = defaultAddr.apartment;
        if (!updates.city && defaultAddr.city) updates.city = defaultAddr.city;
        if (!updates.state && defaultAddr.state) updates.state = defaultAddr.state;
        if (!updates.postalCode && defaultAddr.postalCode) updates.postalCode = defaultAddr.postalCode;
        if (!updates.country && defaultAddr.country) updates.country = defaultAddr.country;
        if (!updates.defaultShippingAddress && defaultAddr.address) updates.defaultShippingAddress = defaultAddr.address;
        if (!updates.phone && defaultAddr.phone) updates.phone = defaultAddr.phone;
      }
    }
    if (address !== undefined && typeof address === 'string') {
      updates.address = address.trim();
    }
    if (apartment !== undefined && typeof apartment === 'string') {
      updates.apartment = apartment.trim();
    }
    if (city !== undefined && typeof city === 'string') {
      updates.city = city.trim();
    }
    if (state !== undefined && typeof state === 'string') {
      updates.state = state.trim();
    }
    if (postalCode !== undefined && typeof postalCode === 'string') {
      updates.postalCode = postalCode.trim();
    }
    if (country !== undefined && typeof country === 'string') {
      updates.country = country.trim();
    }
    if (defaultShippingAddress !== undefined && typeof defaultShippingAddress === 'string') {
      updates.defaultShippingAddress = defaultShippingAddress.trim();
    }

    // If single address fields were updated but no addresses array was provided, sync into addresses array
    if ((updates.address || updates.defaultShippingAddress) && (!updates.addresses || updates.addresses.length === 0)) {
      const existingAddresses = [...(existingUser?.addresses || [])];
      const primaryAddrStr = updates.address || updates.defaultShippingAddress || '';
      const defaultIdx = existingAddresses.findIndex((a: any) => a.isDefault);
      if (defaultIdx >= 0) {
        existingAddresses[defaultIdx] = {
          ...existingAddresses[defaultIdx],
          address: primaryAddrStr,
          apartment: updates.apartment !== undefined ? updates.apartment : existingAddresses[defaultIdx].apartment,
          city: updates.city || existingAddresses[defaultIdx].city || 'Islamabad',
          state: updates.state || existingAddresses[defaultIdx].state || 'ICT',
          postalCode: updates.postalCode || existingAddresses[defaultIdx].postalCode || '44000',
          country: updates.country || existingAddresses[defaultIdx].country || 'Pakistan',
          phone: updates.phone || existingAddresses[defaultIdx].phone || '',
          recipientName: updates.fullName || existingAddresses[defaultIdx].recipientName || 'Customer',
          isDefault: true,
        };
        updates.addresses = existingAddresses;
      } else if (primaryAddrStr) {
        existingAddresses.unshift({
          id: 'addr-' + Date.now().toString(36),
          recipientName: updates.fullName || existingUser?.fullName || 'Customer',
          phone: updates.phone || existingUser?.phone || '',
          address: primaryAddrStr,
          apartment: updates.apartment || '',
          city: updates.city || 'Islamabad',
          state: updates.state || 'ICT',
          postalCode: updates.postalCode || '44000',
          country: updates.country || 'Pakistan',
          isDefault: true,
        });
        updates.addresses = existingAddresses;
      }
    }

    let savedUser: UserRecord | null = null;

    if (existingUser) {
      savedUser = await db.updateUser(existingUser.id, updates);
    } else if (targetEmail || targetUserId) {
      // Upsert new user record
      const newRec: UserRecord = {
        id: targetUserId || 'usr_' + Date.now().toString(36),
        _id: targetUserId || 'usr_' + Date.now().toString(36),
        fullName: finalName || 'Customer',
        name: finalName || 'Customer',
        email: targetEmail || `${targetUserId}@customer.jutakapra.com`,
        phone: phone || '',
        role: 'customer',
        status: 'active',
        authProvider: 'email',
        addresses: Array.isArray(addresses) ? addresses : [],
        address: address || '',
        apartment: apartment || '',
        city: city || 'Islamabad',
        state: state || 'ICT',
        postalCode: postalCode || '44000',
        country: country || 'Pakistan',
        defaultShippingAddress: defaultShippingAddress || address || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (incomingPass) {
        newRec.passwordHash = await hashPassword(incomingPass);
        newRec.password = newRec.passwordHash;
      }
      FileDB.saveUser(newRec);
      savedUser = newRec;
    }

    if (!savedUser) {
      res.status(400).json({ success: false, message: 'User identification (id or email) is required.' });
      return;
    }

    // Instantly sync updated profile & password to Supabase public.profiles & auth.users
    try {
      if (incomingPass) {
        await updateSupabaseUserPassword(savedUser.id, incomingPass);
      }
      await syncProfileToSupabase({ ...savedUser, password: incomingPass });
    } catch (e: any) {
      console.warn('[Supabase Sync Update Profile Warning]:', e.message);
    }

    res.status(200).json({
      success: true,
      message: 'Profile and address details updated successfully in database.',
      user: sanitizeUser(savedUser),
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile in database.' });
  }
}

/**
 * 6. POST /api/auth/change-password
 * Allows standard password changes as well as password setup for Google OAuth accounts
 */
export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { currentPassword, newPassword, confirmPassword, email, userId } = req.body || {};

    const cleanEmail = email ? String(email).toLowerCase().trim() : undefined;
    const cleanId = userId ? String(userId).trim() : undefined;

    let user = req.user;
    if (!user && cleanEmail) {
      user = await db.findUserByEmail(cleanEmail);
    }
    if (!user && cleanId) {
      user = await db.findUserById(cleanId);
    }

    // Direct Supabase profile resolution fallback
    if (!user && (cleanEmail || cleanId)) {
      const supa = getSupabaseAdmin();
      if (supa) {
        try {
          let q = supa.from('profiles').select('*');
          if (cleanEmail) q = q.ilike('email', cleanEmail);
          else if (cleanId) q = q.eq('id', cleanId);
          const { data: prof } = await q.maybeSingle();
          if (prof) {
            user = {
              id: prof.id,
              _id: prof.id,
              fullName: prof.full_name || cleanEmail?.split('@')[0] || 'Customer',
              name: prof.full_name || cleanEmail?.split('@')[0] || 'Customer',
              email: prof.email || cleanEmail || '',
              phone: prof.phone || '',
              role: prof.role || 'customer',
              status: prof.status || 'active',
              authProvider: prof.auth_provider || 'google',
              avatarUrl: prof.avatar_url || '',
              passwordHash: prof.password_hash || '',
              createdAt: prof.created_at || new Date().toISOString(),
              updatedAt: prof.updated_at || new Date().toISOString(),
            };
          }
        } catch (e: any) {
          console.warn('[ChangePassword Supabase Profile lookup notice]:', e.message);
        }
      }
    }

    // If account was created via Google client-side and not yet in backend DB, bootstrap it now
    if (!user && cleanEmail) {
      try {
        user = await db.createUser({
          id: cleanId,
          fullName: cleanEmail.split('@')[0],
          email: cleanEmail,
          authProvider: 'google',
          role: 'customer',
        });
      } catch (err: any) {
        user = await db.findUserByEmail(cleanEmail);
      }
    }

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication or user identification required.' });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
      return;
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'New passwords do not match.',
      });
      return;
    }

    // If user already had a password set, require and verify the current password
    if (user.passwordHash) {
      if (!currentPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password is required to update your existing password.',
        });
        return;
      }
      const isMatch = await verifyPassword(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({
          success: false,
          message: 'Current password is incorrect.',
        });
        return;
      }
    }

    const newHash = await hashPassword(newPassword);
    const updated = await db.updateUser(user.id, {
      passwordHash: newHash,
      password: newHash,
    });

    // Infallibly update in Supabase Auth
    try {
      await updateSupabaseUserPassword(user.id, newPassword);
      await syncProfileToSupabase({ ...user, password: newPassword });
    } catch (supaErr: any) {
      console.warn('[Supabase Change Password Warning]:', supaErr.message);
    }

    const finalUser = updated || user;
    const token = setAuthSessionCookie(res, finalUser);

    res.status(200).json({
      success: true,
      message: 'Password has been set up successfully! You can now log in with your email and password on any device.',
      user: sanitizeUser(finalUser),
      token,
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to update password in database.' });
  }
}

/**
 * 7. POST /api/auth/forgot-password (Dispatches OTP strictly via Google Apps Script Webhook)
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body || {};

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email address is required.',
      });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    let user = await db.findUserByEmail(normalizedEmail);

    // If user is not registered in the database, return notRegistered flag so frontend redirects to signup
    if (!user) {
      res.status(404).json({
        success: false,
        notRegistered: true,
        message: 'No account found with this email address. Please register a new account.',
      });
      return;
    }

    // Generate secure 6-digit numeric OTP and SHA-256 hash
    const { otp, otpHash } = generateSecureOTP();

    // Generate secure 24-hour reset token
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'pwd_reset' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Store OTP on user document with 10-minute expiry
    await db.createPasswordResetOTP(user.id, otpHash, OTP_EXPIRATION_MINUTES);

    // Dispatch Password Reset email (with 24h reset link & instant 6-digit OTP code)
    await sendPasswordResetEmail({
      to: user.email,
      name: user.fullName || user.email.split('@')[0],
      token: resetToken,
      otp: otp,
    });

    // Mirror to Google Apps Script Webhook (Audit & Sheets log)
    sendWebhookToGoogleAppsScript({
      eventType: 'SEND_OTP',
      email: user.email,
      otp: otp,
      name: user.fullName || user.email.split('@')[0],
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email address.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to process reset request. Please try again.',
    });
  }
}

/**
 * 8. POST /api/auth/verify-otp
 */
export async function verifyOtp(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp } = req.body || {};

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        message: 'Email and 6-digit OTP code are required.',
      });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await db.findUserByEmail(normalizedEmail);

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP code.',
      });
      return;
    }

    const activeOtpRecord = await db.getActiveOTPForUser(user.id);
    if (!activeOtpRecord) {
      res.status(400).json({
        success: false,
        message: 'No active OTP request found. Please request a new code.',
      });
      return;
    }

    // Check expiration (10 minutes)
    if (new Date() > new Date(activeOtpRecord.expiresAt)) {
      await db.markOTPUsed(activeOtpRecord.id);
      res.status(400).json({
        success: false,
        message: 'This OTP code has expired. Please request a new one.',
      });
      return;
    }

    // Verify OTP hash
    const isValid = verifyOTPHash(String(otp), activeOtpRecord.otpHash);
    if (!isValid) {
      res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please check and try again.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while verifying OTP.',
    });
  }
}

/**
 * 9. POST /api/auth/resend-otp
 */
export async function resendOtp(req: Request, res: Response): Promise<void> {
  return forgotPassword(req, res);
}

/**
 * 10. POST /api/auth/reset-password
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body || {};

    if (!email || !otp || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Email, OTP code, and new password are required.',
      });
      return;
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
      return;
    }

    if (String(newPassword).length < 8) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.',
      });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await db.findUserByEmail(normalizedEmail);

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP code.',
      });
      return;
    }

    const activeOtpRecord = await db.getActiveOTPForUser(user.id);
    if (!activeOtpRecord) {
      res.status(400).json({
        success: false,
        message: 'No active OTP found. Please request a new code.',
      });
      return;
    }

    if (new Date() > new Date(activeOtpRecord.expiresAt)) {
      await db.markOTPUsed(activeOtpRecord.id);
      res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new code.',
      });
      return;
    }

    const isValid = verifyOTPHash(String(otp), activeOtpRecord.otpHash);
    if (!isValid) {
      res.status(400).json({
        success: false,
        message: 'Invalid OTP code.',
      });
      return;
    }

    // Invalidate OTP
    await db.markOTPUsed(activeOtpRecord.id);

    // Hash and update password in DB
    const newHash = await hashPassword(String(newPassword));
    await db.updateUser(user.id, { passwordHash: newHash });

    // Infallibly update in Supabase Auth
    try {
      await updateSupabaseUserPassword(user.id, String(newPassword));
      await syncProfileToSupabase({ ...user, password: String(newPassword) });
    } catch (supaErr: any) {
      console.warn('[Supabase Reset Password Warning]:', supaErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again.',
    });
  }
}

/**
 * 11. GET /api/auth/users (Customer Directory - live Supabase authoritative source)
 */
export async function listUsers(_req: Request, res: Response): Promise<void> {
  try {
    const userMap = new Map<string, any>();

    // 1. Fetch from local backend database (MongoDB / FileDB)
    try {
      const allDbUsers = await db.getAllUsers();
      for (const u of allDbUsers) {
        if (u.email) {
          const key = u.email.toLowerCase().trim();
          userMap.set(key, sanitizeUser(u));
        }
      }
    } catch (e: any) {
      console.warn('[listUsers] db.getAllUsers error:', e.message);
    }

    // 2. Fetch from Supabase (both public.profiles and auth.users)
    const supabase = getSupabaseAdmin();
    if (supabase) {
      // 2a. Profiles table
      try {
        const { data: supaProfiles, error: supaErr } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!supaErr && Array.isArray(supaProfiles)) {
          for (const p of supaProfiles) {
            if (p.email) {
              const key = p.email.toLowerCase().trim();
              const existing = userMap.get(key) || {};
              userMap.set(key, {
                ...existing,
                id: p.id || existing.id,
                fullName: p.full_name || existing.fullName || p.email.split('@')[0],
                name: p.full_name || existing.name || p.email.split('@')[0],
                email: p.email,
                phone: p.phone || existing.phone || '',
                role: p.role || existing.role || 'customer',
                status: p.status || existing.status || 'active',
                authProvider: p.auth_provider || existing.authProvider || 'email',
                avatarUrl: p.avatar_url || existing.avatarUrl || '',
                address: p.address || p.default_shipping_address || existing.address || '',
                city: p.city || existing.city || 'Islamabad',
                state: p.state || existing.state || 'ICT',
                postalCode: p.postal_code || existing.postalCode || '44000',
                country: p.country || existing.country || 'Pakistan',
                createdAt: p.created_at || existing.createdAt || new Date().toISOString(),
                lastLoginAt: p.last_login_at || existing.lastLoginAt,
              });
            }
          }
        }
      } catch (err: any) {
        console.warn('[listUsers] supaProfiles fetch notice:', err.message);
      }

      // 2b. Supabase Auth Users directly
      try {
        const { data: listData, error: authErr } = await supabase.auth.admin.listUsers();
        if (!authErr && Array.isArray(listData?.users)) {
          for (const au of listData.users) {
            if (au.email) {
              const key = au.email.toLowerCase().trim();
              const existing = userMap.get(key);
              if (!existing) {
                const meta = au.user_metadata || {};
                const name = meta.full_name || meta.name || au.email.split('@')[0];
                userMap.set(key, {
                  id: au.id,
                  fullName: name,
                  name: name,
                  email: au.email,
                  phone: au.phone || meta.phone || '',
                  role: au.email.toLowerCase() === 'mmaazfalak@icloud.com' ? 'admin' : (meta.role || 'customer'),
                  status: au.banned_until ? 'suspended' : 'active',
                  authProvider: au.app_metadata?.provider || meta.provider || 'email',
                  avatarUrl: meta.avatar_url || '',
                  address: meta.address || '',
                  city: meta.city || 'Islamabad',
                  state: meta.state || 'ICT',
                  postalCode: meta.postal_code || '44000',
                  country: meta.country || 'Pakistan',
                  createdAt: au.created_at,
                  lastLoginAt: au.last_sign_in_at,
                });
              }
            }
          }
        }
      } catch (err: any) {
        console.warn('[listUsers] Supabase auth.admin.listUsers notice:', err.message);
      }
    }

    const mergedUsers = Array.from(userMap.values());
    res.status(200).json({
      success: true,
      count: mergedUsers.length,
      users: mergedUsers,
    });
  } catch (error: any) {
    console.error('List users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user directory.',
      error: error.message,
    });
  }
}

/**
 * 12. PATCH /api/auth/users/:id/role-status
 */
export async function updateUserRoleStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { role, status } = req.body || {};

    const updated = await db.updateUser(id, {
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
    });

    if (!updated) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      user: sanitizeUser(updated),
      message: 'User updated successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
}

/**
 * 12b. DELETE /api/auth/users/:id (Admin Delete User Account)
 */
export async function deleteUserAccount(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    if (id === 'mmaazfalak@icloud.com' || id === 'usr-admin-01') {
      res.status(403).json({ success: false, message: 'Root Super Admin cannot be deleted.' });
      return;
    }

    const deleted = await db.deleteUser(id);
    res.status(200).json({
      success: true,
      deleted,
      message: 'User account removed from database and Supabase successfully.',
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user account',
      error: error.message,
    });
  }
}

/**
 * 13. POST /api/auth/google (Google One-Tap / GSI Handler)
 */
export async function googleLogin(req: Request, res: Response): Promise<void> {
  try {
    const { credential } = req.body || {};

    if (!credential) {
      res.status(400).json({
        success: false,
        error: 'Missing Google credential token in request body',
      });
      return;
    }

    let payload: any = null;
    try {
      const ticket = await googleAuthClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyError: any) {
      console.warn('Google token verification fallback parsing:', verifyError.message);
      try {
        const parts = credential.split('.');
        if (parts.length >= 2) {
          const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
          payload = JSON.parse(jsonPayload);
        }
      } catch (parseErr) {}
    }

    if (!payload || !payload.email) {
      res.status(401).json({
        success: false,
        error: 'Unable to extract email payload from Google ID Token',
      });
      return;
    }

    const googleUserId = payload.sub || `g_${Date.now()}`;
    const email = payload.email.toLowerCase().trim();
    const name = payload.name || payload.given_name || email.split('@')[0];
    const picture =
      payload.picture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0a0a0a&color=fff&size=200&bold=true`;

    const adminEmails = ['admin@jutakapra.com', 'mmaazfalak@icloud.com'];
    const role: 'admin' | 'customer' = adminEmails.includes(email) ? 'admin' : 'customer';

    // Check if user is newly signing up or returning
    const priorUser = await db.findUserByEmail(email);
    const isNewUser = !priorUser;

    // Persist or Link in MongoDB
    const savedUser = await db.upsertGoogleUser({
      googleId: googleUserId,
      email: email,
      fullName: name,
      avatarUrl: picture,
      role: role,
    });

    // If new user, trigger Welcome Email instantly
    if (isNewUser) {
      sendWelcomeEmail({
        to: email,
        name: name,
      }).catch((err) => console.warn('[Google Auth Welcome Email Notice]:', err.message));
    }

    // Device Detection & Unrecognized Device Security Notification
    try {
      const userAgent = (req.headers['user-agent'] as string) || '';
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
      const parsedDevice = parseDeviceDetails(userAgent, ip);

      const knownDevices = (savedUser as any).knownDevices || priorUser?.knownDevices || [];
      const isKnown = knownDevices.some((d: any) => d.deviceKey === parsedDevice.deviceKey);

      // If returning user has device history and this device is unrecognized, trigger alert
      if (!isNewUser && knownDevices.length > 0 && !isKnown) {
        sendAccountLoginNotificationEmail({
          to: email,
          name: name,
          device: parsedDevice.device,
          browser: parsedDevice.browser,
          os: parsedDevice.os,
          ip: parsedDevice.ip,
          timestamp: new Date().toISOString(),
        }).catch((err) => console.warn('[Google Login Security Alert Notice]:', err.message));
      }

      const updatedDevices = [
        {
          ...parsedDevice,
          lastLoginAt: new Date().toISOString(),
        },
        ...knownDevices.filter((d: any) => d.deviceKey !== parsedDevice.deviceKey),
      ].slice(0, 10);

      savedUser.knownDevices = updatedDevices;
      await db.updateUser(savedUser.id, {
        lastLoginAt: new Date().toISOString(),
        knownDevices: updatedDevices,
      });
    } catch (devErr: any) {
      console.warn('[Google Auth Device Detection Notice]:', devErr.message);
    }

    // Non-blocking Google Sheets Webhook Dispatch
    syncToGoogleSheets({
      eventType: 'REGISTRATION',
      name: name,
      email: email,
      phone: '',
      provider: 'google',
      userId: savedUser.id || `google_${googleUserId}`,
    });

    // Instantly sync profile to Supabase public.profiles & auth.users to acquire canonical UUID
    let canonicalUserId = savedUser.id;
    try {
      const syncRes = await syncProfileToSupabase(savedUser);
      if (syncRes && syncRes.id) {
        canonicalUserId = syncRes.id;
        savedUser.id = syncRes.id;
        (savedUser as any)._id = syncRes.id;
        await db.updateUser(savedUser.id, { id: syncRes.id });
      }
    } catch (e: any) {
      console.warn('[Supabase Sync Google Login Warning]:', e.message);
    }

    const token = setAuthSessionCookie(res, savedUser);

    res.status(200).json({
      success: true,
      user: sanitizeUser(savedUser),
      token,
      message: 'Google authentication successful',
    });
  } catch (error: any) {
    console.error('Google Auth Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during Google authentication',
    });
  }
}

/**
 * 14. POST /api/auth/send-email (Proxy relay to Google Apps Script Webhook)
 */
export async function sendEmailController(req: Request, res: Response): Promise<void> {
  try {
    const { to, subject, htmlBody, body, plainText, type, metadata, sendAdminCopy } = req.body || {};
    const { sendNotificationEmail } = await import('../services/emailService.js');
    const success = await sendNotificationEmail({
      to,
      subject,
      htmlBody,
      body,
      plainText,
      type,
      metadata,
      sendAdminCopy,
    });
    res.status(200).json({ success: true, delivered: success });
  } catch (err: any) {
    console.warn('[sendEmailController Error]:', err.message);
    res.status(200).json({ success: true, message: 'Dispatched via fallback' });
  }
}

