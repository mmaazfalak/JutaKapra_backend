import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { SupabaseProfile, Customer, StoreAccount, SupabaseStore, Product, PaymentGatewayConfig } from '../types';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (import.meta.env as any).SUPABASE_URL ||
  (import.meta.env as any).NEXT_PUBLIC_SUPABASE_URL ||
  'https://kbdrlhiishmetsddlstq.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  (import.meta.env as any).SUPABASE_PUBLISHABLE_KEY ||
  (import.meta.env as any).SUPABASE_ANON_KEY ||
  (import.meta.env as any).NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_r4PIdoHdJ5606fytYnajYA_DV0ekz1d';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project-ref.supabase.co' &&
    !supabaseUrl.includes('your-project-ref') &&
    !supabaseUrl.includes('placeholder')
  );
};

// Create Supabase client if configured, otherwise create a dummy instance for safety
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export const VALID_PROFILE_COLUMNS = new Set([
  'id',
  'full_name',
  'email',
  'avatar_url',
  'phone',
  'auth_provider',
  'role',
  'status',
  'default_shipping_address',
  'city',
  'state',
  'postal_code',
  'country',
  'created_at',
  'last_login_at',
]);

/**
 * Filter out any non-existent columns before upserting into public.profiles
 */
export const sanitizeProfilePayload = (data: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if ((key === 'address' || key === 'defaultShippingAddress') && !sanitized.default_shipping_address && val) {
      sanitized.default_shipping_address = val;
    } else if (VALID_PROFILE_COLUMNS.has(key) && val !== undefined) {
      sanitized[key] = val;
    }
  }
  return sanitized;
};

// Helper to convert Supabase User & Profile into application Customer object with address persistence
export const profileToCustomer = (profile: SupabaseProfile, fallbackUser?: SupabaseUser | null): Customer => {
  const addresses: any[] = [];
  const primaryAddress = profile.address || profile.default_shipping_address;
  if (primaryAddress) {
    addresses.push({
      id: 'addr-default-' + profile.id,
      recipientName: profile.full_name || fallbackUser?.user_metadata?.full_name || fallbackUser?.email?.split('@')[0] || 'Customer',
      phone: profile.phone || fallbackUser?.user_metadata?.phone || '',
      address: primaryAddress,
      city: profile.city || 'Islamabad',
      state: profile.state || 'ICT',
      postalCode: profile.postal_code || '44000',
      country: profile.country || 'Pakistan',
      isDefault: true,
    });
  }

  const rawAvatar = profile.avatar_url || fallbackUser?.user_metadata?.avatar_url || fallbackUser?.user_metadata?.picture;
  const avatarUrl =
    rawAvatar && !rawAvatar.includes('placeholder')
      ? rawAvatar
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || fallbackUser?.email?.split('@')[0] || 'User')}&background=0a0a0a&color=fff&size=200&bold=true`;

  const hasPwd = Boolean(
    profile.has_password ||
    profile.password_hash ||
    (fallbackUser?.user_metadata as any)?.has_password ||
    (typeof window !== 'undefined' && profile.email && localStorage.getItem('has_password_' + profile.email.toLowerCase()) === 'true')
  );

  return {
    id: profile.id,
    fullName: profile.full_name || fallbackUser?.user_metadata?.full_name || fallbackUser?.email?.split('@')[0] || 'Customer',
    email: profile.email || fallbackUser?.email || '',
    phone: profile.phone || fallbackUser?.user_metadata?.phone || '',
    avatarUrl,
    authProvider: profile.auth_provider || (fallbackUser?.app_metadata?.provider as any) || 'email',
    role: profile.role || 'customer',
    status: profile.status || 'active',
    accountType: 'REGISTERED',
    totalOrders: 0,
    lifetimeValue: 0,
    addresses,
    purchaseHistory: [],
    passwordHash: profile.password_hash || (hasPwd ? 'active' : undefined),
    hasPassword: hasPwd,
    createdAt: profile.created_at || new Date().toISOString(),
    lastLoginAt: profile.last_login_at || new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  };
};

/**
 * Fetch profile from public.profiles table by userId
 */
export const getSupabaseUserProfile = async (userIdOrEmail: string): Promise<SupabaseProfile | null> => {
  if (!isSupabaseConfigured() || !userIdOrEmail) return null;

  try {
    const isEmail = userIdOrEmail.includes('@');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdOrEmail);

    let query = supabase.from('profiles').select('*');
    if (isEmail) {
      query = query.eq('email', userIdOrEmail.toLowerCase().trim());
    } else if (isUuid) {
      query = query.eq('id', userIdOrEmail);
    } else {
      // Non-UUID string ID (e.g. google_xxx) - cannot query id column directly
      return null;
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      return null;
    }
    return data as SupabaseProfile;
  } catch (err) {
    return null;
  }
};

/**
 * Progressive Profile Enrichment: Upsert profile without overwriting existing data with nulls
 */
export const syncSupabaseUserProfile = async (
  user: SupabaseUser,
  customData?: {
    fullName?: string;
    phone?: string;
    role?: 'customer' | 'admin';
    address?: string;
    defaultShippingAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }
): Promise<SupabaseProfile | null> => {
  if (!isSupabaseConfigured()) return null;

  // 1. Fetch existing profile to preserve existing fields
  let existingProfile: SupabaseProfile | null = null;
  try {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    existingProfile = data as SupabaseProfile;
  } catch {}

  const provider = (user.app_metadata?.provider as any) || 'email';
  const newFullName =
    customData?.fullName ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Collector';

  const newAvatarUrl =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(newFullName)}&background=0a0a0a&color=fff&size=200&bold=true`;

  const newPhone = customData?.phone || user.user_metadata?.phone;

  // Progressive merge
  const finalFullName =
    existingProfile?.full_name && existingProfile.full_name !== 'Collector'
      ? existingProfile.full_name
      : newFullName;

  const finalAvatar =
    existingProfile?.avatar_url && !existingProfile.avatar_url.includes('ui-avatars.com')
      ? existingProfile.avatar_url
      : newAvatarUrl;

  const finalPhone = existingProfile?.phone || newPhone || '';

  const rawPayload: Record<string, any> = {
    id: user.id,
    email: (user.email || '').toLowerCase().trim(),
    full_name: finalFullName,
    avatar_url: finalAvatar,
    phone: finalPhone,
    auth_provider: provider === 'google' ? 'google' : (existingProfile?.auth_provider || 'email'),
    role: (user.email?.toLowerCase() === 'mmaazfalak@icloud.com') ? 'admin' : (existingProfile?.role || customData?.role || 'customer'),
    status: existingProfile?.status || 'active',
    default_shipping_address: customData?.defaultShippingAddress || customData?.address || existingProfile?.default_shipping_address,
    city: customData?.city || existingProfile?.city,
    state: customData?.state || existingProfile?.state,
    postal_code: customData?.postalCode || existingProfile?.postal_code,
    country: customData?.country || existingProfile?.country || 'Pakistan',
    last_login_at: new Date().toISOString(),
  };

  const profilePayload = sanitizeProfilePayload(rawPayload);

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Failed to upsert Supabase profile:', error.message);
      return null;
    }
    return data as SupabaseProfile;
  } catch (err) {
    console.error('Error in syncSupabaseUserProfile:', err);
    return null;
  }
};

/**
 * Update Profile details & saved address in public.profiles table
 */
export const updateSupabaseUserProfile = async (
  userId: string,
  updates: Partial<SupabaseProfile>
): Promise<{ success: boolean; data?: SupabaseProfile; error?: string }> => {
  if (!isSupabaseConfigured()) return { success: true };

  try {
    const rawPayload: Record<string, any> = {
      ...updates,
      id: userId,
      last_login_at: new Date().toISOString(),
    };
    const payload = sanitizeProfilePayload(rawPayload);

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: data as SupabaseProfile };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update profile in database' };
  }
};

/**
 * Allow Google / OTP users to set or update a password on their unified account
 */
export const setSupabaseUserPassword = async (
  password: string,
  userId?: string,
  email?: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) return { success: true };

  try {
    // Only attempt Supabase auth client update if an active browser auth session exists
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        console.warn('Supabase auth.updateUser note:', error.message);
      }
    }

    if (userId) {
      await supabase
        .from('profiles')
        .update({
          last_login_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } else if (email) {
      await supabase
        .from('profiles')
        .update({
          last_login_at: new Date().toISOString(),
        })
        .eq('email', email.toLowerCase().trim());
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update account password' };
  }
};

/**
 * Request password reset link for Unified Identity
 */
export const requestSupabasePasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) return { success: true };

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Password reset request failed' };
  }
};

/**
 * Fetch all registered users for Admin Portal
 */
export const fetchAllSupabaseUsers = async (): Promise<SupabaseProfile[]> => {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Admin fetch users error:', error.message);
      return [];
    }
    return (data as SupabaseProfile[]) || [];
  } catch (err) {
    console.error('Error fetching all users for admin:', err);
    return [];
  }
};

/**
 * Admin action: update user role and account status in database
 */
export const updateSupabaseUserRoleAndStatus = async (
  userId: string,
  role: 'customer' | 'admin',
  status: 'active' | 'suspended'
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role, status })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update user in Supabase' };
  }
};

/**
 * Admin action: delete user from Supabase public.profiles
 */
export const deleteSupabaseUser = async (userIdOrEmail: string): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !userIdOrEmail) {
    return { success: true };
  }

  try {
    const isEmail = userIdOrEmail.includes('@');
    let query = supabase.from('profiles').delete();
    if (isEmail) {
      query = query.ilike('email', userIdOrEmail.toLowerCase().trim());
    } else {
      query = query.eq('id', userIdOrEmail);
    }

    const { error } = await query;
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete user in Supabase' };
  }
};
/**
 * Convert local StoreAccount model to Supabase stores database row
 */
export const storeAccountToSupabase = (store: StoreAccount): SupabaseStore => {
  return {
    id: store.id,
    name: store.name,
    slug: store.slug || store.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    owner_email: (store.ownerEmail || '').toLowerCase().trim(),
    owner_name: store.ownerName || '',
    owner_phone: store.ownerPhone || '',
    passcode: store.passcode || '',
    status: store.status || 'active',
    is_hidden: Boolean(store.isHidden),
    city: store.city || '',
    address: store.address || '',
    commission_rate: typeof store.commissionRate === 'number' ? store.commissionRate : 10,
    logo_url: store.logoUrl || '',
    description: store.description || '',
    created_at: store.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

/**
 * Convert Supabase stores database row to application StoreAccount model
 */
export const supabaseToStoreAccount = (row: any): StoreAccount => {
  return {
    id: row.id,
    name: row.name || 'Vendor Store',
    slug: row.slug || (row.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    ownerEmail: row.owner_email || row.ownerEmail || '',
    ownerName: row.owner_name || row.ownerName || 'Store Owner',
    ownerPhone: row.owner_phone || row.ownerPhone || '',
    passcode: row.passcode || '',
    status: row.status === 'suspended' ? 'suspended' : 'active',
    isHidden: Boolean(row.is_hidden ?? row.isHidden ?? false),
    city: row.city || '',
    address: row.address || '',
    commissionRate: typeof row.commission_rate === 'number' ? row.commission_rate : (typeof row.commissionRate === 'number' ? row.commissionRate : 10),
    logoUrl: row.logo_url || row.logoUrl || '',
    description: row.description || '',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
};

/**
 * Fetch all Store accounts saved in Supabase database
 */
export const fetchSupabaseStores = async (): Promise<StoreAccount[]> => {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Table might not exist yet in fresh database
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        console.info('[Supabase] stores table not detected yet. Run supabase_master_schema.sql in Supabase SQL Editor.');
        return null;
      }
      console.warn('Supabase fetch stores notice:', error.message);
      return [];
    }

    if (Array.isArray(data) && data.length > 0) {
      return data.map(supabaseToStoreAccount);
    }
    return [];
  } catch (err) {
    console.error('Error in fetchSupabaseStores:', err);
    return [];
  }
};

/**
 * Upsert a Store entity directly into Supabase database
 */
export const syncSupabaseStore = async (
  store: StoreAccount
): Promise<{ success: boolean; data?: StoreAccount; error?: string }> => {
  if (!isSupabaseConfigured()) return { success: true, data: store };

  try {
    const payload = storeAccountToSupabase(store);
    const { data, error } = await supabase
      .from('stores')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Supabase store sync note:', error.message);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data ? supabaseToStoreAccount(data) : store,
    };
  } catch (err: any) {
    console.error('Error syncing store to Supabase:', err);
    return { success: false, error: err.message || 'Failed to sync store to Supabase' };
  }
};

/**
 * Update a Store entity in Supabase database
 */
export const updateSupabaseStore = async (
  storeId: string,
  updates: Partial<StoreAccount>
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) return { success: true };

  try {
    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
    if (updates.ownerEmail !== undefined) dbUpdates.owner_email = updates.ownerEmail.toLowerCase().trim();
    if (updates.ownerName !== undefined) dbUpdates.owner_name = updates.ownerName;
    if (updates.ownerPhone !== undefined) dbUpdates.owner_phone = updates.ownerPhone;
    if (updates.passcode !== undefined) dbUpdates.passcode = updates.passcode;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.isHidden !== undefined) dbUpdates.is_hidden = updates.isHidden;
    if (updates.city !== undefined) dbUpdates.city = updates.city;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.commissionRate !== undefined) dbUpdates.commission_rate = updates.commissionRate;
    if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
    if (updates.description !== undefined) dbUpdates.description = updates.description;

    const { error } = await supabase
      .from('stores')
      .update(dbUpdates)
      .eq('id', storeId);

    if (error) {
      console.warn('Supabase store update error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update store in database' };
  }
};

/**
 * Delete a Store entity from Supabase database
 */
export const deleteSupabaseStore = async (storeId: string): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !storeId) return { success: true };

  try {
    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', storeId);

    if (error) {
      console.warn('Supabase delete store note:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete store from database' };
  }
};

/**
 * Toggle Store visibility in Supabase database
 */
export const toggleSupabaseStoreVisibility = async (
  storeId: string,
  isHidden: boolean
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !storeId) return { success: true };

  try {
    const { error } = await supabase
      .from('stores')
      .update({ is_hidden: isHidden, updated_at: new Date().toISOString() })
      .eq('id', storeId);

    if (error) {
      console.warn('Supabase store visibility note:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to toggle store visibility' };
  }
};

/**
 * Seed or batch-upsert default stores to Supabase database
 */
export const seedInitialStoresToSupabase = async (initialStores: StoreAccount[]): Promise<void> => {
  if (!isSupabaseConfigured() || !Array.isArray(initialStores) || initialStores.length === 0) return;

  try {
    const payloads = initialStores.map(storeAccountToSupabase);
    await supabase.from('stores').upsert(payloads, { onConflict: 'id' });
  } catch (err) {
    console.warn('Supabase seed initial stores note:', err);
  }
};

// ==============================================================================
// PRODUCTS DATABASE ADAPTER (Supabase <-> Application)
// ==============================================================================

export const supabaseProductToFrontend = (row: any): Product => {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    subcategory: row.subcategory || undefined,
    era: row.era || '1990s',
    price: Number(row.price) || 0,
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    conditionGrade: row.condition_grade || 'Vintage 9/10',
    conditionTier: row.condition_tier || 'Good',
    size: row.size || 'One Size',
    measurements: typeof row.measurements === 'string' ? JSON.parse(row.measurements) : (row.measurements || {}),
    description: row.description || '',
    details: Array.isArray(row.details) ? row.details : (typeof row.details === 'string' ? JSON.parse(row.details) : []),
    images: Array.isArray(row.images) ? row.images : (typeof row.images === 'string' ? JSON.parse(row.images) : []),
    inStock: Boolean(row.in_stock),
    is1of1: Boolean(row.is_1of1),
    inventoryType: row.inventory_type || (row.is_1of1 ? 'thrift_1of1' : 'multi_stock'),
    stockCount: typeof row.stock_count === 'number' ? row.stock_count : (row.in_stock ? 1 : 0),
    storeId: row.store_id || 'store-f7-archive',
    storeName: row.store_name || 'F-7 Flagship Archive',
    isHidden: Boolean(row.is_hidden),
    isReserved: Boolean(row.is_reserved),
    isArchived: Boolean(row.is_archived),
    isHotDeal: Boolean(row.is_hot_deal),
    isTrending: Boolean(row.is_trending),
    tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === 'string' ? JSON.parse(row.tags) : []),
    dropBatch: row.drop_batch || undefined,
    dateAdded: row.date_added || new Date().toISOString(),
  };
};

export const frontendProductToSupabase = (p: Product): Record<string, any> => {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    category: p.category,
    subcategory: p.subcategory || null,
    era: p.era || '1990s',
    price: p.price,
    original_price: p.originalPrice || null,
    condition_grade: p.conditionGrade || 'Vintage 9/10',
    condition_tier: p.conditionTier || 'Good',
    size: p.size || 'One Size',
    measurements: p.measurements || {},
    description: p.description || '',
    details: p.details || [],
    images: p.images || [],
    in_stock: p.inStock,
    is_1of1: p.is1of1,
    inventory_type: p.inventoryType || 'thrift_1of1',
    stock_count: typeof p.stockCount === 'number' ? p.stockCount : 1,
    store_id: p.storeId || 'store-f7-archive',
    store_name: p.storeName || 'F-7 Flagship Archive',
    is_hidden: Boolean(p.isHidden),
    is_reserved: Boolean(p.isReserved),
    is_archived: Boolean(p.isArchived),
    is_hot_deal: Boolean(p.isHotDeal),
    is_trending: Boolean(p.isTrending),
    tags: p.tags || [],
    drop_batch: p.dropBatch || null,
    date_added: p.dateAdded || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

export const fetchSupabaseProducts = async (): Promise<{ success: boolean; data: Product[]; error?: string }> => {
  if (!isSupabaseConfigured()) return { success: false, data: [] };

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('date_added', { ascending: false });

    if (error) {
      return { success: false, data: [], error: error.message };
    }

    if (Array.isArray(data)) {
      return { success: true, data: data.map(supabaseProductToFrontend) };
    }

    return { success: true, data: [] };
  } catch (err: any) {
    return { success: false, data: [], error: err.message || 'Failed to fetch products' };
  }
};

export const syncSupabaseProduct = async (product: Product): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) return { success: true };

  try {
    const payload = frontendProductToSupabase(product);
    const { error } = await supabase
      .from('products')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] sync product error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to sync product' };
  }
};

export const deleteSupabaseProduct = async (id: string): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) return { success: true };

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete product' };
  }
};

export const seedInitialProductsToSupabase = async (initialProducts: Product[]): Promise<void> => {
  if (!isSupabaseConfigured() || !Array.isArray(initialProducts) || initialProducts.length === 0) return;

  try {
    const payloads = initialProducts.map(frontendProductToSupabase);
    await supabase.from('products').upsert(payloads, { onConflict: 'id' });
  } catch (err) {
    console.warn('Supabase seed initial products note:', err);
  }
};

// ==============================================================================
// PAYMENT GATEWAYS DATABASE ADAPTER (Supabase <-> Application)
// ==============================================================================

export const supabaseGatewayToFrontend = (row: any): PaymentGatewayConfig => {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    providerName: row.provider_name || row.providerName,
    isEnabled: Boolean(row.is_enabled !== undefined ? row.is_enabled : row.isEnabled),
    environment: row.environment || 'live',
    accountTitle: row.account_title || row.accountTitle,
    accountNumber: row.account_number || row.accountNumber,
    iban: row.iban,
    swiftCode: row.swift_code || row.swiftCode,
    bankName: row.bank_name || row.bankName,
    minOrderLimit: row.min_order_limit !== null ? Number(row.min_order_limit) : undefined,
    maxOrderLimit: row.max_order_limit !== null ? Number(row.max_order_limit) : undefined,
    disclaimerNote: row.disclaimer_note || row.disclaimerNote,
    customInstructions: row.custom_instructions || row.customInstructions,
    autoConfirmCOD: Boolean(row.auto_confirm_cod || row.autoConfirmCOD),
    publishableKey: row.publishable_key || row.publishableKey,
    encryptedSecretKey: row.encrypted_secret_key || row.encryptedSecretKey,
    webhookSecret: row.webhook_secret || row.webhookSecret,
    webhookEndpoint: row.webhook_endpoint || row.webhookEndpoint,
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
};

export const frontendGatewayToSupabase = (gw: PaymentGatewayConfig): Record<string, any> => {
  return {
    id: gw.id,
    type: gw.type,
    title: gw.title,
    provider_name: gw.providerName,
    is_enabled: Boolean(gw.isEnabled),
    environment: gw.environment || 'live',
    account_title: gw.accountTitle || null,
    account_number: gw.accountNumber || null,
    iban: gw.iban || null,
    swift_code: gw.swiftCode || null,
    bank_name: gw.bankName || null,
    min_order_limit: gw.minOrderLimit || null,
    max_order_limit: gw.maxOrderLimit || null,
    disclaimer_note: gw.disclaimerNote || null,
    custom_instructions: gw.customInstructions || null,
    auto_confirm_cod: Boolean(gw.autoConfirmCOD),
    publishable_key: gw.publishableKey || null,
    encrypted_secret_key: gw.encryptedSecretKey || null,
    webhook_secret: gw.webhookSecret || null,
    webhook_endpoint: gw.webhookEndpoint || null,
    updated_at: new Date().toISOString(),
  };
};

export const fetchSupabasePaymentGateways = async (): Promise<{ success: boolean; data: PaymentGatewayConfig[]; error?: string }> => {
  if (!isSupabaseConfigured()) return { success: false, data: [] };

  try {
    const { data, error } = await supabase
      .from('payment_gateways')
      .select('*');

    if (error) {
      return { success: false, data: [], error: error.message };
    }

    if (Array.isArray(data)) {
      return { success: true, data: data.map(supabaseGatewayToFrontend) };
    }

    return { success: true, data: [] };
  } catch (err: any) {
    return { success: false, data: [], error: err.message || 'Failed to fetch payment gateways' };
  }
};

export const syncSupabasePaymentGateway = async (gw: PaymentGatewayConfig): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) return { success: true };

  try {
    const payload = frontendGatewayToSupabase(gw);
    const { error } = await supabase
      .from('payment_gateways')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] sync payment gateway error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to sync payment gateway' };
  }
};

export const deleteSupabasePaymentGateway = async (id: string): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) return { success: true };

  try {
    const { error } = await supabase
      .from('payment_gateways')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete payment gateway' };
  }
};

export const seedInitialGatewaysToSupabase = async (initialGateways: PaymentGatewayConfig[]): Promise<void> => {
  if (!isSupabaseConfigured() || !Array.isArray(initialGateways) || initialGateways.length === 0) return;

  try {
    const payloads = initialGateways.map(frontendGatewayToSupabase);
    await supabase.from('payment_gateways').upsert(payloads, { onConflict: 'id' });
  } catch (err) {
    console.warn('Supabase seed initial gateways note:', err);
  }
};
