import React, { useState, useEffect } from 'react';
import {
  Lock,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  ArrowLeft,
  MailCheck,
  Store,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { sendAdminLoginOtpEmail, PRIMARY_ADMIN_EMAIL } from '../lib/emailService';
import { safeFetchJson } from '../utils/api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const AdminLoginView: React.FC = () => {
  const { loginAdmin, loginStoreOwner, navigateTo, addToast, stores } = useStore();
  
  // Login Role Tab
  const [loginMode, setLoginMode] = useState<'super_admin' | 'store_owner'>('super_admin');
  const [step, setStep] = useState<'credentials' | '2fa_otp'>('credentials');
  
  // Super Admin Credentials
  const [email, setEmail] = useState('mmaazfalak@icloud.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Store Owner Credentials
  const [storeOwnerEmail, setStoreOwnerEmail] = useState('f7vault@jutakapra.com');
  const [storeOwnerPasscode, setStoreOwnerPasscode] = useState('store123');
  const [showStorePasscode, setShowStorePasscode] = useState(false);
  
  // Step 2: 2FA OTP
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpExpiry, setOtpExpiry] = useState<number>(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 10-minute countdown timer
  const [timeLeft, setTimeLeft] = useState(600);

  useEffect(() => {
    if (step !== '2fa_otp' || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Dispatch 2FA OTP
  const trigger2faOtp = async (targetEmail: string) => {
    setIsSendingOtp(true);
    setErrorMsg('');
    
    // Generate secure 6-digit numeric OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setOtpExpiry(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    setTimeLeft(600);

    // Send OTP strictly to Super Admin email (mmaazfalak@icloud.com)
    const success = await sendAdminLoginOtpEmail(newOtp);

    setIsSendingOtp(false);
    if (success) {
      setStep('2fa_otp');
      addToast({
        type: 'info',
        title: '2FA Passcode Dispatched',
        message: `Security passcode sent strictly to ${PRIMARY_ADMIN_EMAIL}.`,
      });
    } else {
      setErrorMsg('Failed to dispatch security passcode. Please check internet connection.');
    }
  };

  // Super Admin Credential Submission
  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedEmail || !trimmedPass) {
      setErrorMsg('Please enter both administrative email and password.');
      return;
    }

    setIsSendingOtp(true);
    let isAuthenticated = false;

    try {
      const res = await safeFetchJson<any>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: trimmedEmail, password: trimmedPass }),
      });

      if (res.ok && res.data?.success && res.data.user) {
        const userRole = res.data.user.role;
        if (userRole === 'admin' || trimmedEmail === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
          isAuthenticated = true;
        }
      }
    } catch {}

    // Fallback: Verify directly via Supabase Auth client
    if (!isAuthenticated && isSupabaseConfigured()) {
      try {
        const { data: supaAuth, error: supaErr } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPass,
        });

        if (supaAuth?.user && !supaErr) {
          isAuthenticated = true;
        }
      } catch {}
    }

    if (!isAuthenticated) {
      setIsSendingOtp(false);
      setErrorMsg('Invalid administrative credentials. Access restricted to authorized Super Admin.');
      return;
    }

    // Dispatch 2FA OTP to mmaazfalak@icloud.com
    await trigger2faOtp(trimmedEmail);
  };

  // Store Owner Login Submission
  const handleStoreOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedEmail = storeOwnerEmail.trim().toLowerCase();
    const trimmedPass = storeOwnerPasscode.trim();

    if (!trimmedEmail || !trimmedPass) {
      setErrorMsg('Please enter your store owner email and passcode.');
      return;
    }

    setIsSendingOtp(true);
    const res = await loginStoreOwner(trimmedEmail, trimmedPass);
    setIsSendingOtp(false);

    if (res.success) {
      navigateTo('admin');
    } else {
      setErrorMsg(res.error || 'Invalid store credentials. Please check with the platform administrator.');
    }
  };

  // Step 2 Submission: Verify 2FA OTP & Activate Super Admin Session
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (Date.now() > otpExpiry) {
      setErrorMsg('2FA Passcode has expired. Please request a new passcode.');
      return;
    }

    const cleanEnteredOtp = otpInput.trim();
    if (cleanEnteredOtp !== generatedOtp) {
      setErrorMsg('Invalid 2FA passcode. Please verify the code sent to your email.');
      return;
    }

    const success = await loginAdmin(password, email, true);
    if (success) {
      navigateTo('admin');
    } else {
      setErrorMsg('Authentication failed during session creation.');
    }
  };

  const handleResendOtp = async () => {
    if (isSendingOtp) return;
    await trigger2faOtp(email.trim().toLowerCase());
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md bg-white border border-[#0a0a0a]/15 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#0a0a0a] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            {loginMode === 'store_owner' ? (
              <Store className="w-5 h-5 text-blue-400" />
            ) : step === 'credentials' ? (
              <Lock className="w-5 h-5" />
            ) : (
              <KeyRound className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#0a0a0a]">
            {loginMode === 'store_owner'
              ? 'Store Owner Portal'
              : step === 'credentials'
              ? 'Juta Kapra Admin Portal'
              : 'Two-Factor Authentication'}
          </h1>
          <p className="text-xs text-[#0a0a0a]/60">
            {loginMode === 'store_owner'
              ? 'Sign in to manage products and inventory for your designated store.'
              : step === 'credentials'
              ? 'Enter primary Super Admin credentials to initiate 2FA login.'
              : `A 6-digit passcode was sent to ${PRIMARY_ADMIN_EMAIL}.`}
          </p>
        </div>

        {/* Role Switcher Tabs */}
        {step === 'credentials' && (
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#fafafa] border border-[#0a0a0a]/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setLoginMode('super_admin');
                setErrorMsg('');
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                loginMode === 'super_admin'
                  ? 'bg-[#0a0a0a] text-white shadow-sm'
                  : 'text-[#0a0a0a]/60 hover:text-[#0a0a0a]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Super Admin</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode('store_owner');
                setErrorMsg('');
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                loginMode === 'store_owner'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#0a0a0a]/60 hover:text-[#0a0a0a]'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Store Owner</span>
            </button>
          </div>
        )}

        {/* Form 1: Super Admin Credentials */}
        {loginMode === 'super_admin' && step === 'credentials' && (
          <form onSubmit={handleCredentialSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0a0a0a] mb-1.5">
                Super Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mmaazfalak@icloud.com"
                className="w-full bg-[#fafafa] border border-[#0a0a0a]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#0a0a0a] focus:bg-white focus:outline-none focus:border-[#0a0a0a]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#0a0a0a]">
                  Admin Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter administrative password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#fafafa] border border-[#0a0a0a]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#0a0a0a] focus:bg-white focus:outline-none focus:border-[#0a0a0a] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#0a0a0a]/40 hover:text-[#0a0a0a] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#e5341f] font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSendingOtp}
              className="w-full h-12 bg-[#0a0a0a] hover:bg-[#e5341f] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-md active:scale-95"
            >
              {isSendingOtp ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Dispatching 2FA Code...</span>
                </>
              ) : (
                <>
                  <span>Verify Credentials &amp; Request 2FA</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Form 2: Store Owner Direct Login */}
        {loginMode === 'store_owner' && (
          <form onSubmit={handleStoreOwnerSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0a0a0a] mb-1.5">
                Store Owner Email or Phone
              </label>
              <input
                type="text"
                required
                value={storeOwnerEmail}
                onChange={(e) => setStoreOwnerEmail(e.target.value)}
                placeholder="e.g. f7vault@jutakapra.com"
                className="w-full bg-[#fafafa] border border-[#0a0a0a]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#0a0a0a] focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0a0a0a] mb-1.5">
                Store Passcode
              </label>
              <div className="relative">
                <input
                  type={showStorePasscode ? 'text' : 'password'}
                  required
                  placeholder="Enter store passcode"
                  value={storeOwnerPasscode}
                  onChange={(e) => setStoreOwnerPasscode(e.target.value)}
                  className="w-full bg-[#fafafa] border border-[#0a0a0a]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#0a0a0a] focus:bg-white focus:outline-none focus:border-blue-600 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowStorePasscode(!showStorePasscode)}
                  className="absolute right-3 top-2.5 text-[#0a0a0a]/40 hover:text-[#0a0a0a] cursor-pointer"
                >
                  {showStorePasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#e5341f] font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSendingOtp}
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-md shadow-blue-600/25 active:scale-95"
            >
              {isSendingOtp ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Store Account...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Store Owner</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Form 3: Super Admin 2FA OTP Verification */}
        {loginMode === 'super_admin' && step === '2fa_otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start space-x-2.5">
              <MailCheck className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
              <div>
                <p className="font-bold">Security 2FA Passcode Sent</p>
                <p className="text-[11px] text-blue-800/80 mt-0.5">
                  Check your inbox for <strong>{PRIMARY_ADMIN_EMAIL}</strong>. Valid for {formatTimer(timeLeft)}.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0a0a0a] mb-1.5 text-center">
                Enter 6-Digit 2FA Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full bg-[#fafafa] border border-[#0a0a0a]/20 rounded-xl px-4 py-3 text-center text-2xl font-mono font-black tracking-[8px] text-[#0a0a0a] focus:bg-white focus:outline-none focus:border-[#0a0a0a]"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#e5341f] font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={otpInput.length !== 6}
              className="w-full h-12 bg-[#0a0a0a] hover:bg-[#e5341f] disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-md active:scale-95"
            >
              <span>Authenticate Session &amp; Enter Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between pt-2 text-xs border-t border-[#0a0a0a]/10">
              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setErrorMsg('');
                }}
                className="text-[#0a0a0a]/60 hover:text-[#0a0a0a] flex items-center space-x-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isSendingOtp || timeLeft > 540}
                className="text-blue-600 hover:text-blue-700 font-bold disabled:text-slate-400 cursor-pointer"
              >
                {isSendingOtp ? 'Sending...' : 'Resend 2FA Passcode'}
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center justify-center space-x-2 text-[11px] text-[#0a0a0a]/50 pt-2 border-t border-[#0a0a0a]/10">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Encrypted Multi-Store Admin Portal</span>
        </div>
      </div>
    </div>
  );
};
