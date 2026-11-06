-- ==============================================================================
-- JUTA.KAPRA: 100% DYNAMIC PRODUCTS & PAYMENT GATEWAYS MASTER SCHEMA FOR SUPABASE
-- Run this script in Supabase Dashboard -> SQL Editor -> New Query
-- Target Database: https://kbdrlhiishmetsddlstq.supabase.co
-- Zero-Code Data Architecture: Every product & payment method lives in Supabase.
-- ==============================================================================

-- 1. PRODUCTS TABLE DDL
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

-- Indexes for high-speed catalog querying
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_is_hidden ON public.products(is_hidden);
CREATE INDEX IF NOT EXISTS idx_products_date_added ON public.products(date_added DESC);

-- Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public or service manage products" ON public.products;
CREATE POLICY "Public or service manage products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- 2. PAYMENT GATEWAYS TABLE DDL
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

-- Indexes & RLS for Payment Gateways
CREATE INDEX IF NOT EXISTS idx_payment_gateways_type ON public.payment_gateways(type);
CREATE INDEX IF NOT EXISTS idx_payment_gateways_enabled ON public.payment_gateways(is_enabled);

ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read payment gateways" ON public.payment_gateways;
CREATE POLICY "Public read payment gateways" ON public.payment_gateways FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public or service manage payment gateways" ON public.payment_gateways;
CREATE POLICY "Public or service manage payment gateways" ON public.payment_gateways FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 3. SEED PAYMENT GATEWAYS (COD, Easypaisa, JazzCash, Meezan Bank, Stripe, TomPay)
-- ------------------------------------------------------------------------------
INSERT INTO public.payment_gateways (
  id, type, title, provider_name, is_enabled, environment, account_title, account_number,
  iban, swift_code, bank_name, min_order_limit, max_order_limit, disclaimer_note, custom_instructions,
  publishable_key, updated_at
) VALUES (
  'gw-cod', 'cod', 'Cash on Delivery (COD)', 'Cash on Delivery', TRUE, 'live', NULL, NULL, NULL, NULL, NULL, 500, 100000, 'Cash payment collected by courier rider upon physical delivery.', NULL, NULL, NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  provider_name = EXCLUDED.provider_name,
  is_enabled = EXCLUDED.is_enabled,
  min_order_limit = EXCLUDED.min_order_limit,
  max_order_limit = EXCLUDED.max_order_limit,
  disclaimer_note = EXCLUDED.disclaimer_note,
  updated_at = NOW();

INSERT INTO public.payment_gateways (
  id, type, title, provider_name, is_enabled, environment, account_title, account_number,
  iban, swift_code, bank_name, min_order_limit, max_order_limit, disclaimer_note, custom_instructions,
  publishable_key, updated_at
) VALUES (
  'gw-easypaisa', 'easypaisa', 'Easypaisa Mobile Wallet', 'Telenor Bank Easypaisa', TRUE, 'live', 'Forge Supply Operations', '0300 5550192', NULL, NULL, NULL, NULL, NULL, NULL, 'Transfer total amount to Easypaisa number 03005550192. Attach Order ID as message reference.', NULL, NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  provider_name = EXCLUDED.provider_name,
  is_enabled = EXCLUDED.is_enabled,
  account_title = EXCLUDED.account_title,
  account_number = EXCLUDED.account_number,
  custom_instructions = EXCLUDED.custom_instructions,
  updated_at = NOW();

INSERT INTO public.payment_gateways (
  id, type, title, provider_name, is_enabled, environment, account_title, account_number,
  iban, swift_code, bank_name, min_order_limit, max_order_limit, disclaimer_note, custom_instructions,
  publishable_key, updated_at
) VALUES (
  'gw-jazzcash', 'jazzcash', 'JazzCash Mobile Wallet', 'Mobilink Microfinance JazzCash', TRUE, 'live', 'Forge Supply Operations', '0300 5550192', NULL, NULL, NULL, NULL, NULL, NULL, 'Transfer payment to JazzCash wallet 03005550192. Send confirmation screenshot.', NULL, NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  provider_name = EXCLUDED.provider_name,
  is_enabled = EXCLUDED.is_enabled,
  account_title = EXCLUDED.account_title,
  account_number = EXCLUDED.account_number,
  custom_instructions = EXCLUDED.custom_instructions,
  updated_at = NOW();

INSERT INTO public.payment_gateways (
  id, type, title, provider_name, is_enabled, environment, account_title, account_number,
  iban, swift_code, bank_name, min_order_limit, max_order_limit, disclaimer_note, custom_instructions,
  publishable_key, updated_at
) VALUES (
  'gw-meezan', 'bank', 'Meezan Bank Limited Transfer', 'Meezan Bank Ltd', TRUE, 'live', 'Forge Supply Pvt Ltd', '01010102940192', 'PK36MEZN0001010102940192', 'MEZNPKKA', 'Meezan Bank', NULL, NULL, NULL, 'Direct bank transfer to Meezan Bank. Immediate verification upon receipt.', NULL, NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  provider_name = EXCLUDED.provider_name,
  is_enabled = EXCLUDED.is_enabled,
  account_title = EXCLUDED.account_title,
  account_number = EXCLUDED.account_number,
  iban = EXCLUDED.iban,
  swift_code = EXCLUDED.swift_code,
  bank_name = EXCLUDED.bank_name,
  custom_instructions = EXCLUDED.custom_instructions,
  updated_at = NOW();

INSERT INTO public.payment_gateways (
  id, type, title, provider_name, is_enabled, environment, account_title, account_number,
  iban, swift_code, bank_name, min_order_limit, max_order_limit, disclaimer_note, custom_instructions,
  publishable_key, updated_at
) VALUES (
  'gw-stripe', 'stripe', 'Credit / Debit Cards (Stripe)', 'Stripe Payments Inc.', TRUE, 'live', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pk_test_placeholder_key', NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  provider_name = EXCLUDED.provider_name,
  is_enabled = EXCLUDED.is_enabled,
  publishable_key = EXCLUDED.publishable_key,
  updated_at = NOW();

INSERT INTO public.payment_gateways (
  id, type, title, provider_name, is_enabled, environment, account_title, account_number,
  iban, swift_code, bank_name, min_order_limit, max_order_limit, disclaimer_note, custom_instructions,
  publishable_key, updated_at
) VALUES (
  'gw-tompay', 'tompay', 'TomPay - Card & Digital Wallet (UK / Global)', 'TomPay Financial Services Ltd', TRUE, 'live', NULL, NULL, NULL, NULL, NULL, 500, 500000, 'Pay securely via TomPay with global credit/debit cards and local wallets.', 'Instant redirect to TomPay PCI-DSS Level 1 secure payment checkout session.', 'tp_live_8Oytj1Sc5WYTaCzZCSDCFDbSjeK0Frwx', NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  provider_name = EXCLUDED.provider_name,
  is_enabled = EXCLUDED.is_enabled,
  publishable_key = EXCLUDED.publishable_key,
  min_order_limit = EXCLUDED.min_order_limit,
  max_order_limit = EXCLUDED.max_order_limit,
  disclaimer_note = EXCLUDED.disclaimer_note,
  custom_instructions = EXCLUDED.custom_instructions,
  updated_at = NOW();

-- ------------------------------------------------------------------------------
-- 4. SEED 13 AI-GENERATED 1-OF-1 ARCHIVAL VINTAGE PRODUCTS
-- ------------------------------------------------------------------------------

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price, condition_grade, condition_tier,
  size, measurements, description, details, images, in_stock, is_1of1, inventory_type, stock_count,
  store_id, store_name, is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'jk-archival-001',
  '1994-carhartt-detroit-canvas-work-jacket',
  '1994 Carhartt Detroit Canvas Work Jacket',
  'Apparel',
  'Workwear & Jackets',
  '1990s',
  16500.00,
  22000.00,
  'Vintage 9/10 - Natural Faded Patina',
  'Good',
  'L',
  '{"chest": "24.0 in", "length": "27.5 in", "shoulders": "20.5 in", "sleeve": "25.0 in"}'::jsonb,
  'Original 1994 Carhartt J97 MOS Detroit duck canvas jacket in washed tan with signature contrast corduroy collar and heavy brass zip. Natural honeycombing and authentic workwear patina with zero structural tears.',
  '["Heavyweight 12oz firm hand cotton duck", "Blanket lined body with quilted nylon sleeve lining", "Corduroy top collar with under-collar snaps", "Zippered left chest pocket with Carhartt patch", "Made in USA"]'::jsonb,
  '["/images/products/carhartt-detroit-jacket.jpg"]'::jsonb,
  TRUE, TRUE, 'thrift_1of1', 1,
  'store-f7-archive', 'F-7 Flagship Archive',
  FALSE, FALSE, FALSE, TRUE, TRUE,
  '["Carhartt", "Detroit", "Workwear", "1-of-1", "Vintage", "Duck Canvas"]'::jsonb,
  'Batch #48: Archival Workwear', NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, price = EXCLUDED.price, images = EXCLUDED.images, details = EXCLUDED.details, measurements = EXCLUDED.measurements, updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price, condition_grade, condition_tier,
  size, measurements, description, details, images, in_stock, is_1of1, inventory_type, stock_count,
  store_id, store_name, is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'jk-archival-002',
  '1993-nirvana-in-utero-official-tour-tee',
  '1993 Nirvana "In Utero" Official European Tour Tee',
  'Apparel',
  'Graphic Tees',
  '1990s',
  24000.00,
  30000.00,
  'Vintage 9/10 - Single Stitch Archival',
  'Mint Vintage',
  'XL',
  '{"chest": "23.5 in", "length": "29.5 in", "shoulders": "21.0 in", "sleeve": "8.5 in"}'::jsonb,
  'Ultra-rare authentic 1993 Nirvana In Utero European tour graphic tee printed on authentic Giant by Tee Jays heavyweight blank. Single-stitched sleeves and waist hem with stunning sun-bleached charcoal fade.',
  '["Original Giant paper tag intact", "Single stitch throughout sleeves and hem", "Sun-faded charcoal wash with vibrant front angel & back tour dates", "Zero dry rot or stitch unraveling"]'::jsonb,
  '["/images/products/nirvana-in-utero-tee.jpg"]'::jsonb,
  TRUE, TRUE, 'thrift_1of1', 1,
  'store-f7-archive', 'F-7 Flagship Archive',
  FALSE, FALSE, FALSE, TRUE, TRUE,
  '["Nirvana", "In Utero", "Band Tee", "Single Stitch", "1-of-1", "90s Grunge"]'::jsonb,
  'Batch #48: Archival Workwear', NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, price = EXCLUDED.price, images = EXCLUDED.images, details = EXCLUDED.details, measurements = EXCLUDED.measurements, updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price, condition_grade, condition_tier,
  size, measurements, description, details, images, in_stock, is_1of1, inventory_type, stock_count,
  store_id, store_name, is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'jk-archival-003',
  '1992-polo-ralph-lauren-stadium-windbreaker',
  '1992 Polo Ralph Lauren Stadium 1992 Windbreaker',
  'Apparel',
  'Outerwear',
  '1990s',
  32000.00,
  45000.00,
  'Archive 9.5/10 - Collector Grail',
  'Mint Vintage',
  'L',
  '{"chest": "25.0 in", "length": "27.0 in", "shoulders": "22.0 in", "sleeve": "24.5 in"}'::jsonb,
  'Holy grail of vintage Americana sportswear: the 1992 Polo Ralph Lauren Stadium Olympic collection windbreaker. Featuring iconic navy, red, and white colorblocking with original embroidered Stadium patches.',
  '["Original 1992 Polo Stadium badge", "Colorblocked nylon shell with breathable mesh lining", "Stowaway hood and drawcord waist", "Collector-grade preservation"]'::jsonb,
  '["/images/products/ralph-lauren-stadium-1992.jpg"]'::jsonb,
  TRUE, TRUE, 'thrift_1of1', 1,
  'store-f7-archive', 'F-7 Flagship Archive',
  FALSE, FALSE, FALSE, FALSE, TRUE,
  '["Polo", "Stadium 1992", "Ralph Lauren", "Grail", "Sportswear", "1-of-1"]'::jsonb,
  'Batch #48: Archival Workwear', NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, price = EXCLUDED.price, images = EXCLUDED.images, details = EXCLUDED.details, measurements = EXCLUDED.measurements, updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price, condition_grade, condition_tier,
  size, measurements, description, details, images, in_stock, is_1of1, inventory_type, stock_count,
  store_id, store_name, is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'jk-archival-004',
  '1988-schott-nyc-type-a2-cowhide-bomber',
  '1988 Schott NYC Type A-2 Cowhide Flight Bomber',
  'Apparel',
  'Leather & Outerwear',
  '1980s',
  28500.00,
  38000.00,
  'Vintage 8.5/10 - Aged Leather Patina',
  'Good',
  '42 (L)',
  '{"chest": "23.0 in", "length": "26.5 in", "shoulders": "19.5 in", "sleeve": "25.5 in"}'::jsonb,
  'Vintage 1988 Schott NYC military Type A-2 flight jacket in full-grain naked cowhide. Deep mahogany brown with authentic distressed surface wear, heavy Talon brass zipper, and dual snap-flap pockets.',
  '["Full-grain American steerhide/cowhide", "Original Talon brass zipper", "Dual-entry front patch pockets", "Knit wool cuffs and waistband intact", "Made in Union, NJ, USA"]'::jsonb,
  '["/images/products/schott-nyc-type-a2-leather.jpg"]'::jsonb,
  TRUE, TRUE, 'thrift_1of1', 1,
  'store-f7-archive', 'F-7 Flagship Archive',
  FALSE, FALSE, FALSE, TRUE, FALSE,
  '["Schott NYC", "Leather Bomber", "Type A-2", "Flight Jacket", "1-of-1", "Made in USA"]'::jsonb,
  'Batch #48: Archival Workwear', NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, price = EXCLUDED.price, images = EXCLUDED.images, details = EXCLUDED.details, measurements = EXCLUDED.measurements, updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price, condition_grade, condition_tier,
  size, measurements, description, details, images, in_stock, is_1of1, inventory_type, stock_count,
  store_id, store_name, is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'jk-archival-005',
  '1996-champion-reverse-weave-heather-grey-hoodie',
  '1996 Champion Reverse Weave Heavyweight Boxy Hoodie',
  'Apparel',
  'Hoodies & Sweats',
  '1990s',
  11500.00,
  15000.00,
  'Vintage 9/10 - Sun Bleached',
  'Good',
  'XL',
  '{"chest": "25.5 in", "length": "28.0 in", "shoulders": "22.5 in", "sleeve": "24.5 in"}'::jsonb,
  '90s heavyweight Champion Reverse Weave pullover hoodie in classic silver-heather grey. Side gusset rib panels, embroidered C patch on left wrist, double-ply hood, and signature boxy drape.',
  '["Original Champion blue-bar embroidered tag", "Signature vertical fleece grain with side rib knit panels", "12oz cross-grain heavyweight fleece", "Made in USA"]'::jsonb,
  '["/images/products/champion-reverse-weave-hoodie.jpg"]'::jsonb,
  TRUE, TRUE, 'thrift_1of1', 1,
  'store-f7-archive', 'F-7 Flagship Archive',
  FALSE, FALSE, FALSE, FALSE, TRUE,
  '["Champion", "Reverse Weave", "Heather Grey", "Boxy Cut", "Vintage Hoodie"]'::jsonb,
  'Batch #48: Archival Workwear', NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, price = EXCLUDED.price, images = EXCLUDED.images, details = EXCLUDED.details, measurements = EXCLUDED.measurements, updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price, condition_grade, condition_tier,
  size, measurements, description, details, images, in_stock, is_1of1, inventory_type, stock_count,
  store_id, store_name, is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'jk-archival-006',
  '1997-stussy-international-tribe-flannel',
  '1997 Stüssy International Tribe Shadow Plaid Flannel',
  'Apparel',
  'Shirts',
  '1990s',
  13500.00,
  17000.00,
  'Vintage 9/10 - Soft Brushed Cotton',
  'Good',
  'L',
  '{"chest": "24.0 in", "length": "30.0 in", "shoulders": "20.5 in", "sleeve": "24.0 in"}'::jsonb,
  'Golden era 1997 Stüssy International Tribe oversized flannel overshirt in shadow navy and olive plaid. Features dual chest flap pockets, pearlescent buttons, and embroidered IST tab on side seam.',
  '["100% heavyweight brushed cotton flannel", "Stüssy IST flag label on side hem", "Boxy 90s streetwear cut with curved hem", "Original Stüssy California label"]'::jsonb,
  '["/images/products/stussy-flannel-overshirt.jpg"]'::jsonb,
  TRUE, TRUE, 'thrift_1of1', 1,
  'store-f7-archive', 'F-7 Flagship Archive',
  FALSE, FALSE, FALSE, FALSE, FALSE,
  '["Stüssy", "International Tribe", "Flannel", "Shadow Plaid", "90s Streetwear"]'::jsonb,
  'Batch #48: Archival Workwear', NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, price = EXCLUDED.price, images = EXCLUDED.images, details = EXCLUDED.details, measurements = EXCLUDED.measurements, updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price, condition_grade, condition_tier,
  size, measurements, description, details, images, in_stock, is_1of1, inventory_type, stock_count,
  store_id, store_name, is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'jk-archival-007',
  '1996-north-face-nuptse-700-down-puffer',
  '1996 The North Face Nuptse 700-Down Puffer Jacket',
  'Apparel',
  'Outerwear',
  '1990s',
  21000.00,
  28000.00,
  'Vintage 9/10 - Ultra Loft 700 Down',
  'Good',
  'M',
  '{"chest": "23.5 in", "length": "26.5 in", "shoulders": "21.0 in", "sleeve": "25.0 in"}'::jsonb,
  'Archival 1996 The North Face Nuptse in classic two-tone forest green and black nylon ripstop. High-loft 700 goose down fill, packable hood in collar, and embroidered white TNF chest & back logos.',
  '["700-fill certified goose down insulation", "Original ripstop nylon with DWR finish", "Stowable hood rolls into collar", "YKK VISLON two-way front zip"]'::jsonb,
  '["/images/products/north-face-nuptse-puffer.jpg"]'::jsonb,
  TRUE, TRUE, 'thrift_1of1', 1,
  'store-f7-archive', 'F-7 Flagship Archive',
  FALSE, FALSE, FALSE, TRUE, TRUE,
  '["The North Face", "Nuptse", "700 Down", "Puffer", "Vintage Outerwear"]'::jsonb,
  'Batch #48: Archival Workwear', NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, price = EXCLUDED.price, images = EXCLUDED.images, details = EXCLUDED.details, measurements = EXCLUDED.measurements, updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price, condition_grade, condition_tier,
  size, measurements, description, details, images, in_stock, is_1of1, inventory_type, stock_count,
  store_id, store_name, is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'jk-archival-008',
  '1991-harley-davidson-3d-emblem-biker-tee',
  '1991 Harley Davidson 3D Emblem Washed Biker Tee',
  'Apparel',
  'Graphic Tees',
  '1990s',
  18500.00,
  24000.00,
  'Vintage 9/10 - Soft Fade & Single Stitch',
  'Mint Vintage',
  'L',
  '{"chest": "22.5 in", "length": "28.5 in", "shoulders": "20.0 in", "sleeve": "8.0 in"}'::jsonb,
  'Iconic 1991 Harley-Davidson licensed 3D Emblem Fort Worth graphic tee. Features soaring bald eagle over scenic canyon artwork with vintage cracked ink print and single-stitch construction.',
  '["Official 3D Emblem Fort Worth, Texas copyright 1991", "Single-stitch sleeves and hem", "Faded charcoal grey washed cotton", "Zero holes, tears, or dry rot"]'::jsonb,
  '["/images/products/harley-davidson-vintage-tee.jpg"]'::jsonb,
  TRUE, TRUE, 'thrift_1of1', 1,
  'store-f7-archive', 'F-7 Flagship Archive',
  FALSE, FALSE, FALSE, FALSE, TRUE,
  '["Harley Davidson", "3D Emblem", "Biker Tee", "Single Stitch", "Vintage 1991"]'::jsonb,
  'Batch #48: Archival Workwear', NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, price = EXCLUDED.price, images = EXCLUDED.images, details = EXCLUDED.details, measurements = EXCLUDED.measurements, updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price, condition_grade, condition_tier,
  size, measurements, description, details, images, in_stock, is_1of1, inventory_type, stock_count,
  store_id, store_name, is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'jk-archival-009',
  '1995-air-jordan-11-retro-concord-og',
  '1995 Air Jordan 11 Retro Concord OG',
  'Footwear',
  'Sneakers',
  '1990s',
  34000.00,
  45000.00,
  'Vintage 9/10 - Oxidized Cream Ice Soles',
  'Mint Vintage',
  'US 10.5 (EU 44.5)',
  '{"insole": "28.5 cm", "width": "Standard D"}'::jsonb,
  'Tinker Hatfield signature design: the original 1995 Air Jordan 11 Concord. Features pristine high-cut black patent leather, white ballistic mesh, full-length carbon fiber shank plate, and authentic oxidized cream translucent outsole.',
  '["Original high-cut patent leather cut", "Real carbon fiber spring plate intact", "Jumpman Jordan center tongue ribbon", "Preserved in temperature-controlled archive"]'::jsonb,
  '["/images/products/jordan-11-concord-og.jpg"]'::jsonb,
  TRUE, TRUE, 'thrift_1of1', 1,
  'store-f7-archive', 'F-7 Flagship Archive',
  FALSE, FALSE, FALSE, TRUE, TRUE,
  '["Jordan 11", "Concord", "OG", "Patent Leather", "Sneakerhead Grail"]'::jsonb,
  'Batch #48: Archival Workwear', NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, price = EXCLUDED.price, images = EXCLUDED.images, details = EXCLUDED.details, measurements = EXCLUDED.measurements, updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price, condition_grade, condition_tier,
  size, measurements, description, details, images, in_stock, is_1of1, inventory_type, stock_count,
  store_id, store_name, is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'jk-archival-010',
  '1990-red-wing-iron-ranger-8111-boots',
  '1990 Red Wing Heritage Iron Ranger 8111 Boots',
  'Footwear',
  'Boots',
  '1990s',
  26000.00,
  35000.00,
  'Vintage 9/10 - Amber Harness Patina',
  'Good',
  'US 9.5 D (EU 42.5)',
  '{"insole": "27.5 cm", "height": "6.0 in"}'::jsonb,
  'Vintage 1990s Red Wing 8111 Iron Ranger work boots in Amber Harness oil-tanned leather. Features the classic double-layer cap toe, Goodyear welt construction, patinated brass eyelets, and Nitrile Cork outsole.',
  '["Oil-tanned full-grain Amber Harness leather", "Goodyear welted resoleable construction", "Iconic double-layer cap toe", "Made in Red Wing, Minnesota, USA"]'::jsonb,
  '["/images/products/red-wing-iron-ranger.jpg"]'::jsonb,
  TRUE, TRUE, 'thrift_1of1', 1,
  'store-f7-archive', 'F-7 Flagship Archive',
  FALSE, FALSE, FALSE, FALSE, TRUE,
  '["Red Wing", "Iron Ranger", "8111", "Goodyear Welt", "Made in USA", "Leather Boots"]'::jsonb,
  'Batch #48: Archival Workwear', NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, price = EXCLUDED.price, images = EXCLUDED.images, details = EXCLUDED.details, measurements = EXCLUDED.measurements, updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price, condition_grade, condition_tier,
  size, measurements, description, details, images, in_stock, is_1of1, inventory_type, stock_count,
  store_id, store_name, is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'jk-archival-011',
  '1998-oakley-minutes-bullet-sunglasses',
  '1998 Oakley Minutes Bullet Sunglasses',
  'Accessories',
  'Eyewear',
  '1990s',
  19500.00,
  26000.00,
  'Mint 9.5/10 - Flawless Lenses',
  'Mint Vintage',
  'One Size',
  '{"lensWidth": "54mm", "bridge": "18mm", "temple": "135mm"}'::jsonb,
  'Rare 1998 Y2K era Oakley Minutes with brushed silver X-Metal style sculpted frame and Fire Iridium mirror lenses. Original unobtainium ear socks and nose pads with zero peeling.',
  '["Sculpted O-Matter lightweight frame", "Plutonite Fire Iridium high-contrast lenses", "Hydrophilic Unobtainium grips", "Collector grade with microfiber vault pouch"]'::jsonb,
  '["/images/products/oakley-minutes-sunglasses.jpg"]'::jsonb,
  TRUE, TRUE, 'thrift_1of1', 1,
  'store-f7-archive', 'F-7 Flagship Archive',
  FALSE, FALSE, FALSE, TRUE, FALSE,
  '["Oakley", "Minutes", "Fire Iridium", "Y2K", "Vintage Eyewear", "Grail"]'::jsonb,
  'Batch #48: Archival Workwear', NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, price = EXCLUDED.price, images = EXCLUDED.images, details = EXCLUDED.details, measurements = EXCLUDED.measurements, updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price, condition_grade, condition_tier,
  size, measurements, description, details, images, in_stock, is_1of1, inventory_type, stock_count,
  store_id, store_name, is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'jk-archival-012',
  '1992-carhartt-heavy-duck-canvas-tool-tote',
  '1992 Carhartt Heavy Duck Canvas Tool Tote',
  'Accessories',
  'Bags',
  '1990s',
  9500.00,
  13000.00,
  'Vintage 8.5/10 - Heavyweight Canvas',
  'Good',
  'One Size (Large)',
  '{"width": "18.0 in", "height": "14.0 in", "depth": "7.0 in"}'::jsonb,
  'Ultra-durable vintage 1992 Carhartt workwear utility tool tote crafted from 100% 12-ounce cotton duck canvas with reinforced webbed shoulder straps and brass rivet reinforcements.',
  '["12oz firm-hand Carhartt brown duck canvas", "Dual exterior slide pockets and reinforced base", "Antiqued brass rivets at stress points", "Original woven Carhartt C logo patch"]'::jsonb,
  '["/images/products/carhartt-duck-tool-tote.jpg"]'::jsonb,
  TRUE, TRUE, 'thrift_1of1', 1,
  'store-f7-archive', 'F-7 Flagship Archive',
  FALSE, FALSE, FALSE, FALSE, FALSE,
  '["Carhartt", "Tool Tote", "Duck Canvas", "Vintage Bag", "Workwear"]'::jsonb,
  'Batch #48: Archival Workwear', NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, price = EXCLUDED.price, images = EXCLUDED.images, details = EXCLUDED.details, measurements = EXCLUDED.measurements, updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price, condition_grade, condition_tier,
  size, measurements, description, details, images, in_stock, is_1of1, inventory_type, stock_count,
  store_id, store_name, is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'jk-archival-013',
  '1990-hermes-paris-silk-equestrian-scarf',
  '1990 Hermès Paris Silk Equestrian Scarf (90cm)',
  'Accessories',
  'Scarves & Silks',
  '1990s',
  29000.00,
  42000.00,
  'Mint 9.5/10 - Plump Hand-Rolled Edges',
  'Mint Vintage',
  '90cm x 90cm',
  '{"dimensions": "35.5 in x 35.5 in"}'::jsonb,
  'Authentic 1990 Hermès Paris vintage 90cm carré scarf in 100% silk twill. Classic equestrian stirrup and harness motif in imperial navy, rich archive gold, and ivory. Features plump, hand-rolled edges.',
  '["100% heavyweight mulberry silk twill", "Hand-rolled and hand-stitched hem edges", "Hermès Paris copyright stamped in print", "Flawless silk sheen with zero pulls or stains"]'::jsonb,
  '["/images/products/hermes-silk-scarf.jpg"]'::jsonb,
  TRUE, TRUE, 'thrift_1of1', 1,
  'store-f7-archive', 'F-7 Flagship Archive',
  FALSE, FALSE, FALSE, TRUE, FALSE,
  '["Hermès", "Silk Scarf", "Carré 90", "Vintage Luxury", "Equestrian", "Grail"]'::jsonb,
  'Batch #48: Archival Workwear', NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, price = EXCLUDED.price, images = EXCLUDED.images, details = EXCLUDED.details, measurements = EXCLUDED.measurements, updated_at = NOW();
