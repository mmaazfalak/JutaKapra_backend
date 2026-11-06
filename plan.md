# Architecture Plan & Technical Specification

**Project**: Juta Kapra E-Commerce Platform  
**Storefront**: [https://www.jutakapra.store](https://www.jutakapra.store)  
**Backend API**: [https://jutakaprabackend.vercel.app](https://jutakaprabackend.vercel.app)  
**Primary Database**: Supabase (`https://kbdrlhiishmetsddlstq.supabase.co`)  
**Date**: November 2026  

---

## 1. Executive Summary

This plan addresses four core objectives specified for the platform architecture:
1. **Dynamic Products Migration to Supabase**: Shift product records, full archival descriptions, images, pricing, condition grades, and inventory out of static code into Supabase `public.products`.
2. **Dynamic Payment Gateways in Supabase**: Shift all payment methods (COD, EasyPaisa, JazzCash, Meezan Bank, Stripe) from static frontend arrays into Supabase `public.payment_gateways`.
3. **TomPay Gateway Integration (`gw-tompay`)**: Register TomPay as a dynamic payment gateway managed in Supabase and available on checkout using credentials (`TOMPAY_API_KEY`, `TOMPAY_API_SECRET`).
4. **Order Item Discrepancy Correction**: Fix the bug where ordered products fail to appear on completed order records, receipts, and customer order tracking views by implementing safe payload normalization and defensive rendering.

---

## 2. Problem Diagnosis & Root Causes

### 2.1 Static Code Storage vs Dynamic Database
- **Products**: Stored in `src/data/mockData.ts` as `INITIAL_PRODUCTS`. Adding or modifying product descriptions requires code edits, rebuilds, and Vercel deployments.
- **Payment Methods**: Stored in `StoreContext.tsx` as `INITIAL_GATEWAYS` and cached in `localStorage` under `forge_gateways_v2`. Gateways cannot be toggled or configured remotely without local browser storage modifications.

### 2.2 Order Item Missing Product Display Bug
- In [`CustomerOrdersView.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra_Frontend/src/views/CustomerOrdersView.tsx#L545-L568) and [`AccountView.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra_Frontend/src/views/AccountView.tsx#L875-L896), item rendering strictly expects `it.product.images[0]` and `it.product.title`.
- If an order is synced via Supabase `public.orders` or backend REST `/api/orders` where items are flattened (`name`, `price`, `quantity`, `image`), `it.product` is undefined, causing React render crashes or unhandled exceptions that fail to render items.
- In [`CustomerOrdersView.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra_Frontend/src/views/CustomerOrdersView.tsx#L52-L68), privacy filtering filters out orders if `customerId` does not strictly match `profile.id` or `currentCustomer.id`, causing placed orders to disappear from the customer view upon page reload.

---

## 3. Database Schema Specification

### 3.1 Supabase Table: `public.products`
```sql
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

-- Indexes & RLS
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public or service manage products" ON public.products;
CREATE POLICY "Public or service manage products" ON public.products FOR ALL USING (true) WITH CHECK (true);
```

### 3.2 Supabase Table: `public.payment_gateways`
```sql
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
```

### 3.3 TomPay Gateway Seed Record
```sql
INSERT INTO public.payment_gateways (
  id, type, title, provider_name, is_enabled, environment, publishable_key, min_order_limit, max_order_limit, disclaimer_note, custom_instructions, updated_at
) VALUES (
  'gw-tompay',
  'tompay',
  'TomPay - Card & Digital Wallet (UK / Global)',
  'TomPay Financial Services Ltd',
  true,
  'live',
  'tp_live_8Oytj1Sc5WYTaCzZCSDCFDbSjeK0Frwx',
  500,
  500000,
  'Pay securely via TomPay with global credit/debit cards and local wallets.',
  'Instant redirect to TomPay PCI-DSS Level 1 secure payment checkout session.',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  provider_name = EXCLUDED.provider_name,
  is_enabled = EXCLUDED.is_enabled,
  publishable_key = EXCLUDED.publishable_key,
  disclaimer_note = EXCLUDED.disclaimer_note;
```

---

## 4. Frontend & Backend Implementation Details

### 4.1 Safe Order Item Normalizer (`src/utils/orderItem.ts`)
To prevent any future missing product bugs regardless of order source (Supabase, MongoDB, FileDB, Google Sheets):
```typescript
export interface NormalizedOrderItem {
  title: string;
  image: string;
  size: string;
  grade: string;
  price: number;
  quantity: number;
  product?: any;
}

export function normalizeOrderItem(it: any): NormalizedOrderItem {
  const prod = it.product || {};
  const title = prod.title || it.title || it.name || 'Archival Vintage Piece';
  const rawImage = (prod.images && prod.images[0]) || it.image || it.imageUrl || (Array.isArray(it.images) && it.images[0]) || '';
  const image = rawImage && rawImage.trim().length > 0 
    ? rawImage 
    : 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80';
  const size = it.selectedSize || it.size || prod.size || 'Standard';
  const grade = prod.conditionGrade || it.conditionGrade || prod.conditionTier || 'Archival 9/10';
  const price = Number(prod.price) || Number(it.price) || 0;
  const quantity = Number(it.quantity) || 1;

  return { title, image, size, grade, price, quantity, product: prod };
}
```

### 4.2 Dynamic Supabase Loading in [`StoreContext.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra_Frontend/src/context/StoreContext.tsx)
1. **Products Synchronization**:
   - On load, query `supabase.from('products').select('*').order('date_added', { ascending: false })`.
   - Map DB snake_case columns (`original_price`, `condition_grade`, `in_stock`, etc.) to frontend `Product` interface.
   - If Supabase is populated, use it as primary truth. If empty, seed initial catalog into Supabase automatically.
   - Subscribe to Supabase Realtime channel `public:products` for instant updates without reloads.
2. **Payment Gateways Synchronization**:
   - On load, query `supabase.from('payment_gateways').select('*')`.
   - Merge `gw-tompay` and ensure all active gateways dynamically feed `paymentGateways` state.
   - Gateways modified in Admin Portal save back directly to Supabase `public.payment_gateways`.
3. **Order Item Enrichment**:
   - When `createOrder` runs, ensure `items` store both complete `product` snapshots and top-level item attributes (`name`, `image`, `size`, `price`, `quantity`).
   - Store customer's email in `localStorage` session so guest checkouts automatically associate with their orders in `CustomerOrdersView.tsx`.

---

## 5. TomPay Checkout Integration
When a customer selects `gw-tompay`:
1. Customer initiates order in `CheckoutView.tsx`.
2. Frontend requests payment session from backend endpoint `POST /api/payments/tompay/create-session`.
3. Backend creates payment intent using `TOMPAY_API_KEY` and `TOMPAY_API_SECRET`.
4. Customer is redirected to TomPay's hosted payment gateway.
5. On TomPay callback / webhook, order status updates to `Confirmed` and triggers the Namecheap SMTP email confirmation.

---

## 6. Execution Roadmap & Safety Constraints
- [x] Document complete plan and architecture specification.
- [x] Create `supabase_products_and_gateways.sql` containing full table DDL, RLS policies, and seed inserts for products and gateways.
- [x] Implement `src/utils/orderItem.ts` and apply safe normalizer in `CustomerOrdersView.tsx`, `AccountView.tsx`, and `CheckoutView.tsx`.
- [x] Update `StoreContext.tsx` to dynamically query and synchronize `products` and `payment_gateways` with Supabase.
- [x] Add TomPay gateway option to `PaymentGatewayType` and checkout selector.
- [x] Verify build passes cleanly with zero errors (`npm run build`).
- [ ] **Strict Constraint**: Do NOT push to GitHub without explicit user instruction.
