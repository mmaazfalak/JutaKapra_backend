import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { GOOGLE_CLIENT_ID, loadGoogleGsiScript } from '../lib/googleAuth';

export const RegisterView: React.FC = () => {
  const { navigateTo, registerCustomer, loginWithGoogleCredential, currentCustomer, otpResetEmail } = useStore();

  const [formData, setFormData] = useState({
    fullName: '',
    email: otpResetEmail || '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const googleContainerRef = useRef<HTMLDivElement>(null);

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
              const authRes = await loginWithGoogleCredential(res.credential);
              setIsLoading(false);
              if (authRes.success) {
                navigateTo('account');
              } else {
                setError(authRes.error || 'Google authentication failed.');
              }
            }
          },
        });
        googleContainerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleContainerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signup_with',
          shape: 'pill',
          width: '240',
        });
      } catch (err: any) {
        console.warn('Google GSI render error:', err);
      }
    };
    setupGoogle();
    return () => {
      active = false;
    };
  }, [loginWithGoogleCredential, navigateTo]);

  React.useEffect(() => {
    if (otpResetEmail && !formData.email) {
      setFormData((prev) => ({ ...prev, email: otpResetEmail }));
    }
  }, [otpResetEmail]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // If already logged in, redirect to account
  if (currentCustomer) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#0a0a0a]">Already Signed In</h2>
        <p className="text-xs text-neutral-500">
          You are currently signed in as <strong>{currentCustomer.email}</strong>.
        </p>
        <button
          onClick={() => navigateTo('account')}
          className="px-6 py-2.5 bg-[#0a0a0a] text-white text-xs font-bold rounded-xl hover:bg-[#e5341f] transition-colors cursor-pointer"
        >
          Go to My Account
        </button>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerCustomer({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (result.success) {
        setSuccess('Account created successfully! Welcome to Juta Kapra.');
        setTimeout(() => {
          navigateTo('account');
        }, 1200);
      } else {
        setError(result.message || 'Failed to create account. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans bg-[#fafafa]">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full mx-auto space-y-6"
      >
        {/* Back Link */}
        <button
          onClick={() => navigateTo('home')}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-neutral-500 hover:text-[#0a0a0a] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Store</span>
        </button>

        {/* Card */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-xl text-[#0a0a0a]">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">
              Create Account
            </h1>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* 1-Click Google Sign Up */}
          <div className="space-y-4 mb-5">
            <div className="w-full max-w-[250px] mx-auto flex justify-center overflow-hidden">
              <div
                ref={googleContainerRef}
                id="g_id_signin_registerview"
                className="w-full flex justify-center min-h-[44px] max-w-full overflow-hidden"
              />
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-neutral-200"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold tracking-wider uppercase text-neutral-400">
                Or register with email & password
              </span>
              <div className="flex-grow border-t border-neutral-200"></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="register-fullname"
                className="block text-xs font-semibold text-neutral-800 mb-1"
              >
                Full Name <span className="text-[#e5341f]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="register-fullname"
                  name="fullName"
                  type="text"
                  required
                  placeholder="e.g. Zainab Malik"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2.5 bg-neutral-50/50 border border-neutral-200 hover:border-neutral-300 focus:border-[#0a0a0a] rounded-xl text-xs text-[#0a0a0a] placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-neutral-100 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="register-email"
                className="block text-xs font-semibold text-neutral-800 mb-1"
              >
                Email Address <span className="text-[#e5341f]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2.5 bg-neutral-50/50 border border-neutral-200 hover:border-neutral-300 focus:border-[#0a0a0a] rounded-xl text-xs text-[#0a0a0a] placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-neutral-100 transition-all"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="register-phone"
                className="block text-xs font-semibold text-neutral-800 mb-1"
              >
                Phone Number <span className="text-neutral-400 text-[10px] font-normal">(for Courier Delivery SMS)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="register-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+92 300 1234567"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2.5 bg-neutral-50/50 border border-neutral-200 hover:border-neutral-300 focus:border-[#0a0a0a] rounded-xl text-xs text-[#0a0a0a] placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-neutral-100 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="register-password"
                className="block text-xs font-semibold text-neutral-800 mb-1"
              >
                Password <span className="text-[#e5341f]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 bg-neutral-50/50 border border-neutral-200 hover:border-neutral-300 focus:border-[#0a0a0a] rounded-xl text-xs text-[#0a0a0a] placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-neutral-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="register-confirm-password"
                className="block text-xs font-semibold text-neutral-800 mb-1"
              >
                Confirm Password <span className="text-[#e5341f]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 bg-neutral-50/50 border border-neutral-200 hover:border-neutral-300 focus:border-[#0a0a0a] rounded-xl text-xs text-[#0a0a0a] placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-neutral-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-[#e5341f] hover:bg-[#c42912] active:bg-[#a6220e] text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="mt-6 pt-4 text-center border-t border-neutral-100">
            <p className="text-xs text-neutral-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigateTo('login')}
                className="font-bold text-[#0a0a0a] hover:text-[#e5341f] underline underline-offset-2 transition-colors cursor-pointer"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
