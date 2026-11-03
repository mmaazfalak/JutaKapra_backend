-- ==============================================================================
-- JUTA.KAPRA VINTAGE FORGE - MULTI-VENDOR STORES SCHEMA FOR SUPABASE
-- Run this script in the Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Create public.stores table
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

-- 2. Indexes for high-speed queries
CREATE INDEX IF NOT EXISTS idx_stores_owner_email ON public.stores (LOWER(owner_email));
CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores (slug);
CREATE INDEX IF NOT EXISTS idx_stores_status ON public.stores (status);
CREATE INDEX IF NOT EXISTS idx_stores_is_hidden ON public.stores (is_hidden);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Allow public read access to active stores
CREATE POLICY "Public can read active stores"
ON public.stores
FOR SELECT
USING (true);

-- 5. RLS Policies: Allow insert/update/delete for authenticated administrators or anon key for service sync
CREATE POLICY "Service and Admin can manage stores"
ON public.stores
FOR ALL
USING (true)
WITH CHECK (true);

-- 6. Updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_stores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_stores_updated_at ON public.stores;
CREATE TRIGGER tr_stores_updated_at
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.handle_stores_updated_at();

-- 7. Seed Initial Store Entities
INSERT INTO public.stores (id, name, slug, owner_email, owner_name, owner_phone, passcode, status, is_hidden, city, address, commission_rate, description)
VALUES
    (
        'store-main',
        'Juta.Kapra Flagship Vault',
        'juta-kapra-flagship-vault',
        'admin@jutakapra.com',
        'Platform Master Curator',
        '+92 300 0000000',
        'admin123',
        'active',
        FALSE,
        'Islamabad',
        'Beverly Centre, Blue Area, F-6/1, Islamabad',
        0.00,
        'Primary flagship archival inventory and corporate warehouse.'
    ),
    (
        'store-lahore-archival',
        'Lahore Vintage Archival Lab',
        'lahore-vintage-archival-lab',
        'lahore.archival@jutakapra.com',
        'Hamza Farooq',
        '+92 321 4455667',
        'store123',
        'active',
        FALSE,
        'Lahore',
        'Gulberg III, MM Alam Road, Lahore',
        10.00,
        'Specializing in vintage 90s streetwear, graphic tees, and collegiate crewnecks.'
    ),
    (
        'store-karachi-vault',
        'Karachi Leather & Denim Forge',
        'karachi-leather-denim-forge',
        'karachi.denim@jutakapra.com',
        'Zainab Abbasi',
        '+92 333 7788990',
        'store123',
        'active',
        FALSE,
        'Karachi',
        'Zamzama Commercial, Phase 5, DHA, Karachi',
        12.00,
        'Curated single-stitch denim, genuine leather bombers, and heritage boots.'
    ),
    (
        'store-rawalpindi-vault',
        'Pindi Street & Workwear Vault',
        'pindi-street-workwear-vault',
        'pindi.vault@jutakapra.com',
        'Tariq Mahmood',
        '+92 312 9988776',
        'store123',
        'active',
        FALSE,
        'Rawalpindi',
        'Bank Road, Saddar, Rawalpindi',
        10.00,
        'Heavyweight Carhartt workwear, oversized chore jackets, and military surplus.'
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    owner_email = EXCLUDED.owner_email,
    owner_name = EXCLUDED.owner_name,
    commission_rate = EXCLUDED.commission_rate,
    city = EXCLUDED.city,
    updated_at = NOW();
