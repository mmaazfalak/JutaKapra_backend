# Juta Kapra — Backend API Server

The official backend API service for **Juta Kapra**, built with Express, TypeScript, Supabase, and Node.js.

---

## 🚀 Features
- **Authentication**: JWT, bcrypt, Supabase Auth bridge, and Google OAuth 2.0 verification.
- **Store & Order Management**: Centralized order pipeline, courier status tracking, multi-vendor store scoping.
- **Supabase Integration**: PostgreSQL synchronization, Row Level Security (RLS) policies, and service role authorization.
- **Serverless Ready**: Fully configured for instant deployment to Vercel via `@vercel/node`.

---

## 🛠️ Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
Provide your `JWT_SECRET`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.

### 3. Run Dev Server
```bash
npm run dev
```
Server runs on `http://localhost:5000`.

---

## 🗄️ Database Setup (Supabase)
1. Open your friend's Supabase dashboard at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor**.
3. Run the schema script:
   - Copy contents of `supabase_stores_schema.sql` and click **Run**.
4. Check [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for full instructions and policies.

---

## ☁️ Deployment on Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New Project"**.
2. Select the `JutaKapra_backend` GitHub repository.
3. Framework Preset: **Other** (Root Directory: `./`).
4. In **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: your secret key
   - `FRONTEND_URL`: URL of the deployed frontend
   - `SUPABASE_URL`: your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: your Supabase service role secret key
   - `SUPABASE_ANON_KEY`: your Supabase anon key
5. Click **Deploy**.
