-- ==============================================================================
-- JUTA.KAPRA: PRODUCTS & PAYMENT GATEWAYS MASTER SCHEMA FOR SUPABASE
-- Run this script in Supabase Dashboard -> SQL Editor -> New Query
-- Target: https://kbdrlhiishmetsddlstq.supabase.co
-- ==============================================================================

-- 1. PRODUCTS TABLE
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
CREATE INDEX IF NOT EXISTS idx_products_is_hidden ON public.products(is_hidden);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public or service manage products" ON public.products;
CREATE POLICY "Public or service manage products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- 2. PAYMENT GATEWAYS TABLE
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

-- 3. SEED PRODUCTS
INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price,
  condition_grade, condition_tier, size, measurements, description, details,
  images, in_stock, is_1of1, inventory_type, stock_count, store_id, store_name,
  is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'prod-001', '1993-nirvana-in-utero-tour-tee', '1993 Nirvana "In Utero" Official European Tour Tee', 'Vintage Tees & Trousers', NULL, '1993', 15500, 19000, 'Vintage 9/10 - Single Stitch', 'Good', 'XL', '{"chest":"23.5 in (Pit-to-Pit)","length":"29.5 in (Collar-to-Hem)","shoulders":"21.0 in"}', 'Ultra-rare original 1993 Nirvana In Utero tour t-shirt printed on an authentic Giant by Tee Jays blank. Single stitched sleeves and hem. Gorgeous natural charcoal fade with zero dry rot or stitching unraveling. True archival grail.', '["Original Giant by Tee Jays paper tag present and intact","Single stitch construction throughout hem and sleeves","Natural sun-faded black patina with vibrant front & back print","100% Pre-shrunk Cotton, Made in USA","Archival verified via ultraviolet tag inspection"]', '["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80","https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80","https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1000&q=80"]', TRUE, TRUE, 'thrift_1of1', 1, 'store-f7-archive', 'F-7 Flagship Archive', FALSE, FALSE, FALSE, TRUE, TRUE, '["Nirvana","Single Stitch","Giant Tag","Band Tee","1-of-1","Rare"]', 'Batch #44: 90s Grunge Grails', '2026-09-10'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  images = EXCLUDED.images,
  details = EXCLUDED.details,
  in_stock = EXCLUDED.in_stock,
  updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price,
  condition_grade, condition_tier, size, measurements, description, details,
  images, in_stock, is_1of1, inventory_type, stock_count, store_id, store_name,
  is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'prod-002', '1989-carhartt-j97-detroit-duck-jacket', '1989 Carhartt J97 MOS Detroit Duck Canvas Workwear Jacket', 'Workwear & Jeans', NULL, '1989', 13500, NULL, 'Distressed 8/10 - Authentic Work Patina', 'Distressed 1-of-1', 'L', '{"chest":"25.0 in (Pit-to-Pit)","length":"26.0 in (Collar-to-Hem)","shoulders":"20.5 in"}', 'Iconic Union-Made Carhartt Detroit Jacket in sought-after Moss Green (MOS). Features heavy blanket lining, corduroy collar, and authentic industrial grease and paint splatters from decades of real workshop use. Zipper pulls smoothly.', '["Union Made in USA with vintage white fabric craft tag","Heavyweight 12oz firm-hand duck canvas with striped blanket lining","Brown corduroy top collar & heavy brass YKK chest zipper","Boxy, cropped workwear silhouette with bi-swing action back","Original brass snap cuffs and waist adjusters"]', '["https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80","https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80","https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80"]', TRUE, TRUE, 'thrift_1of1', 1, 'store-f7-archive', 'F-7 Flagship Archive', FALSE, FALSE, FALSE, FALSE, TRUE, '["Carhartt","Detroit Jacket","Workwear","Union Made","Moss Green","Blanket Lined"]', 'Batch #44: 90s Grunge Grails', '2026-09-12'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  images = EXCLUDED.images,
  details = EXCLUDED.details,
  in_stock = EXCLUDED.in_stock,
  updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price,
  condition_grade, condition_tier, size, measurements, description, details,
  images, in_stock, is_1of1, inventory_type, stock_count, store_id, store_name,
  is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'prod-003', '1994-air-jordan-1-retro-chicago', '1994 Nike Air Jordan 1 Retro "Chicago" OG High', 'Sneakers & Boots', NULL, '1994', 45000, 55000, 'Vintage 9.5/10 - OG Box Included', 'Mint', 'US 10.5', '{"shoeSize":"US Men 10.5 (EU 44.5 / 28.5cm)"}', 'The legendary 1994 Nike Air Jordan 1 Chicago reissue—widely revered as having the highest quality full-grain leather ever put on a Jordan 1. Comes complete with the original 1994 silver box, retro card, and black/white lace sets. Soles are supple and 100% wearable.', '["Original 1994 production with internal stamp 940810-TY","Buttery vintage calf leather upper with deep red pigmentation","Zero midsole crumbling; rubber outsole has full star traction","Includes original archival silver Jordan face-box and collector card","Professionally conditioned with Saphir Medaille d''Or"]', '["https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=80","https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=80","https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=1000&q=80"]', TRUE, TRUE, 'thrift_1of1', 1, 'store-f7-archive', 'F-7 Flagship Archive', FALSE, FALSE, FALSE, TRUE, TRUE, '["Jordan 1","1994","Chicago","Sneakers","OG Box","Deadstock Feel"]', 'Batch #43: Sneakerhead Archives', '2026-09-08'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  images = EXCLUDED.images,
  details = EXCLUDED.details,
  in_stock = EXCLUDED.in_stock,
  updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price,
  condition_grade, condition_tier, size, measurements, description, details,
  images, in_stock, is_1of1, inventory_type, stock_count, store_id, store_name,
  is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'prod-004', '1988-sonic-youth-daydream-nation-tee', '1988 Sonic Youth "Daydream Nation" Candle Graphic Tee', 'Vintage Tees & Trousers', NULL, '1988', 18500, NULL, 'Vintage 8.5/10 - Single Stitch Grail', 'Good', 'L', '{"chest":"22.0 in (Pit-to-Pit)","length":"28.0 in (Collar-to-Hem)","shoulders":"19.5 in"}', 'First press original promotional t-shirt for Sonic Youth''s landmark double LP "Daydream Nation", featuring Gerhard Richter''s iconic photorealistic candle painting "Kerze". Printed on vintage Fruit of the Loom single-stitch blank.', '["Single-stitch cuffs and waist hem","Original 1988 Blast First / Enigma Records credit line in print","Soft featherweight cotton with beautiful cracked screenprint patina","No pinholes, tears, or staining"]', '["https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80","https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80"]', TRUE, TRUE, 'thrift_1of1', 1, 'store-f7-archive', 'F-7 Flagship Archive', FALSE, FALSE, FALSE, FALSE, FALSE, '["Sonic Youth","Daydream Nation","Single Stitch","Indie Rock","Gerhard Richter"]', 'Batch #42: No Wave & Indie', '2026-09-05'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  images = EXCLUDED.images,
  details = EXCLUDED.details,
  in_stock = EXCLUDED.in_stock,
  updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price,
  condition_grade, condition_tier, size, measurements, description, details,
  images, in_stock, is_1of1, inventory_type, stock_count, store_id, store_name,
  is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'prod-005', '1998-arcteryx-theta-ar-golden-embroidery', '1998 Arc''teryx Theta AR GORE-TEX Golden Embroidered Shell', 'Jackets & Coats', NULL, '1998', 26000, 32000, 'Vintage 9/10 - Factory Seam Repaired', 'Mint', 'M', '{"chest":"24.0 in (Pit-to-Pit)","length":"31.0 in (Back Drop Hem)","shoulders":"Raglan"}', 'First-generation Made in Canada Arc''teryx Theta AR alpine jacket. Features rare metallic golden embroidered fossil bird logo and original 3-layer GORE-TEX XCR membrane. Seam tapes have been professionally refreshed by Arc''teryx Vancouver.', '["Handmade in Vancouver, British Columbia, Canada","Original gold threaded Archaeopteryx fossil chest embroidery","Drop-back hem with dual shock-cord adjustments","Watertight reverse-coil front zipper with storm flap","Internal zip security pocket with serial number badge"]', '["https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80","https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80"]', TRUE, TRUE, 'thrift_1of1', 1, 'store-f7-archive', 'F-7 Flagship Archive', FALSE, FALSE, FALSE, TRUE, TRUE, '["Arc''teryx","Theta AR","GORE-TEX","Made in Canada","Gorpcore","Golden Bird"]', 'Batch #44: 90s Grunge Grails', '2026-09-14'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  images = EXCLUDED.images,
  details = EXCLUDED.details,
  in_stock = EXCLUDED.in_stock,
  updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price,
  condition_grade, condition_tier, size, measurements, description, details,
  images, in_stock, is_1of1, inventory_type, stock_count, store_id, store_name,
  is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'prod-006', '1976-levis-501-66-single-stitch-redline', '1976 Levi''s 501 "66 Single" Redline Selvedge Denim Jeans', 'Workwear & Jeans', NULL, '1976', 16500, NULL, 'Distressed 8/10 - Natural Whiskers & Honeycombs', 'Distressed 1-of-1', '32x31', '{"waist":"32.0 in (16.0 in flat across)","inseam":"31.0 in (Chain-stitched)","length":"41.5 in (Outseam)"}', 'Genuine transitional 1976 "66 Single" Levi''s 501 jeans featuring single-stitch back pocket construction and pink redline selvedge ID. Natural indigo whiskers and honeycombs with light vintage fraying at the pocket edge. No blown crotch.', '["Top button stamped \"6\" corresponding to vintage El Paso factory","Small \"e\" red tab with single stitch horizontal back pocket arcs","Pinkish red-line selvedge visible at outseams","Original chainstitch hem intact with roping effect","Pure Cone Mills White Oak shrink-to-fit denim"]', '["https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1000&q=80","https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80"]', TRUE, TRUE, 'thrift_1of1', 1, 'store-f7-archive', 'F-7 Flagship Archive', FALSE, FALSE, FALSE, FALSE, FALSE, '["Levi''s 501","66 Single","Selvedge","Redline","Cone Mills","Vintage Denim"]', 'Batch #41: Americana Workwear', '2026-09-02'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  images = EXCLUDED.images,
  details = EXCLUDED.details,
  in_stock = EXCLUDED.in_stock,
  updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price,
  condition_grade, condition_tier, size, measurements, description, details,
  images, in_stock, is_1of1, inventory_type, stock_count, store_id, store_name,
  is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'prod-007', '2002-nike-dunk-low-pro-sb-reese-forbes', '2002 Nike Dunk Low Pro SB "Reese Forbes" Wheat', 'Sneakers & Boots', NULL, '2002', 38000, NULL, 'Vintage 8.5/10 - Silver Box Era', 'Good', 'US 10.0', '{"shoeSize":"US Men 10.0 (EU 44 / 28.0cm)"}', 'Grail status Nike SB Dunk Low designed by skateboard icon Reese Forbes in 2002. Triple-suede monochromatic wheat construction with stuffed tongue and Zoom Air insole. Suede is buttery smooth with minimal nap wear.', '["Original Orange Box / Silver Box transition production batch","Premium triple-tone wheat pigskin suede upper","Iconic fat stuffed skateboarding tongue with Nike SB patch","Includes replacement OG oval wheat laces and protective shoe trees"]', '["https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=80","https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=1000&q=80"]', TRUE, TRUE, 'thrift_1of1', 1, 'store-f7-archive', 'F-7 Flagship Archive', FALSE, FALSE, FALSE, FALSE, TRUE, '["Nike SB","Dunk Low","Reese Forbes","Wheat Suede","Fat Tongue","Silver Box"]', 'Batch #43: Sneakerhead Archives', '2026-09-11'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  images = EXCLUDED.images,
  details = EXCLUDED.details,
  in_stock = EXCLUDED.in_stock,
  updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price,
  condition_grade, condition_tier, size, measurements, description, details,
  images, in_stock, is_1of1, inventory_type, stock_count, store_id, store_name,
  is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'prod-008', '1995-stussy-international-tribe-varsity', '1995 Stüssy "International Stüssy Tribe" Leather Varsity', 'Workwear & Jeans', NULL, '1995', 28000, 35000, 'Vintage 9/10 - Immaculate Leather', 'Mint', 'XL', '{"chest":"26.0 in (Pit-to-Pit)","length":"27.5 in (Collar-to-Hem)","shoulders":"21.5 in"}', 'Holy grail streetwear piece from Shawn Stüssy''s prime era. Heavy Melton wool body in deep navy with buttery off-white cowhide leather sleeves. Chenille IST embroidery on back and embroidered crest patches across both sleeves.', '["Heavyweight 24oz virgin melton wool body","Full grain supple naked cowhide leather sleeves with rib knit trims","Quilted satin interior thermal lining with internal breast pocket","Authentic 90s Stüssy Sport black woven neck label"]', '["https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80","https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80"]', TRUE, TRUE, 'thrift_1of1', 1, 'store-f7-archive', 'F-7 Flagship Archive', FALSE, FALSE, FALSE, TRUE, TRUE, '["Stüssy","IST","Varsity Jacket","Vintage Streetwear","Wool & Leather"]', 'Batch #44: 90s Grunge Grails', '2026-09-13'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  images = EXCLUDED.images,
  details = EXCLUDED.details,
  in_stock = EXCLUDED.in_stock,
  updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price,
  condition_grade, condition_tier, size, measurements, description, details,
  images, in_stock, is_1of1, inventory_type, stock_count, store_id, store_name,
  is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'prod-009', '1993-oakley-sub-zero-sunglasses', '1993 Oakley Sub Zero #0.3N Archival Mirrored Sunglasses', 'Accessories', 'glasses', '1993', 14500, NULL, 'Mint 10/10 - Deadstock with Microbag', 'Deadstock', 'One Size', '{"shoeSize":"Frameless wrap design (0.69 oz / 20 grams)"}', 'Pioneering biomimetic design from Jim Jannard''s early Oakley labs. The Sub Zero weighs a mind-bending 20 grams with a continuous rimless Plutonite lens and Iridium mirror coating. Zero scratches on optics.', '["Original 1993 USA production with patent stamp inside earstem","Deep blue-purple Iridium polarized lens shield","Unobtainium earsocks that grip tighter as moisture increases","Comes with authentic 1993 Oakley skull microclear pouch"]', '["https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1000&q=80","https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1000&q=80"]', TRUE, TRUE, 'thrift_1of1', 1, 'store-f7-archive', 'F-7 Flagship Archive', FALSE, FALSE, FALSE, FALSE, FALSE, '["Oakley","Sub Zero","Archival Tech","Y2K Matrix","Vintage Sunglasses"]', 'Batch #42: No Wave & Indie', '2026-09-04'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  images = EXCLUDED.images,
  details = EXCLUDED.details,
  in_stock = EXCLUDED.in_stock,
  updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price,
  condition_grade, condition_tier, size, measurements, description, details,
  images, in_stock, is_1of1, inventory_type, stock_count, store_id, store_name,
  is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'prod-010', '1996-chicago-bulls-championship-rap-tee', '1996 Chicago Bulls "72-10 Unstoppabulls" Rap Tee Style', 'Vintage Tees & Trousers', NULL, '1996', 12500, NULL, 'Vintage 8.5/10 - Single Stitch Bottom', 'Good', 'XL', '{"chest":"24.0 in (Pit-to-Pit)","length":"30.0 in (Collar-to-Hem)","shoulders":"22.0 in"}', 'Authentic 1996 NBA Finals Championship commemorative all-over print featuring Jordan, Pippen, and Rodman in dramatic bootleg rap-tee style. Bold neon metallic highlights and dramatic trophy graphic on back.', '["Original Nutmeg Mills 1996 licensing tag","Single stitch construction at hem and sleeve cuffs","Vibrant screen-print colors with slight natural crackle","100% heavyweight vintage ring-spun cotton"]', '["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80","https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1000&q=80"]', TRUE, TRUE, 'thrift_1of1', 1, 'store-f7-archive', 'F-7 Flagship Archive', FALSE, FALSE, FALSE, FALSE, TRUE, '["Chicago Bulls","Jordan 96","Rap Tee Style","Single Stitch","Vintage NBA"]', 'Batch #43: Sneakerhead Archives', '2026-09-09'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  images = EXCLUDED.images,
  details = EXCLUDED.details,
  in_stock = EXCLUDED.in_stock,
  updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price,
  condition_grade, condition_tier, size, measurements, description, details,
  images, in_stock, is_1of1, inventory_type, stock_count, store_id, store_name,
  is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'prod-011', '1985-schott-perfecto-618-leather-jacket', '1985 Schott NYC Perfecto 618 Steerhide Leather Biker Jacket', 'Jackets & Coats', NULL, '1985', 24000, 30000, 'Vintage 9/10 - Heavy Grain Leather', 'Mint', '42 (Fits L)', '{"chest":"23.5 in (Pit-to-Pit)","length":"25.0 in (Collar-to-Hem)","shoulders":"19.5 in"}', 'The archetype American motorcycle jacket. 1980s Schott 618 made in New Jersey with thick chrome-tanned steerhide leather, Talon zippers, asymmetrical zip front, snap-down lapels, and attached half belt with nickel-plated buckle.', '["Made in Union, NJ USA with vintage bull neck Schott Perfecto tag","Heavyweight drum-dyed steerhide that stands on its own","Original Talon bell-pull sleeve zippers functioning seamlessly","Quilted nylon insulation lining with clean leather kidney extension"]', '["https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80","https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80"]', FALSE, TRUE, 'thrift_1of1', 1, 'store-f7-archive', 'F-7 Flagship Archive', FALSE, FALSE, FALSE, TRUE, FALSE, '["Schott NYC","Perfecto 618","Steerhide","Talon Zippers","Punk Rock","Made in USA"]', 'Batch #40: American Bikers', '2026-08-28'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  images = EXCLUDED.images,
  details = EXCLUDED.details,
  in_stock = EXCLUDED.in_stock,
  updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price,
  condition_grade, condition_tier, size, measurements, description, details,
  images, in_stock, is_1of1, inventory_type, stock_count, store_id, store_name,
  is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'prod-012', 'archival-silver-floral-cross-heavy-ring', 'Archival .925 Solid Silver Heavy Floral Cross Band Ring', 'Accessories', 'wallets', '1998', 9500, NULL, 'Vintage 9.5/10 - Darkened Oxidation Patina', 'Good', 'One Size', '{"shoeSize":"Compact Bi-Fold 4.5\" x 3.5\""}', 'Heavy gothic floral motif silver ring and bifold leather wallet with intricate medieval repoussé sculpting.', '["Cast in solid .925 Sterling Silver weighing a substantial 16.2 grams","Hand stamped hallmark and purity marks inside the shank","Heirloom gothic floral scrollwork circling the entire perimeter","Includes raw canvas Juta Kapra jewel bag"]', '["https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=80","https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1000&q=80"]', TRUE, TRUE, 'thrift_1of1', 1, 'store-f7-archive', 'F-7 Flagship Archive', FALSE, FALSE, FALSE, FALSE, FALSE, '["Wallet","Leather","Silver 925","Jewelry","Archival Silver"]', 'Batch #42: No Wave & Indie', '2026-09-06'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  images = EXCLUDED.images,
  details = EXCLUDED.details,
  in_stock = EXCLUDED.in_stock,
  updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price,
  condition_grade, condition_tier, size, measurements, description, details,
  images, in_stock, is_1of1, inventory_type, stock_count, store_id, store_name,
  is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'prod-013', '1984-seiko-7548-7000-quartz-diver-watch', '1984 Seiko 7548-7000 Vintage Quartz Diver Watch', 'Accessories', 'watch', '1984', 28500, NULL, 'Vintage 9/10 - Serviced Movement', 'Mint', '42mm', '{"shoeSize":"Case: 42mm | Lug Width: 22mm"}', 'Iconic 1980s Seiko professional diver watch with original matte black dial, patina hands, and bi-directional click bezel. Fully serviced high-torque quartz movement.', '["Original Kanji/English day-date wheel","Solid stainless steel screw-down caseback","Matched vintage GL831 rubber diver strap included"]', '["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80"]', TRUE, TRUE, 'thrift_1of1', 1, 'store-f7-archive', 'F-7 Flagship Archive', FALSE, FALSE, FALSE, TRUE, TRUE, '["Seiko","Watch","Diver","Japan Made","1980s"]', 'Batch #44: 90s Grunge Grails', '2026-09-15'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  images = EXCLUDED.images,
  details = EXCLUDED.details,
  in_stock = EXCLUDED.in_stock,
  updated_at = NOW();

INSERT INTO public.products (
  id, slug, title, category, subcategory, era, price, original_price,
  condition_grade, condition_tier, size, measurements, description, details,
  images, in_stock, is_1of1, inventory_type, stock_count, store_id, store_name,
  is_hidden, is_reserved, is_archived, is_hot_deal, is_trending, tags, drop_batch, date_added
) VALUES (
  'prod-014', '1995-porter-yoshida-tanker-helmet-bag', '1995 Porter Yoshida & Co. Tanker Nylon Helmet Bag', 'Accessories', 'bags', '1995', 19500, NULL, 'Vintage 9.5/10 - Sage Green Flight Nylon', 'Good', 'One Size', '{"shoeSize":"W: 480mm H: 500mm"}', 'Authentic 1990s Porter Yoshida Tanker helmet bag inspired by US Air Force MA-1 flight jackets. Features high-density sage green nylon with signature Rescue Orange inner lining.', '["Made in Japan by Yoshida & Co.","Heavy-duty brass snap fasteners and YKK dual zippers","Twin front flap pockets & padded main compartment"]', '["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80"]', TRUE, TRUE, 'thrift_1of1', 1, 'store-f7-archive', 'F-7 Flagship Archive', FALSE, FALSE, FALSE, FALSE, TRUE, '["Porter","Yoshida","Bag","Japan Made","Nylon"]', 'Batch #44: 90s Grunge Grails', '2026-09-14'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  images = EXCLUDED.images,
  details = EXCLUDED.details,
  in_stock = EXCLUDED.in_stock,
  updated_at = NOW();

-- 4. SEED PAYMENT GATEWAYS (INCLUDING TOMPAY)
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
  publishable_key = EXCLUDED.publishable_key,
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
  publishable_key = EXCLUDED.publishable_key,
  disclaimer_note = EXCLUDED.disclaimer_note,
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
  publishable_key = EXCLUDED.publishable_key,
  disclaimer_note = EXCLUDED.disclaimer_note,
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
  publishable_key = EXCLUDED.publishable_key,
  disclaimer_note = EXCLUDED.disclaimer_note,
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
  disclaimer_note = EXCLUDED.disclaimer_note,
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
  disclaimer_note = EXCLUDED.disclaimer_note,
  updated_at = NOW();

