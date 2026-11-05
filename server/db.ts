import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { User, IUserDocument, UserModel } from './models/user.model.js';
import { seedProductsIfEmpty } from './models/product.model.js';
import { FileDB } from './services/fileDatabase.js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://kbdrlhiishmetsddlstq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_r4PIdoHdJ5606fytYnajYA_DV0ekz1d';
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

export interface UserRecord {
  id: string;
  _id?: string;
  fullName: string;
  name?: string;
  email: string;
  phone: string;
  passwordHash?: string;
  password?: string;
  googleId?: string;
  role: 'customer' | 'admin';
  status: 'active' | 'suspended';
  authProvider: 'email' | 'google' | 'guest';
  avatarUrl?: string;
  addresses?: any[];
  address?: string;
  apartment?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  defaultShippingAddress?: string;
  resetOtp?: string | null;
  resetOtpExpires?: Date | string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface PasswordResetOTPRecord {
  id: string;
  userId: string;
  otpHash: string;
  expiresAt: string;
  attempts: number;
  usedAt?: string | null;
  createdAt: string;
}

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL ||
  process.env.MONGO_URI ||
  '';

import { hashPassword } from './utils/crypto.js';

let isMongooseConnected = false;

// Single Global Super Admin Account (mmaazfalak@icloud.com / Pass@Jutakapra12)
const DEFAULT_ADMIN_RECORD: UserRecord = {
  id: 'usr-admin-01',
  _id: 'usr-admin-01',
  fullName: 'Maaz Falak',
  name: 'Maaz Falak',
  email: 'mmaazfalak@icloud.com',
  phone: '+923000000000',
  // Dynamic or bcrypt hash for Pass@Jutakapra12
  passwordHash: '$2a$12$K8/gB4z4m66uY7wNqK7x5u88pZ0l7jI0vFkEwG4nOm91.2c8/8j.e',
  role: 'admin',
  status: 'active',
  authProvider: 'email',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

// In-Memory Fallback Cache & Store (Used only if MongoDB URI is not provided)
const inMemoryUsers: Map<string, UserRecord> = new Map([
  ['usr-admin-01', DEFAULT_ADMIN_RECORD],
  ['mmaazfalak@icloud.com', DEFAULT_ADMIN_RECORD],
]);
const inMemoryOTPs: Map<string, PasswordResetOTPRecord> = new Map();

/**
 * Ensures the single Super Admin user exists in MongoDB
 */
export async function seedAdminUserIfEmpty(): Promise<void> {
  try {
    const adminEmail = 'mmaazfalak@icloud.com';
    const existing = await User.findOne({ email: adminEmail }).exec();
    if (!existing) {
      const passwordHash = await hashPassword('Pass@Jutakapra12');
      await User.create({
        name: 'Maaz Falak',
        email: adminEmail,
        password: passwordHash,
        role: 'admin',
        phone: '+923000000000',
        authProvider: 'email',
        status: 'active',
      });
      console.log('✅ Super Admin user provisioned in MongoDB (mmaazfalak@icloud.com)');
    } else if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
    }
  } catch (err: any) {
    console.warn('[DB] Admin seed warning:', err.message);
  }
}

/**
 * Establish a single resilient MongoDB connection via Mongoose
 */
export async function connectDB(): Promise<boolean> {
  if (isMongooseConnected) return true;

  if (!MONGODB_URI || !MONGODB_URI.startsWith('mongodb')) {
    console.warn('⚠️ No MONGODB_URI found in environment. Using resilient in-memory collection cache for local testing.');
    return false;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true, // Register/ensure unique indexes
    });

    isMongooseConnected = true;
    console.log('✅ Database connected successfully');

    // Preserve product catalog in MongoDB collection
    await seedProductsIfEmpty();

    // Ensure single Admin user exists
    await seedAdminUserIfEmpty();

    return true;
  } catch (err: any) {
    console.error('❌ Database connection error:', err.message);
    isMongooseConnected = false;
    return false;
  }
}

// Attempt initial database connection
connectDB().catch((err) => {
  console.error('❌ Database connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  isMongooseConnected = false;
  console.warn('⚠️ MongoDB connection lost. Reconnecting in background...');
});

mongoose.connection.on('connected', () => {
  isMongooseConnected = true;
  console.log('✅ Database connected successfully');
});

export const db = {
  isDBConnected(): boolean {
    return isMongooseConnected || mongoose.connection.readyState === 1;
  },

  /**
   * Find user by email (case-insensitive across MongoDB, FileDB, inMemory, and Supabase)
   */
  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const normalized = email.toLowerCase().trim();

    if (this.isDBConnected()) {
      try {
        const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const userDoc = await User.findOne({
          $or: [
            { email: normalized },
            { email: { $regex: new RegExp(`^${escaped}$`, 'i') } },
          ],
        }).select('+password').exec();

        if (userDoc) {
          const u: UserRecord = {
            id: userDoc._id.toString(),
            _id: userDoc._id.toString(),
            fullName: userDoc.name,
            name: userDoc.name,
            email: userDoc.email.toLowerCase().trim(),
            phone: userDoc.phone || '',
            passwordHash: userDoc.password,
            password: userDoc.password,
            googleId: userDoc.googleId,
            role: userDoc.role || 'customer',
            status: userDoc.status || 'active',
            authProvider: userDoc.authProvider || (userDoc.googleId ? 'google' : 'email'),
            avatarUrl: userDoc.avatarUrl || '',
            addresses: userDoc.addresses || [],
            address: userDoc.address || '',
            apartment: userDoc.apartment || '',
            city: userDoc.city || '',
            state: userDoc.state || '',
            postalCode: userDoc.postalCode || '',
            country: userDoc.country || '',
            defaultShippingAddress: userDoc.defaultShippingAddress || '',
            resetOtp: userDoc.resetOtp,
            resetOtpExpires: userDoc.resetOtpExpires,
            createdAt: userDoc.createdAt ? userDoc.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: userDoc.updatedAt ? userDoc.updatedAt.toISOString() : new Date().toISOString(),
            lastLoginAt: userDoc.lastLoginAt ? userDoc.lastLoginAt.toISOString() : undefined,
          };
          FileDB.saveUser(u);
          inMemoryUsers.set(u.id, u);
          return u;
        }
      } catch (err: any) {
        console.warn('[DB] MongoDB findUserByEmail query error:', err.message);
      }
    }

    // Repository File Database Persistent Store
    const fileUser = FileDB.findUserByEmail(normalized);
    if (fileUser) {
      inMemoryUsers.set(fileUser.id, fileUser);
      return fileUser;
    }

    // In-memory fallback
    for (const u of inMemoryUsers.values()) {
      if (u.email && u.email.toLowerCase().trim() === normalized) {
        return u;
      }
    }

    // Supabase fallback lookup for Google OAuth & synced users
    if (serverSupabase) {
      try {
        const { data: profile } = await serverSupabase
          .from('profiles')
          .select('*')
          .ilike('email', normalized)
          .maybeSingle();

        if (profile) {
          const u: UserRecord = {
            id: profile.id,
            _id: profile.id,
            fullName: profile.full_name || profile.name || normalized.split('@')[0],
            name: profile.full_name || profile.name || normalized.split('@')[0],
            email: (profile.email || normalized).toLowerCase().trim(),
            phone: profile.phone || '',
            passwordHash: undefined,
            googleId: profile.auth_provider === 'google' ? profile.id : undefined,
            role: profile.role || 'customer',
            status: profile.status || 'active',
            authProvider: profile.auth_provider || 'google',
            avatarUrl: profile.avatar_url || '',
            addresses: [],
            address: profile.address || '',
            city: profile.city || '',
            state: profile.state || '',
            postalCode: profile.postal_code || '',
            country: profile.country || '',
            defaultShippingAddress: profile.default_shipping_address || '',
            createdAt: profile.created_at || new Date().toISOString(),
            updatedAt: profile.updated_at || new Date().toISOString(),
          };
          FileDB.saveUser(u);
          inMemoryUsers.set(u.id, u);
          return u;
        }
      } catch (err: any) {
        console.warn('[DB] Supabase findUserByEmail fallback error:', err.message);
      }
    }

    return null;
  },

  /**
   * Find user by ID
   */
  async findUserById(id: string): Promise<UserRecord | null> {
    if (this.isDBConnected()) {
      try {
        let userDoc: IUserDocument | null = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
          userDoc = await User.findById(id).select('+password').exec();
        }
        if (!userDoc) {
          userDoc = await User.findOne({
            $or: [{ _id: id }, { googleId: id }],
          }).select('+password').exec();
        }

        if (userDoc) {
          const u: UserRecord = {
            id: userDoc._id.toString(),
            _id: userDoc._id.toString(),
            fullName: userDoc.name,
            name: userDoc.name,
            email: userDoc.email,
            phone: userDoc.phone || '',
            passwordHash: userDoc.password,
            password: userDoc.password,
            googleId: userDoc.googleId,
            role: userDoc.role || 'customer',
            status: userDoc.status || 'active',
            authProvider: userDoc.authProvider || (userDoc.googleId ? 'google' : 'email'),
            avatarUrl: userDoc.avatarUrl || '',
            addresses: userDoc.addresses || [],
            address: userDoc.address || '',
            apartment: userDoc.apartment || '',
            city: userDoc.city || '',
            state: userDoc.state || '',
            postalCode: userDoc.postalCode || '',
            country: userDoc.country || '',
            defaultShippingAddress: userDoc.defaultShippingAddress || '',
            resetOtp: userDoc.resetOtp,
            resetOtpExpires: userDoc.resetOtpExpires,
            createdAt: userDoc.createdAt.toISOString(),
            updatedAt: userDoc.updatedAt.toISOString(),
            lastLoginAt: userDoc.lastLoginAt ? userDoc.lastLoginAt.toISOString() : undefined,
          };
          FileDB.saveUser(u);
          return u;
        }
      } catch (err: any) {
        console.warn('[DB] MongoDB findUserById error:', err.message);
      }
    }

    // Repository File Database Persistent Store
    const fileUser = FileDB.findUserById(id);
    if (fileUser) {
      inMemoryUsers.set(fileUser.id, fileUser);
      return fileUser;
    }

    return inMemoryUsers.get(id) || null;
  },

  /**
   * Create a new user with standard email/password registration
   */
  async createUser(data: {
    id?: string;
    fullName: string;
    email: string;
    phone?: string;
    passwordHash?: string;
    role?: 'customer' | 'admin';
    authProvider?: 'email' | 'google' | 'guest';
  }): Promise<UserRecord> {
    const normalizedEmail = data.email.toLowerCase().trim();

    if (this.isDBConnected()) {
      try {
        const newUserDoc = new User({
          name: data.fullName.trim(),
          email: normalizedEmail,
          phone: data.phone || '',
          password: data.passwordHash,
          role: data.role || 'customer',
          status: 'active',
          authProvider: data.authProvider || 'email',
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName)}&background=0a0a0a&color=fff&size=200&bold=true`,
        });

        // Save directly to MongoDB
        await newUserDoc.save();

        const userRecord: UserRecord = {
          id: data.id || newUserDoc._id.toString(),
          _id: data.id || newUserDoc._id.toString(),
          fullName: newUserDoc.name,
          name: newUserDoc.name,
          email: newUserDoc.email,
          phone: newUserDoc.phone || '',
          passwordHash: newUserDoc.password,
          role: newUserDoc.role || 'customer',
          status: newUserDoc.status || 'active',
          authProvider: newUserDoc.authProvider || 'email',
          avatarUrl: newUserDoc.avatarUrl,
          addresses: [],
          address: '',
          createdAt: newUserDoc.createdAt.toISOString(),
          updatedAt: newUserDoc.updatedAt.toISOString(),
        };

        FileDB.saveUser(userRecord);
        inMemoryUsers.set(userRecord.id, userRecord);
        return userRecord;
      } catch (err: any) {
        console.error('[DB] MongoDB createUser error:', err.message);
        throw err;
      }
    }

    // Repository File Database & In-memory Persistent Save
    const now = new Date().toISOString();
    const id = data.id || ('usr_' + crypto.randomBytes(16).toString('hex'));
    const userRecord: UserRecord = {
      id,
      _id: id,
      fullName: data.fullName.trim(),
      name: data.fullName.trim(),
      email: normalizedEmail,
      phone: data.phone || '',
      passwordHash: data.passwordHash,
      role: data.role || 'customer',
      status: 'active',
      authProvider: data.authProvider || 'email',
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName)}&background=0a0a0a&color=fff&size=200&bold=true`,
      addresses: [],
      address: '',
      createdAt: now,
      updatedAt: now,
    };

    FileDB.saveUser(userRecord);
    inMemoryUsers.set(id, userRecord);
    return userRecord;
  },

  /**
   * Google OAuth User Upsert / Account Linker
   */
  async upsertGoogleUser(data: {
    googleId: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    role?: 'customer' | 'admin';
  }): Promise<UserRecord> {
    const normalizedEmail = data.email.toLowerCase().trim();

    if (this.isDBConnected()) {
      try {
        const escaped = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        let userDoc = await User.findOne({
          $or: [
            { email: normalizedEmail },
            { email: { $regex: new RegExp(`^${escaped}$`, 'i') } },
            { googleId: data.googleId },
          ],
        }).exec();

        if (userDoc) {
          // Link Google ID to existing account
          userDoc.googleId = data.googleId;
          userDoc.authProvider = 'google';
          if (data.avatarUrl) userDoc.avatarUrl = data.avatarUrl;
          if (data.fullName && (!userDoc.name || userDoc.name === 'Collector')) {
            userDoc.name = data.fullName;
          }
          userDoc.lastLoginAt = new Date();
          await userDoc.save();
        } else {
          // Create new customer document
          userDoc = new User({
            googleId: data.googleId,
            email: normalizedEmail,
            name: data.fullName || normalizedEmail.split('@')[0],
            avatarUrl: data.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName)}&background=0a0a0a&color=fff&size=200&bold=true`,
            role: data.role || 'customer',
            status: 'active',
            authProvider: 'google',
            lastLoginAt: new Date(),
          });
          await userDoc.save();
        }

        const userRecord: UserRecord = {
          id: userDoc._id.toString(),
          _id: userDoc._id.toString(),
          fullName: userDoc.name,
          name: userDoc.name,
          email: userDoc.email.toLowerCase().trim(),
          phone: userDoc.phone || '',
          googleId: userDoc.googleId,
          role: userDoc.role || 'customer',
          status: userDoc.status || 'active',
          authProvider: 'google',
          avatarUrl: userDoc.avatarUrl,
          addresses: userDoc.addresses || [],
          address: userDoc.address || '',
          city: userDoc.city || '',
          state: userDoc.state || '',
          postalCode: userDoc.postalCode || '',
          country: userDoc.country || '',
          createdAt: userDoc.createdAt.toISOString(),
          updatedAt: userDoc.updatedAt.toISOString(),
          lastLoginAt: userDoc.lastLoginAt ? userDoc.lastLoginAt.toISOString() : undefined,
        };

        FileDB.saveUser(userRecord);
        inMemoryUsers.set(userRecord.id, userRecord);
        return userRecord;
      } catch (err: any) {
        console.error('[DB] MongoDB upsertGoogleUser error:', err.message);
      }
    }

    // Check FileDB first
    const existingFile = FileDB.findUserByEmail(normalizedEmail);
    const now = new Date().toISOString();
    if (existingFile) {
      existingFile.googleId = data.googleId;
      existingFile.authProvider = 'google';
      if (data.avatarUrl) existingFile.avatarUrl = data.avatarUrl;
      existingFile.lastLoginAt = now;
      existingFile.updatedAt = now;
      FileDB.saveUser(existingFile);
      inMemoryUsers.set(existingFile.id, existingFile);
      return existingFile;
    }

    // In-memory fallback
    let existing: UserRecord | undefined;
    for (const u of inMemoryUsers.values()) {
      if (u.email && u.email.toLowerCase().trim() === normalizedEmail) {
        existing = u;
        break;
      }
    }

    if (existing) {
      existing.googleId = data.googleId;
      existing.authProvider = 'google';
      if (data.avatarUrl) existing.avatarUrl = data.avatarUrl;
      existing.lastLoginAt = now;
      existing.updatedAt = now;
      FileDB.saveUser(existing);
      inMemoryUsers.set(existing.id, existing);
      return existing;
    }

    const id = `google_${data.googleId}`;
    const newUser: UserRecord = {
      id,
      _id: id,
      fullName: data.fullName || normalizedEmail.split('@')[0],
      name: data.fullName || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      phone: '',
      googleId: data.googleId,
      role: data.role || 'customer',
      status: 'active',
      authProvider: 'google',
      avatarUrl: data.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName)}&background=0a0a0a&color=fff&size=200&bold=true`,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };
    FileDB.saveUser(newUser);
    inMemoryUsers.set(id, newUser);
    return newUser;
  },

  /**
   * Create 6-digit Password Reset OTP and save to MongoDB User document & FileDB
   */
  async createPasswordResetOTP(userId: string, otpHash: string, expiresInMinutes: number = 10): Promise<PasswordResetOTPRecord> {
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    const id = 'otp_' + crypto.randomBytes(12).toString('hex');

    if (this.isDBConnected()) {
      try {
        if (mongoose.Types.ObjectId.isValid(userId)) {
          await User.findByIdAndUpdate(userId, {
            resetOtp: otpHash,
            resetOtpExpires: expiresAt,
          }).exec();
        } else {
          await User.findOneAndUpdate(
            { $or: [{ _id: userId }, { id: userId }, { googleId: userId }] },
            { resetOtp: otpHash, resetOtpExpires: expiresAt }
          ).exec();
        }
      } catch (err: any) {
        console.warn('[DB] MongoDB save OTP error:', err.message);
      }
    }

    // Persist to FileDB User Record
    FileDB.updateUser(userId, {
      resetOtp: otpHash,
      resetOtpExpires: expiresAt.toISOString(),
    });

    // Also store in memory
    const otpRecord: PasswordResetOTPRecord = {
      id,
      userId,
      otpHash,
      expiresAt: expiresAt.toISOString(),
      attempts: 0,
      createdAt: new Date().toISOString(),
    };

    inMemoryOTPs.set(userId, otpRecord);
    return otpRecord;
  },

  /**
   * Retrieve active OTP for user
   */
  async getActiveOTPForUser(userId: string): Promise<PasswordResetOTPRecord | null> {
    if (this.isDBConnected()) {
      try {
        let userDoc: IUserDocument | null = null;
        if (mongoose.Types.ObjectId.isValid(userId)) {
          userDoc = await User.findById(userId).exec();
        }
        if (!userDoc) {
          userDoc = await User.findOne({ $or: [{ _id: userId }, { id: userId }, { googleId: userId }] }).exec();
        }

        if (userDoc && userDoc.resetOtp && userDoc.resetOtpExpires) {
          return {
            id: 'otp_' + userId,
            userId,
            otpHash: userDoc.resetOtp,
            expiresAt: new Date(userDoc.resetOtpExpires).toISOString(),
            attempts: 0,
            createdAt: userDoc.updatedAt.toISOString(),
          };
        }
      } catch (err: any) {
        console.warn('[DB] MongoDB getActiveOTPForUser error:', err.message);
      }
    }

    const fileUser = FileDB.findUserById(userId);
    if (fileUser && fileUser.resetOtp && fileUser.resetOtpExpires) {
      return {
        id: 'otp_' + userId,
        userId,
        otpHash: fileUser.resetOtp,
        expiresAt: typeof fileUser.resetOtpExpires === 'string' ? fileUser.resetOtpExpires : (fileUser.resetOtpExpires as Date).toISOString(),
        attempts: 0,
        createdAt: fileUser.updatedAt || new Date().toISOString(),
      };
    }

    const record = inMemoryOTPs.get(userId);
    if (!record || record.usedAt) return null;
    return record;
  },

  /**
   * Mark OTP as used and clear from document & FileDB
   */
  async markOTPUsed(otpId: string, explicitUserId?: string): Promise<void> {
    let resolvedUserId = explicitUserId;

    for (const [uid, record] of inMemoryOTPs.entries()) {
      if (record.id === otpId || uid === otpId || uid === otpId.replace('otp_', '')) {
        resolvedUserId = resolvedUserId || record.userId || uid;
        record.usedAt = new Date().toISOString();
        inMemoryOTPs.delete(uid);
      }
    }

    const userId = resolvedUserId || otpId.replace('otp_', '');

    if (this.isDBConnected()) {
      try {
        if (mongoose.Types.ObjectId.isValid(userId)) {
          await User.findByIdAndUpdate(userId, {
            resetOtp: null,
            resetOtpExpires: null,
          }).exec();
        } else {
          await User.findOneAndUpdate(
            { $or: [{ _id: userId }, { id: userId }, { googleId: userId }] },
            { resetOtp: null, resetOtpExpires: null }
          ).exec();
        }
      } catch (err: any) {
        console.warn('[DB] MongoDB clear OTP error:', err.message);
      }
    }

    FileDB.updateUser(userId, {
      resetOtp: null,
      resetOtpExpires: null,
    });
  },

  /**
   * Increment attempts for rate-limiting
   */
  async incrementOTPAttempts(otpId: string): Promise<void> {
    for (const record of inMemoryOTPs.values()) {
      if (record.id === otpId) {
        record.attempts += 1;
        break;
      }
    }
  },

  /**
   * Update User document
   */
  async updateUser(userId: string, updates: Partial<UserRecord>): Promise<UserRecord | null> {
    if (this.isDBConnected()) {
      try {
        const mongoUpdates: Record<string, any> = {};
        if (updates.fullName) mongoUpdates.name = updates.fullName;
        if (updates.name) mongoUpdates.name = updates.name;
        if (updates.phone !== undefined) mongoUpdates.phone = updates.phone;
        if (updates.passwordHash) mongoUpdates.password = updates.passwordHash;
        if (updates.password) mongoUpdates.password = updates.password;
        if (updates.role) mongoUpdates.role = updates.role;
        if (updates.status) mongoUpdates.status = updates.status;
        if (updates.avatarUrl) mongoUpdates.avatarUrl = updates.avatarUrl;
        if (updates.addresses !== undefined) mongoUpdates.addresses = updates.addresses;
        if (updates.address !== undefined) mongoUpdates.address = updates.address;
        if (updates.apartment !== undefined) mongoUpdates.apartment = updates.apartment;
        if (updates.city !== undefined) mongoUpdates.city = updates.city;
        if (updates.state !== undefined) mongoUpdates.state = updates.state;
        if (updates.postalCode !== undefined) mongoUpdates.postalCode = updates.postalCode;
        if (updates.country !== undefined) mongoUpdates.country = updates.country;
        if (updates.defaultShippingAddress !== undefined) mongoUpdates.defaultShippingAddress = updates.defaultShippingAddress;
        if (updates.lastLoginAt) mongoUpdates.lastLoginAt = new Date(updates.lastLoginAt);

        let userDoc: IUserDocument | null = null;
        if (mongoose.Types.ObjectId.isValid(userId)) {
          userDoc = await User.findByIdAndUpdate(userId, mongoUpdates, { new: true }).exec();
        }
        if (!userDoc) {
          userDoc = await User.findOneAndUpdate(
            { $or: [{ _id: userId }, { id: userId }] },
            mongoUpdates,
            { new: true }
          ).exec();
        }

        if (userDoc) {
          const updatedRecord: UserRecord = {
            id: userDoc._id.toString(),
            _id: userDoc._id.toString(),
            fullName: userDoc.name,
            name: userDoc.name,
            email: userDoc.email,
            phone: userDoc.phone || '',
            passwordHash: userDoc.password,
            googleId: userDoc.googleId,
            role: userDoc.role || 'customer',
            status: userDoc.status || 'active',
            authProvider: userDoc.authProvider || 'email',
            avatarUrl: userDoc.avatarUrl || '',
            addresses: userDoc.addresses || [],
            address: userDoc.address || '',
            apartment: userDoc.apartment || '',
            city: userDoc.city || '',
            state: userDoc.state || '',
            postalCode: userDoc.postalCode || '',
            country: userDoc.country || '',
            defaultShippingAddress: userDoc.defaultShippingAddress || '',
            createdAt: userDoc.createdAt.toISOString(),
            updatedAt: userDoc.updatedAt.toISOString(),
            lastLoginAt: userDoc.lastLoginAt ? userDoc.lastLoginAt.toISOString() : undefined,
          };
          FileDB.saveUser(updatedRecord);
          inMemoryUsers.set(updatedRecord.id, updatedRecord);
          return updatedRecord;
        }
      } catch (err: any) {
        console.error('[DB] MongoDB updateUser error:', err.message);
      }
    }

    // Repository File Database Persistent Save
    const fileUpdated = FileDB.updateUser(userId, updates);
    if (fileUpdated) {
      inMemoryUsers.set(userId, fileUpdated);
      return fileUpdated;
    }

    const existing = inMemoryUsers.get(userId);
    if (!existing) return null;
    const updated: UserRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    FileDB.saveUser(updated);
    inMemoryUsers.set(userId, updated);
    return updated;
  },

  /**
   * Delete a user across all stores (Supabase, MongoDB, FileDB, and In-Memory)
   */
  async deleteUser(idOrEmail: string): Promise<boolean> {
    const normalized = idOrEmail.toLowerCase().trim();
    if (normalized === 'mmaazfalak@icloud.com' || idOrEmail === 'usr-admin-01') {
      console.warn('[DB] Cannot delete root Super Admin account.');
      return false;
    }

    let deleted = false;

    // 1. Delete from Supabase auth.users & public.profiles
    if (serverSupabase) {
      try {
        const { deleteUserFromSupabase } = await import('./services/supabaseService.js');
        await deleteUserFromSupabase(idOrEmail);
        deleted = true;
      } catch (err: any) {
        console.warn('[DB] Supabase delete user warning:', err.message);
      }
    }

    // 2. Delete from FileDB
    try {
      const fileDeleted = FileDB.deleteUser(idOrEmail);
      if (fileDeleted) deleted = true;
    } catch (err: any) {
      console.warn('[DB] FileDB delete user error:', err.message);
    }

    // 3. Delete from in-memory cache
    for (const [key, user] of inMemoryUsers.entries()) {
      if (
        user.email.toLowerCase().trim() === normalized ||
        user.id === idOrEmail ||
        user._id === idOrEmail ||
        key === idOrEmail
      ) {
        if (user.email.toLowerCase().trim() !== 'mmaazfalak@icloud.com') {
          inMemoryUsers.delete(key);
          deleted = true;
        }
      }
    }

    // 4. Delete from MongoDB if connected
    if (this.isDBConnected()) {
      try {
        if (mongoose.Types.ObjectId.isValid(idOrEmail)) {
          await User.findByIdAndDelete(idOrEmail).exec();
          deleted = true;
        } else {
          await User.deleteMany({
            $or: [
              { email: normalized },
              { _id: idOrEmail },
              { id: idOrEmail },
              { googleId: idOrEmail },
            ],
            email: { $ne: 'mmaazfalak@icloud.com' },
          }).exec();
          deleted = true;
        }
      } catch (err: any) {
        console.warn('[DB] MongoDB delete user error:', err.message);
      }
    }

    return deleted;
  },

  /**
   * Retrieve all real registered users across all database stores, with Supabase as the primary live authority
   */
  async getAllUsers(): Promise<UserRecord[]> {
    const userMap = new Map<string, UserRecord>();

    // 1. If Supabase is connected, query Supabase public.profiles as primary live authority
    let supaEmails: Set<string> | null = null;
    if (serverSupabase) {
      try {
        const { data: supaProfiles, error: supaErr } = await serverSupabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!supaErr && Array.isArray(supaProfiles)) {
          supaEmails = new Set<string>();
          supaProfiles.forEach((p: any) => {
            if (p.email) {
              const emailKey = p.email.toLowerCase().trim();
              supaEmails!.add(emailKey);
              const rec: UserRecord = {
                id: p.id,
                _id: p.id,
                fullName: p.full_name || emailKey.split('@')[0],
                name: p.full_name || emailKey.split('@')[0],
                email: emailKey,
                phone: p.phone || '',
                role: p.role || (emailKey === 'mmaazfalak@icloud.com' ? 'admin' : 'customer'),
                status: p.status || 'active',
                authProvider: p.auth_provider || 'email',
                avatarUrl: p.avatar_url || '',
                addresses: p.address
                  ? [
                      {
                        id: 'addr-' + p.id,
                        recipientName: p.full_name || 'Customer',
                        phone: p.phone || '',
                        address: p.address || p.default_shipping_address || '',
                        city: p.city || 'Islamabad',
                        state: p.state || 'ICT',
                        postalCode: p.postal_code || '44000',
                        country: p.country || 'Pakistan',
                        isDefault: true,
                      },
                    ]
                  : [],
                address: p.address || p.default_shipping_address || '',
                city: p.city || 'Islamabad',
                state: p.state || 'ICT',
                postalCode: p.postal_code || '44000',
                country: p.country || 'Pakistan',
                defaultShippingAddress: p.default_shipping_address || p.address || '',
                createdAt: p.created_at || new Date().toISOString(),
                updatedAt: p.updated_at || p.created_at || new Date().toISOString(),
                lastLoginAt: p.last_login_at,
              };
              userMap.set(emailKey, rec);
            }
          });
        }
      } catch (err: any) {
        console.warn('[DB] Supabase getAllUsers error:', err.message);
      }
    }

    // 2. Load from FileDB (users.json)
    try {
      const fileUsers = FileDB.getUsers();
      fileUsers.forEach((u) => {
        if (u.email) {
          const key = u.email.toLowerCase().trim();
          // If Supabase is active, only include if present in Supabase or if it is root Super Admin
          if (supaEmails && !supaEmails.has(key) && key !== 'mmaazfalak@icloud.com') {
            // Prune deleted Supabase user from FileDB
            FileDB.deleteUser(key);
            return;
          }
          const existing = userMap.get(key);
          userMap.set(key, { ...(existing || {}), ...u });
        }
      });
    } catch (err: any) {
      console.warn('[DB] FileDB getUsers error:', err.message);
    }

    // 3. Load from inMemoryUsers
    try {
      for (const [memKey, u] of inMemoryUsers.entries()) {
        if (u.email) {
          const key = u.email.toLowerCase().trim();
          if (supaEmails && !supaEmails.has(key) && key !== 'mmaazfalak@icloud.com') {
            inMemoryUsers.delete(memKey);
            continue;
          }
          const existing = userMap.get(key);
          userMap.set(key, { ...(existing || {}), ...u });
        }
      }
    } catch (err: any) {
      console.warn('[DB] inMemoryUsers iterate error:', err.message);
    }

    // 4. Load from MongoDB if connected
    if (this.isDBConnected()) {
      try {
        const docs = await User.find({}).sort({ createdAt: -1 }).exec();
        docs.forEach((d) => {
          if (d.email) {
            const key = d.email.toLowerCase().trim();
            if (supaEmails && !supaEmails.has(key) && key !== 'mmaazfalak@icloud.com') {
              // User was deleted from Supabase, remove from MongoDB
              User.findByIdAndDelete(d._id).exec().catch(() => {});
              return;
            }
            const existing = userMap.get(key);
            const mongoRecord: UserRecord = {
              id: d._id.toString(),
              _id: d._id.toString(),
              fullName: d.name,
              name: d.name,
              email: d.email,
              phone: d.phone || existing?.phone || '',
              passwordHash: d.password || existing?.passwordHash,
              password: d.password || existing?.password,
              googleId: d.googleId || existing?.googleId,
              role: d.role || existing?.role || 'customer',
              status: d.status || existing?.status || 'active',
              authProvider: d.authProvider || (d.googleId ? 'google' : 'email'),
              avatarUrl: d.avatarUrl || existing?.avatarUrl || '',
              addresses: (d.addresses && d.addresses.length > 0) ? d.addresses : (existing?.addresses || []),
              address: d.address || existing?.address || '',
              apartment: d.apartment || existing?.apartment || '',
              city: d.city || existing?.city || '',
              state: d.state || existing?.state || '',
              postalCode: d.postalCode || existing?.postalCode || '',
              country: d.country || existing?.country || 'Pakistan',
              defaultShippingAddress: d.defaultShippingAddress || existing?.defaultShippingAddress || '',
              createdAt: d.createdAt ? d.createdAt.toISOString() : (existing?.createdAt || new Date().toISOString()),
              updatedAt: d.updatedAt ? d.updatedAt.toISOString() : (existing?.updatedAt || new Date().toISOString()),
              lastLoginAt: d.lastLoginAt ? d.lastLoginAt.toISOString() : existing?.lastLoginAt,
            };
            userMap.set(key, mongoRecord);
          }
        });
      } catch (err: any) {
        console.warn('[DB] MongoDB getAllUsers query error:', err.message);
      }
    }

    return Array.from(userMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
};

