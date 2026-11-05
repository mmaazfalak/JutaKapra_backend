# Changelog

All notable changes to the Juta Kapra e-commerce storefront and backend API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.1] - 2026-11-06

### Changed
- **Dedicated SMTP Sender (`support@jutakapra.store`)**: Standardized all transactional and marketing notification emails (Order Placed, Order Confirmed, Order Dispatched with Delivery Date, Password Reset OTP, 10-Hour Cart Recovery) to send directly via authenticated Namecheap Private Email SMTP from `"Juta Kapra" <support@jutakapra.store>` with `replyTo: support@jutakapra.store`.
- **Frontend Direct Backend Relay**: Configured `sendNotificationEmail` in `src/lib/emailService.ts` to dispatch email payloads to `/api/auth/send-email` and `/api/email/send`, guaranteeing zero reliance on external script urls.

### Deprecated / Paused
- **Paused Deployment URL Email Function**: Explicitly paused `GAS_DEPLOYMENT_URL` and `GOOGLE_SHEETS_WEBHOOK_URL` email dispatching across both frontend and backend (`PAUSE_DEPLOYMENT_URL_EMAILS = true`), preventing external Google Apps Script execution for emails.

---

## [1.3.0] - 2026-11-05

### Added
- **Google Apps Script Backend Overhaul (`gas/Code.gs`)**: Standardized `doPost(e)` action handler supporting `send_order_placed`, `send_order_confirmed`, `send_order_dispatched`, `send_cart_abandoned`, and Google Sheets data synchronization with `CacheService` 120-second deduplication lock.
- **Admin Estimated Delivery Date Dispatch**: Added inline date picker input on confirmed orders in `AdminOrdersView.tsx` and date selector in `OrderFulfillmentModal.tsx` passing estimated delivery date directly into the dispatch email.
- **10-Hour Abandoned Cart Recovery**: Background scanner in `cartController.ts` and automated 30-minute interval worker in Node server + Vercel hourly cron triggering urgency reminder emails without promo or discount codes.
- **Empty Deployment URL Fallback**: Safe fallback logic in frontend and backend `emailService.ts` when `GAS_DEPLOYMENT_URL` is empty, logging clean warnings instead of throwing runtime exceptions.

### Changed
- **Checkout Double-Submission Lock**: Wrapped `handleSubmitOrder` in `CheckoutView.tsx` with a synchronous lock (`submissionLockRef`) to eliminate rapid double clicks and concurrent submissions.
- **Single Email Dispatch Pipeline**: Frontend `createOrder` passes `skipEmailNotification: true` to `/api/orders` to prevent backend duplicate email triggers.

---

## [1.2.2] - 2026-11-05

### Added
- **Dedicated Shopping Bag Page View (`/cart`)**: Integrated the shopping bag directly as a full, dedicated view (`CartView`) keeping top navigation `<Header />` and bottom mobile dock `<MobileAppNavBar />` persistently visible and functional.
- **Active Shopping Bag Indicator**: Added active state and red glow layout indicator in `<MobileAppNavBar />` when browsing the cart page.
- **Dual Authentication Capability**: Ensured Google OAuth accounts with a set password can log in either with Google One-Tap or email and password.

### Changed
- **Mobile & Floating Cart Navigation**: Updated `<MobileAppNavBar />` and `<FloatingCartButton />` triggers from opening a side drawer to calling `navigateTo('cart')`.
- **Floating Cart Button Visibility**: Automatically hides the floating cart trigger when already on the `/cart` page to avoid redundancy.
- **Account Password Management**: Form header dynamically toggles between "Set Account Password" (for accounts without a password) and "Update Password" (for accounts with an established password).

### Deprecated
- **Slide-out Cart Drawer (`CartDrawer`)**: Removed the overlay drawer that translated from the right and covered the screen with a dark backdrop.

### Fixed
- **Google User Password Setup Loop**: Fixed MongoDB `upsertGoogleUser` in `server/db.ts` to return `passwordHash` and `password`, preventing Google logins from resetting the `hasPassword` flag to false.
- **Google Account Current Password Suppression**: Removed `authProvider !== 'google'` check in `AccountView.tsx` so users who have set a password are required to verify their current password when updating.
- **Backend Password Verification**: In `authController.ts`, enforced mandatory `currentPassword` verification with bcrypt when updating an existing password.

### Security
- Prohibited unauthenticated password resets via `changePassword` endpoint without providing and validating the existing bcrypt password hash.

---

## [1.2.1] - 2026-11-05

### Added
- **Master Transparent Monogram Assets**: Recreated the iconic "J" & "K" apparel-silhouette monogram with full alpha transparency. Deployed `/logo.png` (dark monogram for light backgrounds) and `/logo-white.png` (white monogram for dark backgrounds), `/favicon.png`, `/logo-512.png`, and `/logo-192.png`.

### Changed
- **Header & Footer Brand Rendering**: Replaced white screenshot boxed images in `Header.tsx` and `Footer.tsx` with clean, responsive transparent SVG/PNG assets.

### Fixed
- **Form Placeholders**: Removed dummy test sample text (`e.g. Zainab Malik`, `you@example.com`, `+92 300 1234567`) from `RegisterView.tsx` and `LoginView.tsx`.

---

## [1.2.0] - 2026-11-04

### Added
- **Supabase PostgreSQL Relational Schema**: Integrated `supabase_master_schema.sql` supporting `profiles`, `orders`, `order_items`, `stores`, and `products`.
- **Automated Webhook Integration**: Connected Google Apps Script webhook for non-blocking OTP email dispatches and Google Sheets sales synchronization.
- **Dark Mode Support**: Persistent dark/light mood toggle with system preference fallback.

### Fixed
- Fixed product catalog filtering by category and subcategory on the Explore view.
- Corrected image aspect ratio distortion on product card thumbnails.

---

## [1.1.0] - 2026-10-08

### Added
- Multi-store discovery support and database schema for independent shop partitions.
- Full-text search with instant category filters in desktop header and mobile search overlay.
- Shipping address management allowing default address selection and local persistence.

---

## [1.0.0] - 2026-09-19

### Added
- Initial public release of Juta Kapra Archival Vault e-commerce store.
- Interactive catalog of curated vintage apparel, footwear, and accessories.
- Cash on Delivery (COD) checkout pipeline with WhatsApp and email confirmation.
- Responsive design tailored for mobile shopping experiences.
