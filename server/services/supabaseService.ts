import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://kbdrlhiishmetsddlstq.supabase.co';

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_r4PIdoHdJ5606fytYnajYA_DV0ekz1d';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[SupabaseService] SUPABASE_URL or Service Role Key not configured.');
    return null;
  }
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return supabaseClient;
}

/**
 * Verify customer credentials directly with Supabase Auth
 */
export async function verifySupabaseAuth(
  email: string,
  password: string
): Promise<{ success: boolean; user: any | null; error?: string }> {
  if (!email || !password) return { success: false, user: null };
  const normalizedEmail = email.toLowerCase().trim();

  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    '';

  try {
    const anonClient = createClient(SUPABASE_URL, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authErr } = await anonClient.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (authData?.user && !authErr) {
      return { success: true, user: authData.user };
    }

    const adminClient = getSupabaseAdmin();
    if (adminClient) {
      const { data: adminAuthData, error: adminAuthErr } = await adminClient.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (adminAuthData?.user && !adminAuthErr) {
        return { success: true, user: adminAuthData.user };
      }
    }

    return { success: false, user: null, error: authErr?.message || 'Invalid credentials' };
  } catch (err: any) {
    return { success: false, user: null, error: err.message };
  }
}

/**
 * Update user password directly in Supabase Auth
 */
export async function updateSupabaseUserPassword(
  emailOrId: string,
  newPassword: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !emailOrId || !newPassword) return false;

  const key = emailOrId.toLowerCase().trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);

  try {
    let authUserId: string | null = null;
    if (isUuid) {
      authUserId = key;
    } else {
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existing = (listData?.users as any[])?.find(
        (u: any) => u.email?.toLowerCase().trim() === key
      );
      if (existing?.id) {
        authUserId = existing.id;
      }
    }

    if (authUserId) {
      const { error } = await supabase.auth.admin.updateUserById(authUserId, {
        password: newPassword,
        email_confirm: true,
      });
      if (!error) {
        console.log(`✅ [SupabaseService] Password updated for user ${authUserId}`);
        return true;
      }
      console.warn('[SupabaseService] updateUserById error:', error.message);
    } else {
      const { data: created } = await supabase.auth.admin.createUser({
        email: key,
        password: newPassword,
        email_confirm: true,
      });
      if (created?.user) {
        console.log(`✅ [SupabaseService] Created auth user with password for ${key}`);
        return true;
      }
    }
  } catch (err: any) {
    console.error('[SupabaseService] updateSupabaseUserPassword error:', err.message);
  }
  return false;
}

/**
 * Synchronize user profile into Supabase auth.users & public.profiles, returning canonical UUID
 */
export async function syncProfileToSupabase(user: {
  id?: string;
  _id?: string;
  email: string;
  fullName?: string;
  name?: string;
  phone?: string;
  avatarUrl?: string;
  role?: 'customer' | 'admin';
  status?: 'active' | 'suspended';
  authProvider?: 'google' | 'email' | 'guest';
  password?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  defaultShippingAddress?: string;
}): Promise<{ success: boolean; id: string | null; profile: any | null }> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !user.email) return { success: false, id: null, profile: null };

  const normalizedEmail = user.email.toLowerCase().trim();
  const displayName = user.fullName || user.name || normalizedEmail.split('@')[0];

  try {
    // 1. Check if user already exists in auth.users or public.profiles
    let authUserId: string | null = null;
    let existingProfile: any = null;

    const { data: foundProfile } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (foundProfile?.id) {
      authUserId = foundProfile.id;
      existingProfile = foundProfile;
      if (user.password) {
        try {
          await supabase.auth.admin.updateUserById(authUserId, {
            password: user.password,
            email_confirm: true,
          });
        } catch {}
      }
    } else {
      // Check auth.users directly
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existingAuth = (listData?.users as any[])?.find(
        (u: any) => u.email?.toLowerCase().trim() === normalizedEmail
      );

      if (existingAuth?.id) {
        authUserId = existingAuth.id;
        if (user.password) {
          try {
            await supabase.auth.admin.updateUserById(authUserId, {
              password: user.password,
              email_confirm: true,
            });
          } catch {}
        }
      } else {
        // Create user in auth.users so foreign key constraint profiles_id_fkey is satisfied
        const createPayload: any = {
          email: normalizedEmail,
          email_confirm: true,
          user_metadata: {
            full_name: displayName,
            name: displayName,
            avatar_url: user.avatarUrl || '',
            phone: user.phone || '',
            provider: user.authProvider || 'email',
          },
        };
        if (user.password) {
          createPayload.password = user.password;
        }

        const { data: createdAuth, error: createAuthError } =
          await supabase.auth.admin.createUser(createPayload);

        if (createdAuth?.user) {
          authUserId = createdAuth.user.id;
        } else if (createAuthError) {
          console.warn('[SupabaseService] createUser notice:', createAuthError.message);
          const { data: retryList } = await supabase.auth.admin.listUsers();
          const retryAuth = (retryList?.users as any[])?.find(
            (u: any) => u.email?.toLowerCase().trim() === normalizedEmail
          );
          if (retryAuth?.id) {
            authUserId = retryAuth.id;
          }
        }
      }
    }

    if (!authUserId) {
      console.warn('[SupabaseService] Unable to obtain auth.user UUID for profile:', normalizedEmail);
      return { success: false, id: null, profile: null };
    }

    // Preserve existing custom fields if already set
    const finalFullName =
      existingProfile?.full_name && existingProfile.full_name !== 'Collector' && existingProfile.full_name !== 'Customer'
        ? (user.fullName || existingProfile.full_name)
        : (user.fullName || user.name || existingProfile?.full_name || displayName);

    const finalPhone = user.phone || existingProfile?.phone || '';
    const finalAvatar =
      user.avatarUrl && !user.avatarUrl.includes('ui-avatars.com')
        ? user.avatarUrl
        : (existingProfile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(finalFullName)}&background=0a0a0a&color=fff&size=200&bold=true`);

    const finalAddress = user.address || user.defaultShippingAddress || existingProfile?.address || existingProfile?.default_shipping_address || '';
    const finalCity = user.city || existingProfile?.city || '';
    const finalState = user.state || existingProfile?.state || '';
    const finalPostalCode = user.postalCode || existingProfile?.postal_code || '';
    const finalCountry = user.country || existingProfile?.country || 'Pakistan';
    const finalRole = normalizedEmail === 'mmaazfalak@icloud.com' ? 'admin' : (existingProfile?.role || user.role || 'customer');
    const finalStatus = existingProfile?.status || user.status || 'active';

    const profilePayload: Record<string, any> = {
      id: authUserId,
      email: normalizedEmail,
      full_name: finalFullName,
      phone: finalPhone,
      avatar_url: finalAvatar,
      auth_provider: user.authProvider || existingProfile?.auth_provider || 'email',
      role: finalRole,
      status: finalStatus,
      default_shipping_address: finalAddress,
      city: finalCity,
      state: finalState,
      postal_code: finalPostalCode,
      country: finalCountry,
      last_login_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' });

    if (profileError) {
      console.error('[SupabaseService] Upsert profile error:', profileError.message);
      return { success: false, id: authUserId, profile: null };
    }

    console.log(`✅ [SupabaseService] Synced profile for ${normalizedEmail} (ID: ${authUserId}) to public.profiles`);
    return { success: true, id: authUserId, profile: profilePayload };
  } catch (err: any) {
    console.error('[SupabaseService] syncProfileToSupabase unexpected error:', err.message);
    return { success: false, id: null, profile: null };
  }
}

/**
 * Synchronize order into Supabase public.orders
 */
export async function syncOrderToSupabase(order: any): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const orderNumber = order.orderNumber || order.order_number;
  if (!supabase || !orderNumber) return false;

  const orderId = String(order.id || order._id || orderNumber);
  const customerName = order.customer?.fullName || order.customerName || order.customer_name || 'Customer';
  const customerEmail = (order.customer?.email || order.customerEmail || order.customer_email || '').toLowerCase().trim();
  const customerPhone = order.customer?.phone || order.customerPhone || order.customer_phone || '';
  const address = order.customer?.address || order.shippingAddress || order.shipping_address || '';
  const customerId = order.customerId || order.customer_id || null;

  try {
    const orderPayload = {
      id: orderId,
      order_number: orderNumber,
      customer_id: customerId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      shipping_address: address,
      items: Array.isArray(order.items) ? order.items : [],
      subtotal: Number(order.subtotal) || Number(order.total_amount) || Number(order.total) || 0,
      shipping: Number(order.shipping) || 0,
      discount: Number(order.discount) || 0,
      total: Number(order.total) || Number(order.total_amount) || 0,
      payment_method: order.paymentMethod || order.payment_method || 'cod',
      status: order.status || order.order_status || 'Processing',
      courier: order.courier || null,
      tracking_number: order.trackingNumber || order.tracking_number || null,
      courier_tracking: order.courierTracking || order.courier_tracking || null,
      created_at: order.createdAt || order.created_at ? new Date(order.createdAt || order.created_at).toISOString() : new Date().toISOString(),
      delivered_at: order.deliveredAt || order.delivered_at ? new Date(order.deliveredAt || order.delivered_at).toISOString() : null,
    };

    const { error } = await supabase
      .from('orders')
      .upsert(orderPayload, { onConflict: 'id' });

    if (error) {
      console.error('[SupabaseService] Upsert order error:', error.message);
      return false;
    }

    console.log(`✅ [SupabaseService] Synced order #${order.orderNumber} ($${order.total}) to public.orders`);
    return true;
  } catch (err: any) {
    console.error('[SupabaseService] syncOrderToSupabase unexpected error:', err.message);
    return false;
  }
}

/**
 * Delete a user from Supabase auth.users and public.profiles
 */
export async function deleteUserFromSupabase(userIdOrEmail: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !userIdOrEmail) return false;

  try {
    const isEmail = userIdOrEmail.includes('@');
    let authId: string | null = null;
    let email: string | null = null;

    if (isEmail) {
      email = userIdOrEmail.toLowerCase().trim();
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email')
        .ilike('email', email)
        .maybeSingle();

      if (profile?.id) {
        authId = profile.id;
      } else {
        const { data: listData } = await supabase.auth.admin.listUsers();
        const found = (listData?.users as any[])?.find(
          (u: any) => u.email?.toLowerCase().trim() === email
        );
        if (found?.id) authId = found.id;
      }
    } else {
      authId = userIdOrEmail;
    }

    // 1. Delete from public.profiles
    if (authId) {
      await supabase.from('profiles').delete().eq('id', authId);
    }
    if (email) {
      await supabase.from('profiles').delete().ilike('email', email);
    }

    // 2. Delete from auth.users via Admin API
    if (authId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authId)) {
      const { error: authErr } = await supabase.auth.admin.deleteUser(authId);
      if (authErr) {
        console.warn('[SupabaseService] deleteUser from auth.users warning:', authErr.message);
      }
    }

    console.log(`✅ [SupabaseService] Deleted user (${userIdOrEmail}) from Supabase.`);
    return true;
  } catch (err: any) {
    console.error('[SupabaseService] deleteUserFromSupabase unexpected error:', err.message);
    return false;
  }
}

/**
 * Fetch all profiles directly from Supabase public.profiles table
 */
export async function fetchAllSupabaseProfiles(): Promise<any[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[SupabaseService] fetchAllSupabaseProfiles error:', error.message);
      return [];
    }
    return data || [];
  } catch (err: any) {
    console.error('[SupabaseService] fetchAllSupabaseProfiles unexpected error:', err.message);
    return [];
  }
}

/**
 * Delete an order from Supabase public.orders
 */
export async function deleteOrderFromSupabase(orderIdOrNumber: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !orderIdOrNumber) return false;

  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .or(`id.eq.${orderIdOrNumber},order_number.eq.${orderIdOrNumber}`);

    if (error) {
      console.warn('[SupabaseService] deleteOrder error:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[SupabaseService] deleteOrderFromSupabase unexpected error:', err.message);
    return false;
  }
}

