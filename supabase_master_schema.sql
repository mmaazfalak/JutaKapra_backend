-- ==============================================================================
-- JUTA.KAPRA MASTER DATABASE SCHEMA FOR SUPABASE
-- Run this entire script in Supabase Dashboard -> SQL Editor -> New Query
-- Target Project: https://kbdrlhiishmetsddlstq.supabase.co
-- ==============================================================================

-- 0. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. USERS & PROFILES TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
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

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Users Table (Direct authentication / backup)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  auth_provider TEXT NOT NULL DEFAULT 'email' CHECK (auth_provider IN ('email', 'google', 'guest')),
  avatar_url TEXT,
  address TEXT,
  apartment TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Pakistan',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Password Reset OTPs
CREATE TABLE IF NOT EXISTS public.password_reset_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON public.password_reset_otps(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expiry ON public.password_reset_otps(expires_at);

-- ==============================================================================
-- 2. MULTI-VENDOR STORES TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.stores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    owner_name TEXT,
    owner_phone TEXT,
    passcode TEXT DEFAULT 'store123',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    city TEXT DEFAULT 'Islamabad',
    address TEXT,
    commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    logo_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stores_owner_email ON public.stores (LOWER(owner_email));
CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores (slug);
CREATE INDEX IF NOT EXISTS idx_stores_status ON public.stores (status);
CREATE INDEX IF NOT EXISTS idx_stores_is_hidden ON public.stores (is_hidden);

-- Seed initial stores if empty
INSERT INTO public.stores (id, name, slug, owner_email, owner_name, owner_phone, passcode, status, is_hidden, city, address, commission_rate, description)
VALUES 
    ('store-f7-archive', 'F-7 Flagship Archive', 'f7-archive', 'mmaazfalak@icloud.com', 'Maaz Falak', '+923000000000', 'store123', 'active', FALSE, 'Islamabad', 'Sector F-7/2, Street 15, Suite 402', 10.00, 'Primary central vault and vintage sneaker curation hub.'),
    ('store-vintage-vault', 'Vintage Vault', 'vintage-vault', 'vault@jutakapra.pk', 'Hamza Khan', '+923120000000', 'vault123', 'active', FALSE, 'Islamabad', 'Centaurus Mall, 2nd Floor, Islamabad', 12.00, 'Grail t-shirts, vintage track jackets, and 90s collectibles.')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 3. ORDERS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address JSONB,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cod',
  status TEXT NOT NULL DEFAULT 'Pending',
  courier_name TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  store_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(LOWER(customer_email));
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow public read of active stores
DROP POLICY IF EXISTS "Public can read active stores" ON public.stores;
CREATE POLICY "Public can read active stores" ON public.stores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public or Service can manage stores" ON public.stores;
CREATE POLICY "Public or Service can manage stores" ON public.stores FOR ALL USING (true) WITH CHECK (true);

-- Allow public and users to read/update profiles
DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;
CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow user update profile" ON public.profiles;
CREATE POLICY "Allow user update profile" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- Allow orders create and read
DROP POLICY IF EXISTS "Allow insert orders" ON public.orders;
CREATE POLICY "Allow insert orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read orders" ON public.orders;
CREATE POLICY "Allow read orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update orders" ON public.orders;
CREATE POLICY "Allow update orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);

-- Allow users manage
DROP POLICY IF EXISTS "Allow manage users" ON public.users;
CREATE POLICY "Allow manage users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow manage otps" ON public.password_reset_otps;
CREATE POLICY "Allow manage otps" ON public.password_reset_otps FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 5. AUTO-PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    avatar_url,
    phone,
    auth_provider,
    role,
    status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    CASE 
      WHEN NEW.raw_app_meta_data->>'provider' = 'google' THEN 'google'
      ELSE 'email'
    END,
    'customer',
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    last_login_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
