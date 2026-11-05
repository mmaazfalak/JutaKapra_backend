# Progress Tracker & Task Status

**Project**: Juta Kapra E-Commerce Platform  
**Last Updated**: November 6, 2026, 02:00 PKT  
**Branch**: `main`  
**Production URLs**:
- Front-End: [https://www.jutakapra.store](https://www.jutakapra.store)
- Back-End: [https://jutakaprabackend.vercel.app](https://jutakaprabackend.vercel.app)

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
| **TomPay Payment Gateway Integration** | 1 | 0 | 1 | 0 |
| **Total** | **7** | **6 (86%)** | **1 (14%)** | **0** |

---

## 2. Completed Milestones

### Milestone 1: Recreate Monogram Logo with Transparent Background
- **Status**: Completed & Verified Live
- **Commit**: `b8d1b0d`
- **Actions**:
  - Downloaded high-resolution source image containing "J" & "K" filled apparel silhouette artwork.
  - Processed image with Python Pillow: eliminated the rectangular white screenshot box, executed flood-fill with anti-aliasing, and defringed edges to guarantee transparent PNG output.
  - Deployed assets:
    - `/logo.png` (Transparent black/charcoal monogram for light background)
    - `/logo-white.png` (Transparent white/cream monogram for dark background)
    - `/favicon.png`, `/logo-512.png`, `/logo-192.png`
  - Integrated into [`Header.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra_Frontend/src/components/Header.tsx), [`Footer.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra_Frontend/src/components/Footer.tsx), and [`index.html`](file:///Users/mmaazfalak/antigravity/Jutakapra_Frontend/index.html).
  - Verified live via HTTP 200 checks on `https://www.jutakapra.store/logo.png`.

---

### Milestone 2: Registration & Login Form Placeholder Polish
- **Status**: Completed & Verified Live
- **Commit**: `d63c2d4`
- **Actions**:
  - Removed dummy test placeholder strings (`e.g. Zainab Malik`, `you@example.com`, `+92 300 1234567`, `Minimum 8 characters`, `Re-enter your password`) from [`RegisterView.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra_Frontend/src/views/RegisterView.tsx) and [`LoginView.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra_Frontend/src/views/LoginView.tsx).
  - Ensured all input fields retain clean labels and placeholders without dummy sample text.
  - Built and verified production bundle.

---

### Milestone 3: Dedicated Shopping Bag Page (`CartView`) Transition
- **Goal**: Bag must operate as a dedicated page view without sliding over and obscuring header and navigation tabs.
- **Status**: 100% Completed & Deployed
- **Commit**: `5141fe7`
- **Subtask Checklist**:
  - [x] **Audit existing components**: `CartView.tsx` already exists as a full-page view wired to `case 'cart': return <CartView />` in `App.tsx`.
  - [x] **Update Mobile Navigation Bar** ([`MobileAppNavBar.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra_Frontend/src/components/MobileAppNavBar.tsx)):
    - Replaced `onClick={() => setIsCartOpen(true)}` with `onClick={() => navigateTo('cart')}`.
    - Added `isCartActive` layout indicator with red accent styling.
  - [x] **Update Floating Cart Button** ([`FloatingCartButton.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra_Frontend/src/components/FloatingCartButton.tsx)):
    - Replaced `onClick` with `navigateTo('cart')`.
    - Added hide rule when `currentView === 'cart'` to avoid redundancy.
  - [x] **Disable Slide Overlay** ([`App.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra_Frontend/src/App.tsx)):
    - Removed `<CartDrawer />` from active render tree so full-screen sliding backdrop is omitted.
  - [x] **Desktop Header Bag Trigger** ([`Header.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra_Frontend/src/components/Header.tsx)):
    - Added dedicated Bag button with live item counter badge.

---

### Milestone 4: Google Auth & Password Lifecycle Hardening
- **Goal**: Prevent repeat password setup loops for Google users; enforce current password verification when updating.
- **Status**: 100% Completed & Deployed
- **Commit**: `041793a`
- **Subtask Checklist**:
  - [x] **Backend Controller Fix** ([`server/controllers/authController.ts`](file:///Users/mmaazfalak/antigravity/JutaKapra_backend/server/controllers/authController.ts)):
    - Made `currentPassword` mandatory when `user.passwordHash` exists.
    - Added bcrypt comparison preventing unauthenticated password overwrites.
  - [x] **Database User Record Mapping Fix** ([`server/db.ts`](file:///Users/mmaazfalak/antigravity/JutaKapra_backend/server/db.ts)):
    - Updated `upsertGoogleUser` to include `passwordHash` and `password` on returned `userRecord`.
    - Prevents Google logins from clearing or ignoring established passwords.
  - [x] **Frontend Password Form Refinement** ([`AccountView.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra_Frontend/src/views/AccountView.tsx)):
    - Removed `authProvider !== 'google'` check that previously suppressed Current Password input for Google users.
    - Dynamically switch header between "Set Account Password" and "Update Password".
    - Immediate reactive switch to "Update Password" once password is saved without requiring reload.
  - [x] **Deploy Backend & Frontend**: Pushed to GitHub and deployed to Vercel production.

---

### Milestone 5: Complete Email Lifecycle, Backend & Admin Panel Overhaul
- **Goal**: Production-ready email dispatcher in Google Apps Script, duplicate email suppression, empty deployment URL safety, admin delivery date dispatch, and 10-hour abandoned cart recovery.
- **Status**: 100% Completed & Deployed
- **Commits**: `fa2018a` (Frontend), `c779157` (Backend)
- **Subtask Checklist**:
  - [x] **Google Apps Script Backend** ([`gas/Code.gs`](file:///Users/mmaazfalak/antigravity/gas/Code.gs)):
    - Created modular `doPost(e)` and `doGet(e)` dispatcher with `LockService` and `CacheService` 120s deduplication lock.
    - Implemented `send_order_placed` (strictly one confirmation per order), `send_order_confirmed` (admin approval notice), `send_order_dispatched` (including admin's `estimatedDeliveryDate`), `send_cart_abandoned` (10-hour urgency without coupon/discount codes), and Google Sheets logging.
  - [x] **Frontend Configuration & Endpoint Reset** ([`src/lib/emailService.ts`](file:///Users/mmaazfalak/antigravity/Jutakapra_Frontend/src/lib/emailService.ts)):
    - Reset `GAS_DEPLOYMENT_URL = ""` as an empty placeholder ready for new deployment.
    - Added non-blocking safety check: when URL is empty, logs clean warning and skips network execution without crashing.
  - [x] **Checkout Duplicate Prevention** ([`CheckoutView.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra_Frontend/src/views/CheckoutView.tsx), [`StoreContext.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra_Frontend/src/context/StoreContext.tsx)):
    - Added synchronous `submissionLockRef` debounce preventing dual button taps and rapid submissions.
    - Added `sentOrderEmailIds` set deduplication on client side.
    - Passed `skipEmailNotification: true` to backend `/api/orders` to eliminate double confirmation emails.
  - [x] **Admin Panel Enhancements** ([`AdminOrdersView.tsx`](file:///Users/mmaazfalak/antigravity/JutaKapra_backend/src/components/admin/AdminOrdersView.tsx), [`OrderFulfillmentModal.tsx`](file:///Users/mmaazfalak/antigravity/JutaKapra_backend/src/components/OrderFulfillmentModal.tsx)):
    - Added "Confirm Order" button on pending orders triggering confirmation email.
    - Added inline date picker input on confirmed orders for `estimatedDeliveryDate`.
    - Added "Dispatch Order" action passing the date to courier dispatch API and customer email.
  - [x] **10-Hour Cart Abandonment Logic** ([`server/controllers/cartController.ts`](file:///Users/mmaazfalak/antigravity/JutaKapra_backend/server/controllers/cartController.ts), [`server/server.ts`](file:///Users/mmaazfalak/antigravity/JutaKapra_backend/server/server.ts)):
    - Configured strict 10-hour threshold (`TEN_HOURS_MS = 10 * 60 * 60 * 1000`) and subject *"Get your order delivered before someone else grabs it! | Juta Kapra"*.
    - Added background 30-minute interval in Node server.
    - Maintained strict prohibition against promo/discount codes.
  - [x] **Deploy & Verify**: Both frontend and backend built with 0 errors and deployed to production.

---

### Milestone 6: Dedicated SMTP Sender (`support@jutakapra.store`) & Pause GAS Deployment URL
- **Goal**: Send all emails from `support@jutakapra.store` using authenticated SMTP; strictly pause the deployment URL email function.
- **Status**: 100% Completed & Deployed
- **Commits**: `764d21b` (Frontend), `0be29b7` (Backend)
- **Subtask Checklist**:
  - [x] **Verified PrivateEmail SMTP Credentials**: Verified `mail.privateemail.com` on port 465 SSL using `support@jutakapra.store`, generating Message IDs `@jutakapra.store`.
  - [x] **Set Direct SMTP Headers**: Configured `from: '"Juta Kapra" <support@jutakapra.store>'` and `replyTo: 'support@jutakapra.store'` across all backend mailers.
  - [x] **Strictly Paused Deployment URL Sending**: Added `PAUSE_DEPLOYMENT_URL_EMAILS = true` in frontend and backend `emailService.ts`, `sheetsService.ts`, and `webhookService.ts`, preventing any email delivery attempts through Google Apps Script deployment URL.
  - [x] **Frontend Direct Backend Relay**: Updated `sendNotificationEmail` in [`src/lib/emailService.ts`](file:///Users/mmaazfalak/antigravity/Jutakapra_Frontend/src/lib/emailService.ts) to dispatch payloads directly to `/api/auth/send-email` and `/api/email/send`.
  - [x] **Admin Order Confirmed Email**: Added `sendOrderConfirmedEmail` to backend `emailService.ts` and `orderController.ts` triggering notification from `support@jutakapra.store` when orders are confirmed.
  - [x] **Vercel Hobby Plan Fix**: Removed `crons` from `vercel.json` (commit `379ae04`) to eliminate Hobby plan build errors.
  - [x] **Deploy & Verify**: Both frontend and backend built with 0 errors and deployed to production.

---

## 3. Tasks Currently in Progress

### Milestone 7: TomPay Payment Gateway Integration
- **Goal**: Integrate live TomPay debit/credit card and digital wallet gateway with secure checkout session generation, webhook confirmation, and transactional email triggers.
- **Status**: **IN PROGRESS** (Architecture & Plan Specification Complete, Pending Implementation)
- **Security**: Credentials isolated strictly in server `.env`; secret keys redacted in documentation.
- **Subtask Checklist**:
  - [x] **Credential Collection & Verification**: Live API Key and Secret securely received and added to local server `.env`.
  - [x] **Technical Specification**: Documented full sequence diagram, data flow, and endpoint requirements in [`plan.md`](file:///Users/mmaazfalak/antigravity/Jutakapra/plan.md).
  - [x] **Secure Environment Setup**: Added `TOMPAY_API_KEY` and `TOMPAY_API_SECRET` to server `.env`.
  - [ ] **Backend Service & Controller**:
    - Implement `POST /api/payments/tompay/create-checkout` to initialize sessions.
    - Implement `POST /api/payments/tompay/webhook` to handle payment authorizations.
    - Implement `GET /api/payments/tompay/verify/:orderId` for redirect status check.
  - [ ] **Storefront Checkout Flow**:
    - Add `gw-tompay` to [`INITIAL_GATEWAYS`](file:///Users/mmaazfalak/antigravity/Jutakapra_Frontend/src/context/StoreContext.tsx#L262).
    - Wire checkout redirect and return handling in [`CheckoutView.tsx`](file:///Users/mmaazfalak/antigravity/Jutakapra_Frontend/src/views/CheckoutView.tsx).
  - [ ] **Admin Dashboard Controls**: Add TomPay enable/disable switch and transaction reference inspector in [`AdminDashboardView.tsx`](file:///Users/mmaazfalak/antigravity/JutaKapra_backend/src/views/AdminDashboardView.tsx).

---

## 4. Next Steps
1. Implement the backend TomPay service and checkout routes.
2. Register TomPay in the frontend checkout view.
3. Test payment initialization and webhook callback.
