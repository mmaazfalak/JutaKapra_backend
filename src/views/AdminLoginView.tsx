import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
  Store,
  Sparkles,
  CheckCircle2,
  Mail,
  KeyRound,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PRIMARY_ADMIN_EMAIL } from '../lib/emailService';
import { safeFetchJson } from '../utils/api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { GOOGLE_CLIENT_ID, loadGoogleGsiScript } from '../lib/googleAuth';

export const AdminLoginView: React.FC = () => {
  const {
    loginAdmin,
    loginStoreOwner,
    navigateTo,
    addToast,
    stores,
    setActiveAdminModule,
    setCurrentStoreId,
    setIsAdminLoggedIn,
    setAdminRole,
  } = useStore();

  // Single unified credentials form
  const [email, setEmail] = useState('mmaazfalak@icloud.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const googleContainerRef = useRef<HTMLDivElement>(null);

  // Initialize Google Sign-In for 1-click Master Admin authentication
  useEffect(() => {
    let active = true;
    const setupGoogle = async () => {
      await loadGoogleGsiScript();
      if (!active || !googleContainerRef.current || !window.google?.accounts?.id) return;
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (res: { credential: string }) => {
            if (res.credential) {
              setIsLoading(true);
              try {
                // Decode payload
                const base64Url = res.credential.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                  atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
                );
                const payload = JSON.parse(jsonPayload);
                const googleEmail = (payload.email || '').toLowerCase().trim();

                // Master Admin check
                if (
                  googleEmail === 'mmaazfalak@icloud.com' ||
                  googleEmail === 'mmaazhrnfalak@gmail.com' ||
                  googleEmail === PRIMARY_ADMIN_EMAIL.toLowerCase()
                ) {
                  setIsAdminLoggedIn(true);
                  setAdminRole('super_admin');
                  setCurrentStoreId(null);
                  setActiveAdminModule('stores');
                  try {
                    localStorage.setItem('forge_admin_auth_v1', 'true');
                    localStorage.setItem('forge_admin_role_v1', 'super_admin');
                    localStorage.removeItem('forge_current_store_v1');
                  } catch {}
                  addToast({
                    type: 'success',
                    title: 'Master Admin Authenticated',
                    message: 'Welcome back, Master Admin. Store Management loaded.',
                  });
                  navigateTo('admin');
                } else {
                  setErrorMsg(`Signed in as ${googleEmail}, but this account is not registered as Master Admin.`);
                }
              } catch (err: any) {
                setErrorMsg('Google authentication failed. Please try password login.');
              } finally {
                setIsLoading(false);
              }
            }
          },
        });

        googleContainerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleContainerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: '260',
        });
      } catch (err: any) {
        console.warn('Google GSI render error in Admin login:', err);
      }
    };

    setupGoogle();
    return () => {
      active = false;
    };
  }, [setIsAdminLoggedIn, setAdminRole, setCurrentStoreId, setActiveAdminModule, addToast, navigateTo]);

  // Unified Submission Handler: Automatically routes Master Admin or Store Owner
  const handleUnifiedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanIdentifier = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanIdentifier || !cleanPass) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    setIsLoading(true);

    // 1. Check if user is Master Admin (mmaazfalak@icloud.com or primary admin email)
    const isMasterAdminEmail =
      cleanIdentifier === 'mmaazfalak@icloud.com' ||
      cleanIdentifier === 'admin@jutakapra.com' ||
      cleanIdentifier === PRIMARY_ADMIN_EMAIL.toLowerCase();

    if (isMasterAdminEmail) {
      let isAuthSuccess = false;

      // Master password bypass or standard fallback check
      if (cleanPass === 'admin123' || cleanPass === 'admin2026' || cleanPass === 'store123') {
        isAuthSuccess = true;
      }

      // Backend API verify
      if (!isAuthSuccess) {
        try {
          const res = await safeFetchJson<any>('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email: cleanIdentifier, password: cleanPass }),
          });
          if (res.ok && res.data?.success) {
            isAuthSuccess = true;
          }
        } catch {}
      }

      // Supabase direct authentication
      if (!isAuthSuccess && isSupabaseConfigured()) {
        try {
          const { data: supaAuth, error: supaErr } = await supabase.auth.signInWithPassword({
            email: cleanIdentifier,
            password: cleanPass,
          });
          if (supaAuth?.user && !supaErr) {
            isAuthSuccess = true;
          }
        } catch {}
      }

      if (isAuthSuccess) {
        setIsLoading(false);
        setIsAdminLoggedIn(true);
        setAdminRole('super_admin');
        setCurrentStoreId(null);
        setActiveAdminModule('stores'); // Open Store Management directly as requested

        try {
          localStorage.setItem('forge_admin_auth_v1', 'true');
          localStorage.setItem('forge_admin_role_v1', 'super_admin');
          localStorage.removeItem('forge_current_store_v1');
        } catch {}

        addToast({
          type: 'success',
          title: 'Master Admin Access Granted',
          message: 'Welcome back, Master Admin. Store Management & Control Center ready.',
        });

        navigateTo('admin');
        return;
      }
    }

    // 2. Check if user belongs to a Store Account in stores list
    const matchedStore = stores.find(
      (s) =>
        s.ownerEmail.toLowerCase() === cleanIdentifier ||
        (s.ownerPhone && s.ownerPhone.replace(/\s+/g, '') === cleanIdentifier.replace(/\s+/g, '')) ||
        s.id.toLowerCase() === cleanIdentifier ||
        s.slug.toLowerCase() === cleanIdentifier
    );

    if (matchedStore) {
      const storeRes = await loginStoreOwner(cleanIdentifier, cleanPass);
      setIsLoading(false);

      if (storeRes.success) {
        setActiveAdminModule('products');
        navigateTo('admin');
        return;
      } else {
        setErrorMsg(storeRes.error || 'Incorrect passcode for this store account.');
        return;
      }
    }

    // 3. Fallback: Generic Admin or Staff login
    try {
      const res = await safeFetchJson<any>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: cleanIdentifier, password: cleanPass }),
      });

      if (res.ok && res.data?.success && res.data.user) {
        setIsLoading(false);
        const role = res.data.user.role === 'admin' ? 'super_admin' : 'store_owner';
        setIsAdminLoggedIn(true);
        setAdminRole(role);
        setActiveAdminModule(role === 'super_admin' ? 'stores' : 'products');
        navigateTo('admin');
        return;
      }
    } catch {}

    setIsLoading(false);
    setErrorMsg('Invalid email or password. Master Admin or registered store account required.');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md bg-white border border-[#0a0a0a]/15 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#0a0a0a] text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-black/10">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#0a0a0a]">
            Juta Kapra Operations Portal
          </h1>
          <p className="text-xs text-[#0a0a0a]/60 leading-relaxed">
            Master Administration &amp; Multi-Store Management System
          </p>
        </div>

        {/* Google 1-Click Fast Sign-In */}
        <div className="flex flex-col items-center justify-center space-y-2 pt-1">
          <div ref={googleContainerRef} className="min-h-[44px] flex items-center justify-center" />
          <div className="flex items-center w-full gap-3 pt-2">
            <div className="flex-1 h-px bg-[#0a0a0a]/10" />
            <span className="text-[10px] font-bold text-[#0a0a0a]/40 uppercase tracking-wider">
              or sign in with password
            </span>
            <div className="flex-1 h-px bg-[#0a0a0a]/10" />
          </div>
        </div>

        {/* Single Unified Credentials Form */}
        <form onSubmit={handleUnifiedSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0a0a0a] mb-1.5">
              Account Email or Store ID
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mmaazfalak@icloud.com or your store email"
                className="w-full bg-[#fafafa] border border-[#0a0a0a]/15 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-[#0a0a0a] focus:bg-white focus:outline-none focus:border-[#0a0a0a] transition-all"
              />
              <div className="absolute right-3 top-2.5 text-[#0a0a0a]/40">
                <Mail className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[10px] text-[#0a0a0a]/50 mt-1">
              Master Admin: <strong className="text-[#0a0a0a]">mmaazfalak@icloud.com</strong>
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#0a0a0a]">
                Password / Store Passcode
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter password or passcode"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#fafafa] border border-[#0a0a0a]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#0a0a0a] focus:bg-white focus:outline-none focus:border-[#0a0a0a] pr-10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#0a0a0a]/40 hover:text-[#0a0a0a] cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-[#e5341f] font-medium leading-relaxed">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-[#0a0a0a] hover:bg-[#1a1a1a] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-black/10 active:scale-95"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Authenticating Session...</span>
              </>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security / Master Note */}
        <div className="pt-2 border-t border-[#0a0a0a]/10 space-y-2">
          <div className="flex items-center justify-center space-x-2 text-[11px] text-[#0a0a0a]/60">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Master Admin has unrestricted access across all stores and services</span>
          </div>
          <p className="text-[10px] text-center text-[#0a0a0a]/40">
            Store owners manage products and fulfillment for their assigned store.
          </p>
        </div>
      </div>
    </div>
  );
};
