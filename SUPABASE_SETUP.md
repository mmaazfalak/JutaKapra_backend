# 🏛️ JUTA.KAPRA - Supabase Auth & Account System Setup

This guide provides step-by-step instructions to connect Supabase Authentication (Email + Google OAuth) and database user profiles to your Juta.Kapra storefront and Admin Portal.

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New Project**, enter a project name (e.g. `jutakapra-store`), set a database password, and choose your preferred region.
3. Once the project is created, navigate to **Project Settings** > **API**.
4. Copy:
   - **Project URL** (`https://xyzcompany.supabase.co`)
   - **Project API Anon Key** (`anon` `public` key)

---

## 2. Configure Environment Variables

Create a `.env` file in the root directory of your project (or copy `.env.example`):

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key_here
VITE_SITE_URL=http://localhost:3000
```

---

## 3. Run Database Migrations (SQL Schema)

1. In your Supabase Dashboard, go to **SQL Editor** in the left sidebar.
2. Click **New Query**.
3. Copy and paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql).
4. Click **Run** (or `Cmd + Enter`).

This script:
- Creates the `public.profiles` table linked to Supabase Auth `auth.users`.
- Enables **Row Level Security (RLS)** with strict policies:
  - Customers can read and update only their own profile.
  - Admins can query, filter, and manage all users.
- Adds an automated trigger `on_auth_user_created` that mirrors new email and Google OAuth signups directly into `public.profiles`.
- Sets up an `is_admin()` helper function.

---

## 4. Configure Google OAuth in Supabase

To enable **"Continue with Google"** with real Google accounts:

### Step A: Create OAuth Credentials in Google Cloud Console
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project or select an existing one.
3. Go to **APIs & Services** > **OAuth consent screen**:
   - Choose **External**.
   - Fill in App Name (`JUTA KAPRA`), User support email, and Developer contact.
   - Save and continue.
4. Go to **Credentials** > **Create Credentials** > **OAuth client ID**:
   - Application type: **Web application**.
   - Name: `Juta Kapra Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `https://your-domain.com` (if deployed)
     - `https://<your-project-ref>.supabase.co`
   - **Authorized redirect URIs**:
     - `https://<your-project-ref>.supabase.co/auth/v1/callback`
5. Copy your **Client ID** and **Client Secret**.

### Step B: Enable Google Provider in Supabase
1. In the Supabase Dashboard, go to **Authentication** > **Providers** > **Google**.
2. Toggle **Google Enabled** to **ON**.
3. Paste the **Client ID** and **Client Secret** from Google Cloud Console.
4. Click **Save**.

### Step C: Set URL Configuration
1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**:
   - **Site URL**: `http://localhost:3000` (or production URL)
   - **Redirect URLs**: Add `http://localhost:3000/**`

---

## 5. Make a User an Admin

To grant a user access to the **Admin Portal**:

1. In Supabase Dashboard, go to **Table Editor** > **profiles**.
2. Locate the user's row.
3. Change their `role` column from `'customer'` to `'admin'`.
4. Or run this query in **SQL Editor**:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'your-email@gmail.com';
   ```

---

## 6. Verification & Features

- **Email Signup**: Full name, email, password, confirm password validation.
- **Google OAuth**: 1-click Google account authorization.
- **Admin Portal**: Accessible by admins at `/admin` (or through the Admin Portal button in header/nav), featuring search, filters, user counts, role management, and status toggles.
- **Offline / Local Fallback**: If Supabase environment variables are not yet configured, the app automatically switches to safe simulated demo mode so the UI never breaks.
