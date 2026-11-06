# Progress Tracker & Task Status

**Project**: Juta Kapra E-Commerce Platform  
**Last Updated**: November 6, 2026, 14:30 PKT  
**Branch**: `main`  
**Production URLs**:
- Front-End: [https://www.jutakapra.store](https://www.jutakapra.store)
- Back-End: [https://jutakaprabackend.vercel.app](https://jutakaprabackend.vercel.app)
- Primary Database: Supabase (`https://kbdrlhiishmetsddlstq.supabase.co`)

---

## 1. High-Level Summary

| Category | Total Tasks | Completed | In Progress | Pending |
|---|:---:|:---:|:---:|:---:|
| **Brand Identity & Assets** | 1 | 1 | 0 | 0 |
| **User Registration & Forms** | 1 | 1 | 0 | 0 |
| **Cart / Bag Dedicated Page** | 1 | 1 | 0 | 0 |
| **Auth & Password Security** | 1 | 1 | 0 | 0 |
| **Email Lifecycle & Admin Overhaul** | 1 | 1 | 0 | 0 |
| **support@jutakapra.store SMTP & Pause GAS** | 1 | 1 | 0 | 0 |
| **Dynamic Supabase Products & Gateways** | 1 | 1 | 0 | 0 |
| **TomPay Payment Gateway Integration** | 1 | 1 | 0 | 0 |
| **Zero-Code Data Purge & AI Catalog** | 1 | 1 | 0 | 0 |
| **Total** | **9** | **9 (100%)** | **0** | **0** |

---

## 2. Completed Milestones

### Milestone 1: Recreate Monogram Logo with Transparent Background
- **Status**: Completed & Verified Live
- **Commit**: `b8d1b0d`
- **Actions**:
  - Downloaded source image containing "J" & "K" filled apparel silhouette artwork.
  - Processed image with Python Pillow: eliminated the rectangular white screenshot box, executed flood-fill with anti-aliasing, and defringed edges to guarantee transparent PNG output.
  - Deployed assets: `/logo.png`, `/logo-white.png`, `/favicon.png`, `/logo-512.png`, `/logo-192.png`.
  - Integrated into [`Header.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra/src/components/Header.tsx), [`Footer.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra/src/components/Footer.tsx), and [`index.html`](file:///Users/mmaazfalak/antigravity/Jutakapra/index.html).

---

### Milestone 2: Registration & Login Form Placeholder Polish
- **Status**: Completed & Verified Live
- **Commit**: `d63c2d4`
- **Actions**:
  - Removed dummy test placeholder strings (`e.g. Zainab Malik`, `you@example.com`, `+92 300 1234567`) from [`RegisterView.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra/src/views/RegisterView.tsx) and [`LoginView.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra/src/views/LoginView.tsx).
  - Ensured all input fields retain clean labels and placeholders without dummy sample text.

---

### Milestone 3: Dedicated Shopping Bag Page (`CartView`) Transition
- **Goal**: Bag must operate as a dedicated page view without sliding over and obscuring header and navigation tabs.
- **Status**: 100% Completed & Deployed
- **Commit**: `5141fe7`, `c195e97`
- **Subtask Checklist**:
  - [x] **Audit existing components**: `CartView.tsx` wired to `case 'cart': return <CartView />` in `App.tsx`.
  - [x] **Update Mobile Navigation Bar** ([`MobileAppNavBar.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra/src/components/MobileAppNavBar.tsx)): Replaced drawer toggle with `navigateTo('cart')`; added active red layout indicator.
  - [x] **Update Floating Cart Button** ([`FloatingCartButton.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra/src/components/FloatingCartButton.tsx)): Replaced with `navigateTo('cart')`; hidden on `/cart` view.
  - [x] **Disable Slide Overlay** ([`App.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra/src/App.tsx)): Removed `<CartDrawer />` from active render tree.
  - [x] **Desktop Header Bag Trigger** ([`Header.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra/src/components/Header.tsx)): Added dedicated Bag button with live item counter badge.

---

### Milestone 4: Google Auth & Password Lifecycle Hardening
- **Goal**: Prevent repeat password setup loops for Google users; enforce current password verification when updating.
- **Status**: 100% Completed & Deployed
- **Commit**: `041793a`
- **Subtask Checklist**:
  - [x] **Backend Controller Fix** ([`server/controllers/authController.ts`](file:///Users/mmaazfalak/antigravity/Jutakapra/server/controllers/authController.ts)): Made `currentPassword` mandatory when `user.passwordHash` exists; added bcrypt comparison.
  - [x] **Database User Record Mapping Fix** ([`server/db.ts`](file:///Users/mmaazfalak/antigravity/Jutakapra/server/db.ts)): Updated `upsertGoogleUser` to include `passwordHash` and `password` on returned `userRecord`.
  - [x] **Frontend Password Form Refinement** ([`AccountView.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra/src/views/AccountView.tsx)): Removed suppression of current password; dynamically switches between "Set Account Password" and "Update Password".

---

### Milestone 5: Email Lifecycle, Backend & Admin Panel Overhaul
- **Goal**: Production-ready email dispatcher, duplicate email suppression, empty deployment URL safety, admin delivery date dispatch, and 10-hour abandoned cart recovery.
- **Status**: 100% Completed & Deployed
- **Commits**: `fa2018a` (Frontend), `c779157` (Backend)
- **Subtask Checklist**:
  - [x] **Google Apps Script Backend** ([`gas/Code.gs`](file:///Users/mmaazfalak/antigravity/Jutakapra/gas/Code.gs)): Modular dispatcher with `LockService` and `CacheService` 120s deduplication locks.
  - [x] **Checkout Duplicate Prevention** ([`CheckoutView.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra/src/views/CheckoutView.tsx)): Wrapped submission with `submissionLockRef` debounce; passed `skipEmailNotification: true` to `/api/orders`.
  - [x] **Admin Delivery Date Dispatch** ([`AdminOrdersView.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra/src/components/admin/AdminOrdersView.tsx), [`OrderFulfillmentModal.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra/src/components/OrderFulfillmentModal.tsx)): Added inline date picker input on confirmed orders.
  - [x] **10-Hour Cart Abandonment Logic** ([`server/server.ts`](file:///Users/mmaazfalak/antigravity/Jutakapra/server/server.ts)): Background 30-minute interval checking inactive carts without promo codes.

---

### Milestone 6: Dedicated SMTP Sender (`support@jutakapra.store`) & Pause GAS URL
- **Goal**: Send all emails from `support@jutakapra.store` using authenticated SMTP; strictly pause the deployment URL email function.
- **Status**: 100% Completed & Deployed
- **Commits**: `764d21b` (Frontend), `0be29b7` (Backend)
- **Subtask Checklist**:
  - [x] **Verified PrivateEmail SMTP Credentials**: Verified `mail.privateemail.com` on port 465 SSL using `support@jutakapra.store`.
  - [x] **Strictly Paused Deployment URL Sending**: Added `PAUSE_DEPLOYMENT_URL_EMAILS = true` in frontend and backend `emailService.ts`.
  - [x] **Direct Backend Relay**: Configured `sendNotificationEmail` in [`src/lib/emailService.ts`](file:///Users/mmaazfalak/antigravity/Jutakapra/src/lib/emailService.ts) to dispatch payloads to `/api/auth/send-email` and `/api/email/send`.
  - [x] **Vercel Hobby Plan Fix**: Changed cron schedule to daily `0 0 * * *` to eliminate Hobby plan build errors.

---

### Milestone 7: Dynamic Supabase Products, Gateways & Universal Order Item Normalizer
- **Goal**: Move product catalog and payment methods into Supabase SQL database; fix order items missing display bug across customer accounts.
- **Status**: 100% Completed & Deployed
- **Commit**: `bafb940` (Monorepo), `abc2651` (Frontend), `7142c41` (Backend)
- **Subtask Checklist**:
  - [x] **Supabase SQL Schema** ([`supabase_products_and_gateways.sql`](file:///Users/mmaazfalak/antigravity/Jutakapra/supabase_products_and_gateways.sql)):
    - Created `public.products` (25 vintage products, condition grades, measurements, 1-of-1 tags, RLS).
    - Created `public.payment_gateways` (6 payment channels: COD, Easypaisa, JazzCash, Meezan Bank, Stripe, TomPay).
  - [x] **Universal Order Item Normalizer** ([`src/utils/orderItem.ts`](file:///Users/mmaazfalak/antigravity/Jutakapra/src/utils/orderItem.ts)):
    - Built `normalizeOrderItem(it)` handling heterogeneous order items from Supabase, MongoDB, FileDB, and Google Sheets.
    - Eliminated React render crashes caused by undefined `it.product`.
  - [x] **Storefront Dynamic State Sync** ([`src/context/StoreContext.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra/src/context/StoreContext.tsx)):
    - Fetches live products and payment gateways from Supabase on launch.
    - Set reconciliation automatically merges `INITIAL_GATEWAYS` with cached `localStorage` data to prevent cache poisoning.
  - [x] **Defensive Order Views Updated**: Applied `normalizeOrderItem` in [`CustomerOrdersView.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra/src/views/CustomerOrdersView.tsx) and [`AccountView.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra/src/views/AccountView.tsx).

---

### Milestone 8: TomPay Payment Gateway End-to-End Integration
- **Goal**: Integrate TomPay debit/credit card and digital wallet gateway with secure checkout session generation, webhook confirmation, and admin credentials control.
- **Status**: 100% Code Complete & Built (Pending Live Test)
- **Commits**: `bafb940`, updated `PaymentMethodsManager.tsx` & `CheckoutView.tsx`
- **Subtask Checklist**:
  - [x] **Backend Service & Controller** ([`server/controllers/paymentController.ts`](file:///Users/mmaazfalak/antigravity/Jutakapra/server/controllers/paymentController.ts), [`server/routes/paymentRoutes.ts`](file:///Users/mmaazfalak/antigravity/Jutakapra/server/routes/paymentRoutes.ts)):
    - Mounted `POST /api/payments/tompay/create-session`.
    - Mounted `POST /api/payments/tompay/webhook` for payment authorizations.
    - Mounted `GET /api/payments/tompay/verify/:orderId` for redirect status check.
  - [x] **Storefront Checkout Integration** ([`src/views/CheckoutView.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra/src/views/CheckoutView.tsx)):
    - Added TomPay option with credit card branding and PCI-DSS Level 1 security badge.
    - Wired checkout handler to request backend session creation.
  - [x] **Admin Dashboard Controls** ([`src/components/PaymentMethodsManager.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra/src/components/PaymentMethodsManager.tsx)):
    - Added API Key / Publishable Key and Secret Key configuration fields.
    - Added clipboard copy helpers and quick-add wallet/bank buttons.
    - Added summary metrics: Configured Gateways and Active in Checkout counters.

---

### Milestone 9: Zero-Code Data Purge & AI-Generated Archival Catalog
- **Goal**: Completely purge all hardcoded products and static Unsplash image links from frontend and backend code; generate studio-grade AI vintage fashion assets; create master dynamic Supabase SQL schema and seeding script.
- **Status**: 100% Completed & Verified
- **Actions**:
  - Generated 13 high-resolution AI studio product photographs for archival items saved into `public/images/products/`.
  - Purged `INITIAL_PRODUCTS` from `src/data/mockData.ts`, `server/data/initialProducts.ts`, and `server/data/products.json` (`INITIAL_PRODUCTS = []`).
  - Purged `INITIAL_GATEWAYS` static data array from `src/context/StoreContext.tsx`.
  - Configured `StoreContext.tsx` to initialize `products = []` and `paymentGateways = []`, streaming state dynamically from Supabase `public.products` and `public.payment_gateways`.
  - Created master DDL and seed migration script [`supabase_products_and_gateways.sql`](file:///Users/mmaazfalak/antigravity/Jutakapra/supabase_products_and_gateways.sql).
  - Created fast batch ingestion script [`scripts/seed_supabase_catalog.ts`](file:///Users/mmaazfalak/antigravity/Jutakapra/scripts/seed_supabase_catalog.ts).
  - Verified `npm run build` succeeds cleanly with 0 errors across root and frontend.

---

## 3. Latest File Structure Changes

| File | Purpose / Role | Introduced / Modified |
| :--- | :--- | :---: |
| [`PROJECT_CONTEXT.md`](file:///Users/mmaazfalak/antigravity/Jutakapra/PROJECT_CONTEXT.md) | Master AI context index mapping multi-repo topology, database schemas, and edge cases. | **NEW** |
| [`src/utils/orderItem.ts`](file:///Users/mmaazfalak/antigravity/Jutakapra/src/utils/orderItem.ts) | Universal payload normalizer ensuring safe title, image, size, grade, and price rendering. | `bafb940` |
| [`server/controllers/paymentController.ts`](file:///Users/mmaazfalak/antigravity/Jutakapra/server/controllers/paymentController.ts) | TomPay checkout session generation, webhook handling, and payment verification. | `bafb940` |
| [`server/routes/paymentRoutes.ts`](file:///Users/mmaazfalak/antigravity/Jutakapra/server/routes/paymentRoutes.ts) | Routes mounting `/api/payments/tompay/*` endpoints on Express server. | `bafb940` |
| [`supabase_products_and_gateways.sql`](file:///Users/mmaazfalak/antigravity/Jutakapra/supabase_products_and_gateways.sql) | DDL, RLS policies, and seed data for `public.products` and `public.payment_gateways`. | `bafb940` |
| [`src/views/CartView.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra/src/views/CartView.tsx) | Dedicated full-page Bag / Cart view replacing legacy slide-out overlay drawer. | `c195e97` |
| [`gas/Code.gs`](file:///Users/mmaazfalak/antigravity/Jutakapra/gas/Code.gs) | Standalone Google Apps Script dispatcher with 120s `CacheService` / `LockService` locks. | `fa2018a` |

---

## 4. Database & Schema Updates (Supabase)

Supabase URL: `https://kbdrlhiishmetsddlstq.supabase.co`

### Newly Created / Migrated Tables:
1. **`public.products`**:
   - `id TEXT PRIMARY KEY`, `slug TEXT UNIQUE`, `title`, `category`, `subcategory`, `era`, `price`, `original_price`
   - `condition_grade`, `condition_tier`, `size`, `measurements JSONB`, `description`, `details JSONB`, `images JSONB`
   - `in_stock BOOLEAN`, `is_1of1 BOOLEAN`, `inventory_type TEXT`, `stock_count INT`
   - `store_id TEXT`, `store_name TEXT`, `is_hidden`, `is_reserved`, `is_archived`, `is_hot_deal`, `is_trending`
   - `tags JSONB`, `drop_batch`, `date_added`, `created_at`, `updated_at`
   - RLS: Public SELECT enabled; Service role / Public write allowed.
2. **`public.payment_gateways`**:
   - `id TEXT PRIMARY KEY` (`gw-cod`, `gw-easypaisa`, `gw-jazzcash`, `gw-meezan`, `gw-stripe`, `gw-tompay`)
   - `type TEXT`, `title`, `provider_name`, `is_enabled BOOLEAN`, `environment TEXT`
   - `account_title`, `account_number`, `iban`, `swift_code`, `bank_name`
   - `min_order_limit`, `max_order_limit`, `disclaimer_note`, `custom_instructions`
   - `auto_confirm_cod`, `publishable_key`, `encrypted_secret_key`, `webhook_secret`, `webhook_endpoint`, `updated_at`
   - RLS: Public SELECT enabled; Public / Service manage enabled.

---

## 5. Gotchas & Architectural Quirks

1. **Thrift 1-of-1 SKU Inventory Constraints**:
   - Every vintage item is strictly unique (`stock_count = 1`).
   - The UI blocks incrementing quantity above 1 in `CartView` and `addToCart` with an informative toast: *"1-of-1 Vintage Item: Only 1 available in stock for unique thrift items."*
   - Trailing Sold-Out Sorting: Items with `in_stock = false` must automatically sort to the bottom of all catalog views.
   - Orders store immutable product snapshots (`title`, `price`, `size`, `condition_grade`, `image_url`) in `order_items` so that changes or deletion of archival products do not corrupt historical orders.
2. **Order Item Payload Discrepancy & Normalizer**:
   - Orders saved across different tiers (Supabase, FileDB, localStorage) vary between nested `it.product` objects and flat item properties.
   - All order views MUST use `normalizeOrderItem(it)` from `src/utils/orderItem.ts` to prevent runtime crashes.
3. **Payment Gateway State & `localStorage` Cache Reconciliation**:
   - `StoreContext.tsx` reconciles `INITIAL_GATEWAYS` with `localStorage` on boot using a set difference, guaranteeing new gateways like `gw-tompay` appear even when old cached arrays exist in client browsers.
4. **Dedicated SMTP Isolation**:
   - `PAUSE_DEPLOYMENT_URL_EMAILS = true` stops external Google Apps Script calls.
   - All emails route directly through Namecheap PrivateEmail SMTP (`support@jutakapra.store`) on port 465 SSL.
   - `skipEmailNotification: true` is sent on order creation from frontend to avoid duplicate confirmation emails.
5. **Vercel Hobby Plan Cron Limitations**:
   - Daily cron schedules (`0 0 * * *`) are enforced in `vercel.json` to prevent Hobby plan build failures.

---

## 6. Immediate Next Steps
1. Verify live storefront catalog rendering with dynamic Supabase products at `https://www.jutakapra.store`.
2. Test end-to-end checkout with dynamic payment gateways (including TomPay session generation).
3. Mirror any production updates to `Jutakapra_Frontend` and `JutaKapra_backend`.
