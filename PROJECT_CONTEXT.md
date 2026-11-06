# 🏛️ JUTA KAPRA — Master Project Context & Fast-Analysis Index (`PROJECT_CONTEXT.md`)

> **Purpose**: Master technical reference index for AI agents (Antigravity) and engineers. Maps architecture, multi-repo deployment targets, complete file tree, Supabase PostgreSQL schema, current milestone statuses, and critical thrift/payment edge cases. Read this file FIRST for instant zero-shot analysis.

---

## 1. Repository & Deployment Architecture

The Juta Kapra ecosystem comprises a primary monorepo and two production deployment mirrors:

| Target | Directory | Remote Repository | Production URL | Build / Deploy Command | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Monorepo (Root)** | `/Users/mmaazfalak/antigravity/Jutakapra` | `https://github.com/Zackwilliam9988/jutakapra.git` | — | `npm run build` | Unified frontend + backend workspace. |
| **Frontend Mirror** | `/Users/mmaazfalak/antigravity/Jutakapra_Frontend` | `https://github.com/mmaazfalak/Jutakapra_Frontend.git` | `https://www.jutakapra.store` | `npm run build` (Vite) | Production client deployed on Vercel. |
| **Backend Mirror** | `/Users/mmaazfalak/antigravity/JutaKapra_backend` | `https://github.com/mmaazfalak/JutaKapra_backend.git` | `https://jutakaprabackend.vercel.app` | `npm run build` (`@vercel/node`) | Production Express API on Vercel. |
| **Database** | Supabase Cloud | Ref: `kbdrlhiishmetsddlstq` | `https://kbdrlhiishmetsddlstq.supabase.co` | SQL Editor / Migrations | PostgreSQL with RLS & Realtime enabled. |

> **IMPORTANT SYNC & PUSH RULES**:
> 1. Code changes in `src/` must be mirrored to `Jutakapra_Frontend/src/`.
> 2. Code changes in `server/` must be mirrored to `JutaKapra_backend/server/`.
> 3. **Strict Constraint**: NEVER execute `git push` to GitHub remotes without explicit user confirmation.

---

## 2. Complete File Structure & Component Map

```
Jutakapra/
├── api/
│   └── index.ts                         # Vercel serverless HTTP entrypoint wrapping Express server
├── gas/
│   └── Code.gs                          # Google Apps Script mailer & Google Sheets sync (paused for SMTP)
├── public/
│   ├── favicon.png                      # Favicon monogram
│   ├── logo.png                         # Master transparent dark monogram (light mode)
│   ├── logo-white.png                   # Master transparent light monogram (dark mode)
│   ├── logo-192.png / logo-512.png      # PWA application icons
│   └── images/                          # Curated fallback product assets
├── scripts/
│   └── verify_supabase_stores.ts        # CLI verification utility for Supabase stores table sync
├── server/
│   ├── controllers/
│   │   ├── authController.ts            # Auth, JWT, bcrypt password changes, Google OAuth upsert
│   │   ├── orderController.ts           # Order dispatch, courier tracking, email triggers
│   │   └── paymentController.ts         # [NEW] TomPay checkout session, webhook listener, verification
│   ├── data/
│   │   ├── initialProducts.ts           # Static fallback product catalog (25 archival pieces)
│   │   ├── orders.json                  # Resilient JSON file database for orders
│   │   ├── products.json                # Resilient JSON file database for products
│   │   └── users.json                   # Resilient JSON file database for user credentials
│   ├── middleware/
│   │   └── auth.ts                      # JWT bearer verification and admin role guard
│   ├── models/
│   │   ├── order.model.ts               # Order Mongoose/JSON model interface
│   │   ├── product.model.ts             # Product Mongoose/JSON model interface
│   │   └── user.model.ts                # User Mongoose/JSON model interface
│   ├── routes/
│   │   ├── authRoutes.ts                # Endpoints: /api/auth (login, register, google, change-password)
│   │   ├── orderRoutes.ts               # Endpoints: /api/orders (create, list, track, dispatch, fulfill)
│   │   └── paymentRoutes.ts             # [NEW] Endpoints: /api/payments (tompay session, webhook, verify)
│   ├── services/
│   │   ├── emailService.ts              # Authenticated PrivateEmail SMTP mailer (support@jutakapra.store)
│   │   ├── fileDatabase.ts              # File-backed persistence fallback when MongoDB is unset
│   │   ├── sheetsService.ts             # Google Sheets sales sync service (paused URL)
│   │   ├── supabaseService.ts           # Server-side Supabase client with SERVICE_ROLE_KEY
│   │   └── webhookService.ts            # Outgoing webhook dispatcher
│   ├── utils/crypto.ts                  # SHA-256 and AES-256 encryption helpers
│   ├── db.ts                            # Hybrid database connector (MongoDB + Supabase + FileDB fallback)
│   └── server.ts                        # Express application initialization, CORS, cron intervals, routes
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminDashboardOverview.tsx # Metrics, live sales counter, recent order activity
│   │   │   ├── AdminDropsView.tsx         # Curated vintage drop scheduling
│   │   │   ├── AdminOrdersView.tsx        # Order management, status updates, inline delivery date picker
│   │   │   ├── AdminProductsView.tsx      # Vintage catalog editor, 1-of-1 tags, stock toggle
│   │   │   ├── AdminReviewsView.tsx       # Moderation of customer reviews
│   │   │   ├── AdminStoreConfigView.tsx   # Storefront theme, banner, and fee settings
│   │   │   ├── AdminStoresView.tsx        # Multi-vendor store accounts and commission telemetry
│   │   │   ├── AdminSupportView.tsx       # Customer inquiry inbox and direct responses
│   │   │   └── AdminTeamRBACView.tsx      # Admin roles and staff permission assignments
│   │   ├── AddressManager.tsx           # Shipping address selector and address book modal
│   │   ├── AdminHeader.tsx              # Admin navigation bar with store switchboard
│   │   ├── AdminLayout.tsx              # Shell layout with responsive AdminSidebar
│   │   ├── AdminSidebar.tsx             # Collapsible sidebar with role-aware module links
│   │   ├── CartDrawer.tsx               # [DEPRECATED from render tree] Legacy sliding cart drawer
│   │   ├── CheckoutGateModal.tsx        # Guest vs Authenticated checkout decision modal
│   │   ├── CommandKModal.tsx            # Global cmd+k search modal for quick catalog & store navigation
│   │   ├── FloatingCartButton.tsx       # Floating bag trigger (hidden on /cart page)
│   │   ├── Footer.tsx                   # Brand footer with policies, newsletter, and social links
│   │   ├── GoogleSetupPasswordModal.tsx # Post-OAuth password creation prompt
│   │   ├── Header.tsx                   # Sticky top header with monogram, search, bag counter, auth
│   │   ├── MobileAppNavBar.tsx          # Mobile bottom dock with active indicator for /cart
│   │   ├── OrderFulfillmentModal.tsx    # Courier assignment and estimated delivery date modal
│   │   ├── PaymentMethodsManager.tsx    # [UPDATED] Gateway management, API keys, limits, and TomPay
│   │   ├── ProductCard.tsx              # Vintage product card with condition badge, price, 1-of-1 flag
│   │   ├── QuickViewModal.tsx           # Instant modal overlay for product inspection
│   │   └── ToastContainer.tsx           # Global notification toast renderer
│   ├── context/
│   │   └── StoreContext.tsx             # [UPDATED] Master state: Supabase products & gateways sync, cart, auth
│   ├── data/
│   │   ├── crmMockData.ts               # CRM interaction mock records
│   │   └── mockData.ts                  # Initial client fallback seed products
│   ├── lib/
│   │   ├── emailService.ts              # Client-side email relay targeting backend /api/email/send
│   │   ├── googleAuth.ts                # Google One-Tap & OAuth SDK integration
│   │   └── supabase.ts                  # [UPDATED] Supabase client, queries for products & payment gateways
│   ├── utils/
│   │   ├── api.ts                       # safeFetchJson with resilient failover & base URL resolution
│   │   ├── crypto.ts                    # Client-side string hashing
│   │   ├── format.ts                    # Currency (PKR) and timestamp formatting utilities
│   │   ├── orderItem.ts                 # [NEW] Safe universal order item payload normalizer
│   │   └── supabase/
│   │       ├── client.ts                # Browser Supabase client helper
│   │       └── server.ts                # SSR Supabase client helper
│   ├── views/
│   │   ├── AccountView.tsx              # [UPDATED] User profile, password management, order history
│   │   ├── AdminDashboardView.tsx       # Admin master portal routing modules
│   │   ├── AdminLoginView.tsx           # Multi-vendor store login & master admin auth
│   │   ├── CartView.tsx                 # [UPDATED] Dedicated full-page Bag / Cart view
│   │   ├── ChangePasswordView.tsx       # Dedicated change password view
│   │   ├── CheckoutView.tsx             # [UPDATED] Checkout flow, TomPay selector, order creation
│   │   ├── ConditionGuideView.tsx       # Vintage condition tier visual grading guide (10/10 to Distressed)
│   │   ├── ContactView.tsx              # Customer support contact view
│   │   ├── CustomerOrdersView.tsx       # [UPDATED] Customer order tracking with normalized item rendering
│   │   ├── DropsView.tsx                # Limited-time archival drops gallery
│   │   ├── ForgotPasswordView.tsx       # OTP reset request form
│   │   ├── HomeView.tsx                 # Landing page with hero, drops, categories, and trending
│   │   ├── LoginView.tsx                # Customer sign-in form
│   │   ├── ProductDetailView.tsx        # Product deep dive, measurements, 1-of-1 stock badge
│   │   ├── ProfileEditView.tsx          # Profile details and avatar editor
│   │   ├── RegisterView.tsx             # Customer account creation form
│   │   ├── ResetPasswordView.tsx        # New password entry with OTP token validation
│   │   ├── ShopView.tsx                 # Catalog explorer with category, size, price, and condition filters
│   │   └── VerifyOtpView.tsx            # 6-digit OTP verification interface
│   ├── App.tsx                          # App shell, URL hash/path routing, theme provider
│   ├── index.css                        # Tailwind CSS v4 styling rules and typography
│   ├── main.tsx                         # React 19 application mount point
│   └── types.ts                         # [UPDATED] TypeScript interfaces (Product, PaymentGateway, Order, etc.)
├── supabase_master_schema.sql           # Schema for profiles, orders, order_items, stores
├── supabase_products_and_gateways.sql   # [NEW] DDL, RLS & seed SQL for products & payment_gateways
├── supabase_stores_schema.sql           # Multi-vendor stores schema and RLS
├── Changelog.md                         # Semantic version change log
├── plan.md                              # Architecture & technical specification
├── progress.md                          # Progress tracker and task status
└── vercel.json                          # Vercel deployment routes and rewrites
```

---

## 3. Database & Supabase Schema Specification

Supabase Reference: `https://kbdrlhiishmetsddlstq.supabase.co`

### 3.1 Table: `public.products` (Dynamic Archival Catalog)
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

-- RLS: Public SELECT, Service Role or Public ALL
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public or service manage products" ON public.products FOR ALL USING (true) WITH CHECK (true);
```

### 3.2 Table: `public.payment_gateways` (Dynamic Payment Methods)
```sql
CREATE TABLE IF NOT EXISTS public.payment_gateways (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,                  -- 'cod' | 'easypaisa' | 'jazzcash' | 'bank' | 'stripe' | 'tompay' | 'custom'
  title TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  environment TEXT DEFAULT 'live',     -- 'sandbox' | 'live'
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

-- RLS: Public SELECT, Service Role or Public ALL
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read payment gateways" ON public.payment_gateways FOR SELECT USING (true);
CREATE POLICY "Public or service manage payment gateways" ON public.payment_gateways FOR ALL USING (true) WITH CHECK (true);
```

### 3.3 Active Payment Gateways Seed
1. `gw-cod`: Cash on Delivery (COD) — Limit: PKR 500 – 100,000.
2. `gw-easypaisa`: Easypaisa Mobile Wallet — Number: `0300 5550192` (Forge Supply Operations).
3. `gw-jazzcash`: JazzCash Mobile Wallet — Number: `0300 5550192` (Forge Supply Operations).
4. `gw-meezan`: Meezan Bank Transfer — IBAN: `PK36MEZN0001010102940192`, BIC: `MEZNPKKA`.
5. `gw-stripe`: Stripe Credit/Debit Cards.
6. `gw-tompay`: TomPay Global Cards & Digital Wallets — Key: `tp_live_8Oytj1Sc5WYTaCzZCSDCFDbSjeK0Frwx`, Limit: PKR 500 – 500,000.

### 3.4 Table: `public.orders` & `public.order_items`
```sql
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  shipping_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'Pending',
  status TEXT NOT NULL DEFAULT 'Processing',
  tracking_number TEXT,
  courier TEXT,
  estimated_delivery_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  title TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  selected_size TEXT,
  condition_grade TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.5 Table: `public.profiles` & Auth Trigger
```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: Automatically mirror Supabase Auth signups into public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    'customer'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. Current Feature Status & Milestone Map

| Milestone | Description | Status | Evidence / Commits |
| :--- | :--- | :---: | :--- |
| **M1: Transparent Logo** | Alpha-transparent PNG monograms (`/logo.png`, `/logo-white.png`) replacing white boxed images. | **100% DONE** | `b8d1b0d` |
| **M2: Form Polish** | Removed dummy placeholder text (`Zainab Malik`, test phones) from auth inputs. | **100% DONE** | `d63c2d4` |
| **M3: Dedicated Cart Page** | Replaced slide-out drawer with dedicated `/cart` page view; persistent Header and bottom dock. | **100% DONE** | `5141fe7`, `c195e97` |
| **M4: Google Auth & Password** | Hardened Google OAuth user password lifecycle; requires `currentPassword` once established. | **100% DONE** | `041793a` |
| **M5: Email Lifecycle & Admin** | Dispatched order delivery date in email, deduplicated 120s locks, 10-hour cart recovery. | **100% DONE** | `fa2018a`, `c779157` |
| **M6: SMTP & Paused GAS** | Routed all notifications through Namecheap SMTP (`support@jutakapra.store`); paused GAS URL. | **100% DONE** | `764d21b`, `0be29b7` |
| **M7: Dynamic Supabase Sync** | Shifted products & gateways to Supabase; added universal order item normalizer. | **100% DONE** | `bafb940`, `abc2651` |
| **M8: TomPay Gateway Integration** | Backend routes, session generator, checkout UI integration, and Admin credentials manager. | **READY FOR LIVE TEST** | `bafb940`, `PaymentMethodsManager.tsx` |
| **M9: Zero-Code Data & AI Catalog** | 100% data purge from code (`INITIAL_PRODUCTS = []`, zero Unsplash links); 13 studio AI vintage assets generated; full Supabase DDL & seed script. | **100% DONE** | `mockData.ts`, `StoreContext.tsx`, `supabase_products_and_gateways.sql` |

### Immediate Pending Tasks:
1. **Catalog & Storefront Verification**: Verify dynamic product feed rendering on [www.jutakapra.store](https://www.jutakapra.store) sourced directly from Supabase.
2. **TomPay Live Webhook Verification**: Register `https://jutakaprabackend.vercel.app/api/payments/tompay/webhook` in TomPay merchant dashboard and perform a test card checkout.

---

## 5. Gotchas, Architectural Quirks & Edge Cases

### 5.1 Thrift / Archival 1-of-1 SKU Inventory Handling
- **Strict Single-Quantity Limit**: Every thrift garment is a 1-of-1 vintage piece (`is_1of1 = true`, `stock_count = 1`). In `CartView` and `StoreContext.addToCart`, incrementing quantity beyond 1 is strictly prohibited and presents: *"1-of-1 Vintage Item: Only 1 available in stock for unique thrift items."*
- **Trailing Sold-Out Sorting**: Products with `in_stock = false` must automatically sort to the trailing end of catalog queries in `ShopView`, `DropsView`, and `HomeView`, ensuring sold vintage items do not dominate catalog listings.
- **Historic Snapshot Preservation**: Because thrift items are one-off items that may be archived or removed from `public.products` after purchase, order records (`public.order_items` and JSON payloads) MUST store an immutable snapshot of `title`, `price`, `size`, `condition_grade`, and `image_url`. They must never depend on live product relational joins.

### 5.2 Heterogeneous Order Item Payloads & Normalizer (`src/utils/orderItem.ts`)
- **Root Cause**: Orders originate from three possible storage adapters (Supabase relational DB, FileDatabase `server/data/orders.json`, and local browser storage). Historically, some sources nested products (`it.product.title`), while others flattened fields (`it.title`, `it.name`).
- **The Crash**: Rendering `it.product.images[0]` when `it.product` is undefined causes unhandled React render exceptions and blank order rows.
- **Mandatory Normalization**: Every order-rendering component (`CustomerOrdersView`, `AccountView`, `CheckoutView`, `AdminOrdersView`) MUST wrap order item iterations with `normalizeOrderItem(it)`:
  ```typescript
  import { normalizeOrderItem } from '../utils/orderItem';
  const item = normalizeOrderItem(rawItem);
  // Safely access item.title, item.image, item.size, item.grade, item.price, item.quantity
  ```

### 5.3 Payment Gateway State & `localStorage` Cache Poisoning
- **The Problem**: `StoreContext.tsx` stores payment gateways in browser `localStorage` under `forge_gateways_v2`. When new gateways (e.g. `gw-tompay`) are deployed in code or Supabase, existing user sessions load the stale cached array, masking the new gateway.
- **The Fix**: `StoreContext.tsx` runs an automatic set-difference reconciliation during initialization and Supabase fetch:
  ```typescript
  const existingIds = new Set(data.map((g) => g.id));
  const missing = INITIAL_GATEWAYS.filter((g) => !existingIds.has(g.id));
  const merged = [...data, ...missing];
  setPaymentGateways(merged);
  ```
  This guarantees newly registered gateways appear immediately without requiring manual cache clearing.

### 5.4 Dual Authentication & Password Lifecycle
- Google OAuth accounts initially have no password (`hasPassword: false`).
- Users can establish a password via `AccountView` or `GoogleSetupPasswordModal`.
- Once established, the backend enforces `currentPassword` verification via bcrypt before allowing password changes. The frontend dynamically switches headers between *"Set Account Password"* and *"Update Password"*, preventing unauthenticated password overwrite loops.

### 5.5 Transactional Email & Dedicated SMTP
- **Strictly Paused External GAS Mailer**: `PAUSE_DEPLOYMENT_URL_EMAILS = true` across frontend and backend. External Google Apps Script email dispatching is deactivated.
- **Direct Authenticated SMTP**: All transactional emails (Order Placed, Order Confirmed, Order Dispatched with Delivery Date, Password Reset OTP, 10h Cart Recovery) are dispatched via Namecheap PrivateEmail SMTP (`mail.privateemail.com`, port 465 SSL) from `"Juta Kapra" <support@jutakapra.store>`.
- **Duplicate Prevention**:
  1. Synchronous lock ref (`submissionLockRef`) in `CheckoutView.tsx` stops double-click race conditions.
  2. Client passes `skipEmailNotification: true` to backend `/api/orders` to ensure only a single confirmation email is sent.
  3. `sentOrderEmailIds` set prevents duplicate client triggers.

### 5.6 Vercel Serverless & Hobby Plan Restrictions
- Vercel Hobby tier rejects cron expressions more frequent than daily (`0 0 * * *`). Hourly crons (`0 * * * *`) trigger build errors.
- Abandoned cart recovery (10-hour threshold) uses an in-memory 30-minute timer in the Node server and a daily Vercel cron fallback.
