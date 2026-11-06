-- ==============================================================================
-- 1. CREATE TABLES & POLICIES (Run this in Supabase SQL Editor)
-- Target: https://kbdrlhiishmetsddlstq.supabase.co
-- ==============================================================================

-- A. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  era TEXT NOT NULL DEFAULT '1990s',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  original_price NUMERIC(10,2),
  condition_grade TEXT NOT NULL DEFAULT 'Vintage 9/10',
  condition_tier TEXT NOT NULL DEFAULT 'Good',
  size TEXT NOT NULL DEFAULT 'One Size',
  measurements JSONB DEFAULT '{}'::jsonb,
  description TEXT NOT NULL DEFAULT '',
  details JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  in_stock BOOLEAN NOT NULL DEFAULT TRUE,
  is_1of1 BOOLEAN NOT NULL DEFAULT TRUE,
  inventory_type TEXT DEFAULT 'thrift_1of1',
  stock_count INT DEFAULT 1,
  store_id TEXT DEFAULT 'store-f7-archive',
  store_name TEXT DEFAULT 'F-7 Flagship Archive',
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  is_reserved BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  is_hot_deal BOOLEAN NOT NULL DEFAULT FALSE,
  is_trending BOOLEAN NOT NULL DEFAULT FALSE,
  tags JSONB DEFAULT '[]'::jsonb,
  drop_batch TEXT,
  date_added TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public or service manage products" ON public.products;
CREATE POLICY "Public or service manage products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- B. PAYMENT GATEWAYS TABLE
CREATE TABLE IF NOT EXISTS public.payment_gateways (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  environment TEXT DEFAULT 'live',
  account_title TEXT,
  account_number TEXT,
  iban TEXT,
  swift_code TEXT,
  bank_name TEXT,
  min_order_limit NUMERIC(10,2),
  max_order_limit NUMERIC(10,2),
  disclaimer_note TEXT,
  custom_instructions TEXT,
  auto_confirm_cod BOOLEAN DEFAULT FALSE,
  publishable_key TEXT,
  encrypted_secret_key TEXT,
  webhook_secret TEXT,
  webhook_endpoint TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read payment gateways" ON public.payment_gateways;
CREATE POLICY "Public read payment gateways" ON public.payment_gateways FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public or service manage payment gateways" ON public.payment_gateways;
CREATE POLICY "Public or service manage payment gateways" ON public.payment_gateways FOR ALL USING (true) WITH CHECK (true);
