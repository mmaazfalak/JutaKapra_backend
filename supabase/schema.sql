-- ==============================================================================
-- JUTA.KAPRA ARCHIVE - UNIFIED SUPABASE AUTH & PROGRESSIVE PROFILE ENRICHMENT
-- ==============================================================================

-- 1. Create Profiles table linked directly to Supabase Auth (auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  phone TEXT,
  auth_provider TEXT NOT NULL DEFAULT 'email' CHECK (auth_provider IN ('google', 'email', 'guest')),
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  default_shipping_address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Pakistan',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for instant lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- ==============================================================================
-- 2. HELPER SECURITY FUNCTION: IS_ADMIN (NON-RECURSIVE JWT CHECK)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    (COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
    OR (COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin')
    OR (LOWER(COALESCE(auth.jwt() ->> 'email', '')) = 'mmaazfalak@icloud.com');
$$;

-- ==============================================================================
-- 3. DROP ALL EXISTING POLICIES TO PREVENT RECURSION
-- ==============================================================================
DO $$ 
DECLARE 
    pol record;
BEGIN 
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('profiles', 'orders')) 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename); 
    END LOOP; 
END $$;

-- ==============================================================================
-- 4. PROFILES TABLE RLS POLICIES (ZERO RECURSION)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_policy"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "profiles_insert_policy"
ON public.profiles FOR INSERT
WITH CHECK (
  auth.uid() = id OR public.is_admin() OR auth.role() = 'service_role' OR auth.role() = 'anon'
);

CREATE POLICY "profiles_update_policy"
ON public.profiles FOR UPDATE
USING (
  auth.uid() = id OR public.is_admin() OR auth.role() = 'service_role'
)
WITH CHECK (
  auth.uid() = id OR public.is_admin() OR auth.role() = 'service_role'
);

CREATE POLICY "profiles_delete_policy"
ON public.profiles FOR DELETE
USING (
  public.is_admin() OR auth.role() = 'service_role'
);

-- 5. Trigger Function: Progressive Profile Enrichment (Automatic Identity Linking & Data Preservation)
CREATE OR REPLACE FUNCTION public.handle_user_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider TEXT;
  v_full_name TEXT;
  v_avatar TEXT;
  v_phone TEXT;
  v_role TEXT := 'customer';
BEGIN
  -- Detect provider (Google OAuth or email)
  v_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  IF v_provider NOT IN ('google', 'email') THEN
    v_provider := 'email';
  END IF;

  -- Extract display name from Google OAuth metadata or sign-up form
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Extract avatar URL from Google OAuth or fallback to avatar generator
  v_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    'https://ui-avatars.com/api/?name=' || replace(v_full_name, ' ', '+') || '&background=0a0a0a&color=fff&size=200&bold=true'
  );

  v_phone := NEW.raw_user_meta_data->>'phone';

  -- Primary Super Admin Account auto-elevation
  IF LOWER(NEW.email) = 'mmaazfalak@icloud.com' THEN
    v_role := 'admin';
  END IF;

  -- Progressive Profile UPSERT
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    avatar_url,
    phone,
    auth_provider,
    role,
    status,
    created_at,
    last_login_at
  )
  VALUES (
    NEW.id,
    v_full_name,
    LOWER(NEW.email),
    v_avatar,
    v_phone,
    v_provider,
    v_role,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE 
      WHEN profiles.full_name IS NULL OR profiles.full_name = '' OR profiles.full_name = 'Collector' 
      THEN COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name) 
      ELSE profiles.full_name 
    END,
    avatar_url = CASE 
      WHEN (profiles.avatar_url IS NULL OR profiles.avatar_url LIKE '%ui-avatars.com%') AND EXCLUDED.avatar_url NOT LIKE '%ui-avatars.com%' 
      THEN EXCLUDED.avatar_url 
      ELSE COALESCE(profiles.avatar_url, EXCLUDED.avatar_url) 
    END,
    phone = COALESCE(profiles.phone, EXCLUDED.phone),
    auth_provider = CASE 
      WHEN EXCLUDED.auth_provider = 'google' THEN 'google' 
      ELSE profiles.auth_provider 
    END,
    role = CASE 
      WHEN LOWER(EXCLUDED.email) = 'mmaazfalak@icloud.com' THEN 'admin' 
      ELSE profiles.role 
    END,
    last_login_at = NOW();

  RETURN NEW;
END;
$$;

-- 6. Attach Trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_sync ON auth.users;

CREATE TRIGGER on_auth_user_sync
  AFTER INSERT OR UPDATE OF last_sign_in_at, raw_user_meta_data, raw_app_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_sync();

-- 7. Reset and Elevate Single Super Admin
UPDATE public.profiles 
SET role = 'admin', status = 'active' 
WHERE LOWER(email) = 'mmaazfalak@icloud.com';

-- ==============================================================================
-- 8. ORDERS TABLE & REAL-TIME DISPATCH FULFILLMENT
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  shipping NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cod',
  status TEXT NOT NULL DEFAULT 'Processing',
  courier TEXT,
  tracking_number TEXT,
  courier_tracking JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

-- Orders Indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(LOWER(customer_email));
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Enable RLS for Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_policy"
ON public.orders FOR SELECT
USING (true);

CREATE POLICY "orders_insert_policy"
ON public.orders FOR INSERT
WITH CHECK (true);

CREATE POLICY "orders_update_policy"
ON public.orders FOR UPDATE
USING (
  public.is_admin() OR auth.role() = 'service_role' OR auth.uid()::text = customer_id
);

CREATE POLICY "orders_delete_policy"
ON public.orders FOR DELETE
USING (
  public.is_admin() OR auth.role() = 'service_role'
);

