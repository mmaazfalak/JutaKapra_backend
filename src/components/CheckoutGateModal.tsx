import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  Mail,
  User,
  Phone,
  Lock,
  Loader2,
  AlertCircle,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatPKR } from '../utils/format';
import { GOOGLE_CLIENT_ID, loadGoogleGsiScript } from '../lib/googleAuth';

/**
 * Standard Google Identity Services (GSI) Button
 */
const GoogleGsiButton: React.FC<{
  onSuccess: (credential: string) => void;
  onError: (error: string) => void;
  text?: 'continue_with' | 'signin_with' | 'signup_with' | 'signin';
  width?: string;
}> = ({ onSuccess, onError, text = 'continue_with', width = '240' }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    const setupGoogleButton = async () => {
      await loadGoogleGsiScript();
      if (!active || !containerRef.current || !window.google?.accounts?.id) return;

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (res: { credential: string }) => {
            if (res.credential) {
              onSuccess(res.credential);
            } else {
              onError('Google authentication failed: no credential token returned.');
            }
          },
        });

        containerRef.current.innerHTML = '';
        const targetWidth = width || '240';

        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: text as any,
          shape: 'pill',
          width: targetWidth,
        });
      } catch (err: any) {
        console.warn('Google GSI render error:', err);
      }
    };

    setupGoogleButton();

    return () => {
      active = false;
    };
  }, [onSuccess, onError, text, width]);

  return (
    <div className="w-full max-w-[250px] mx-auto flex justify-center py-1 overflow-hidden">
      <div
        ref={containerRef}
        id="g_id_signin"
        data-type="standard"
        data-shape="pill"
        data-theme="outline"
        data-text={text}
        data-size="large"
        className="w-full flex justify-center min-h-[44px] max-w-full overflow-hidden"
      />
    </div>
  );
};

export const CheckoutGateModal: React.FC = () => {
  const {
    isCheckoutGateOpen,
    setIsCheckoutGateOpen,
    authModalTab,
    setAuthModalTab,
    loginWithGoogleCredential,
    loginWithEmail,
    registerCustomer,
    loginCustomer,
    cart,
    cartSubtotal,
    navigateTo,
  } = useStore();

  const activeTab = authModalTab === 'google' ? 'signin' : authModalTab;
  const setActiveTab = setAuthModalTab;

  // Sign Up fields
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);

  // Sign In fields
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // UI & Validation state
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCheckoutGateOpen) {
        setIsCheckoutGateOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCheckoutGateOpen, setIsCheckoutGateOpen]);

  // Clear errors when switching tabs
  useEffect(() => {
    setErrors({});
    setTouched({});
    setIsLoading(false);
  }, [activeTab]);

  if (!isCheckoutGateOpen) return null;

  const validateSignUp = () => {
    const newErrors: Record<string, string> = {};

    if (!signUpName.trim()) {
      newErrors.name = 'Please enter your full name.';
    } else if (signUpName.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters.';
    }

    if (!signUpEmail.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpEmail.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!signUpPassword) {
      newErrors.password = 'Please create a password.';
    } else if (signUpPassword.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (!signUpConfirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (signUpPassword && signUpPassword !== signUpConfirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (activeTab === 'signup') {
      validateSignUp();
    }
  };

  const handleGoogleCredentialResponse = async (credential: string) => {
    setIsLoading(true);
    setErrors({});
    try {
      const res = await loginWithGoogleCredential(credential);
      if (res.success) {
        setIsCheckoutGateOpen(false);
        if (cart.length > 0) {
          navigateTo('checkout');
        } else {
          navigateTo('account-orders');
        }
      } else {
        setErrors({ general: res.error || 'Google authentication failed' });
      }
    } catch (err: any) {
      setErrors({ general: err.message || 'Google authentication error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!signInEmail.trim()) {
      newErrors.signInEmail = 'Please enter your email address.';
    }
    if (!signInPassword) {
      newErrors.signInPassword = 'Please enter your password.';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginCustomer(signInEmail.trim(), signInPassword);
      if (res.success) {
        setIsCheckoutGateOpen(false);
        if (cart.length > 0) {
          navigateTo('checkout');
        } else {
          navigateTo('account');
        }
      } else {
        setErrors({ general: res.message || 'Invalid email or password.' });
      }
    } catch (err: any) {
      setErrors({ general: err.message || 'Login failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirmPassword: true });

    if (!validateSignUp()) return;

    setIsLoading(true);
    try {
      const res = await registerCustomer({
        fullName: signUpName.trim(),
        email: signUpEmail.trim(),
        phone: signUpPhone.trim() || undefined,
        password: signUpPassword,
        confirmPassword: signUpConfirmPassword,
      });

      if (res.success) {
        setIsCheckoutGateOpen(false);
        if (cart.length > 0) {
          navigateTo('checkout');
        } else {
          navigateTo('account');
        }
      } else {
        setErrors({ general: res.message || 'Registration failed.' });
      }
    } catch (err: any) {
      setErrors({ general: err.message || 'Registration failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setIsCheckoutGateOpen(false)}
          className="fixed inset-0 bg-[#0a0a0a]/60 backdrop-blur-sm"
          aria-hidden="true"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[460px] bg-white rounded-2xl shadow-2xl border border-neutral-200/80 overflow-hidden z-10 my-auto text-[#0a0a0a]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setIsCheckoutGateOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-[#0a0a0a] hover:bg-neutral-100 transition-colors cursor-pointer z-20 focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]/20"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Cart Bag Indicator */}
          {cart.length > 0 && (
            <div className="bg-[#fafafa] border-b border-neutral-100 px-6 py-2.5 flex items-center justify-between text-xs text-neutral-600">
              <span className="flex items-center gap-1.5 font-medium">
                <ShoppingBag className="w-3.5 h-3.5 text-[#e5341f]" />
                Cart: {cart.length} item{cart.length !== 1 ? 's' : ''}
              </span>
              <span className="font-semibold text-[#0a0a0a]">{formatPKR(cartSubtotal)}</span>
            </div>
          )}

          <div className="p-6 sm:p-8">
            {/* Header Section */}
            <div className="mb-5 pr-6">
              <h2 id="auth-modal-title" className="text-xl sm:text-2xl font-bold tracking-tight text-[#0a0a0a]">
                {activeTab === 'signup' ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-neutral-500 leading-relaxed">
                {activeTab === 'signup'
                  ? 'Sign up to track orders, save shipping details, and access your profile.'
                  : 'Sign in to access your orders, saved addresses, and profile.'}
              </p>
            </div>

            {/* General Server/Validation Error */}
            {errors.general && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200/70 text-red-700 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span className="leading-snug">{errors.general}</span>
              </div>
            )}

            {/* OFFICIAL GOOGLE IDENTITY GSI BUTTON */}
            <div className="mb-2 flex justify-center">
              <GoogleGsiButton
                onSuccess={handleGoogleCredentialResponse}
                onError={(err) => setErrors({ general: err })}
                text={activeTab === 'signup' ? 'signup_with' : 'continue_with'}
                width="240"
              />
            </div>

            {/* Divider */}
            <div className="relative my-3.5 flex items-center justify-center">
              <div className="border-t border-neutral-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-neutral-400 uppercase tracking-wider font-medium">
                or continue with email
              </span>
            </div>

            {/* SIGN UP FORM */}
            {activeTab === 'signup' ? (
              <form onSubmit={handleSignUpSubmit} noValidate className="space-y-3.5">
                {/* 1. Full name */}
                <div>
                  <label
                    htmlFor="signup-fullname"
                    className="block text-xs font-semibold text-neutral-800 mb-1"
                  >
                    Full name <span className="text-[#e5341f]" aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-fullname"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      required
                      placeholder="Your full name"
                      value={signUpName}
                      onChange={(e) => {
                        setSignUpName(e.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      onBlur={() => handleBlur('name')}
                      className={`w-full pl-10 pr-3 py-2.5 bg-neutral-50/50 border rounded-xl text-xs text-[#0a0a0a] placeholder:text-neutral-400 focus:outline-none focus:bg-white transition-all ${
                        touched.name && errors.name
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                          : 'border-neutral-200 hover:border-neutral-300 focus:border-[#0a0a0a] focus:ring-2 focus:ring-neutral-100'
                      }`}
                    />
                  </div>
                  {touched.name && errors.name && (
                    <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* 2. Email */}
                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-xs font-semibold text-neutral-800 mb-1"
                  >
                    Email address <span className="text-[#e5341f]" aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="you@example.com"
                      value={signUpEmail}
                      onChange={(e) => {
                        setSignUpEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      onBlur={() => handleBlur('email')}
                      className={`w-full pl-10 pr-3 py-2.5 bg-neutral-50/50 border rounded-xl text-xs text-[#0a0a0a] placeholder:text-neutral-400 focus:outline-none focus:bg-white transition-all ${
                        touched.email && errors.email
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                          : 'border-neutral-200 hover:border-neutral-300 focus:border-[#0a0a0a] focus:ring-2 focus:ring-neutral-100'
                      }`}
                    />
                  </div>
                  {touched.email && errors.email && (
                    <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* 3. Password */}
                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-xs font-semibold text-neutral-800 mb-1"
                  >
                    Password <span className="text-[#e5341f]" aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-password"
                      name="password"
                      type={showSignUpPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      placeholder="At least 6 characters"
                      value={signUpPassword}
                      onChange={(e) => {
                        setSignUpPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      onBlur={() => handleBlur('password')}
                      className={`w-full pl-10 pr-10 py-2.5 bg-neutral-50/50 border rounded-xl text-xs text-[#0a0a0a] placeholder:text-neutral-400 focus:outline-none focus:bg-white transition-all ${
                        touched.password && errors.password
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                          : 'border-neutral-200 hover:border-neutral-300 focus:border-[#0a0a0a] focus:ring-2 focus:ring-neutral-100'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {touched.password && errors.password && (
                    <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* 4. Confirm Password */}
                <div>
                  <label
                    htmlFor="signup-confirm-password"
                    className="block text-xs font-semibold text-neutral-800 mb-1"
                  >
                    Confirm Password <span className="text-[#e5341f]" aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-confirm-password"
                      name="confirmPassword"
                      type={showSignUpConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      placeholder="Re-enter your password"
                      value={signUpConfirmPassword}
                      onChange={(e) => {
                        setSignUpConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }}
                      onBlur={() => handleBlur('confirmPassword')}
                      className={`w-full pl-10 pr-10 py-2.5 bg-neutral-50/50 border rounded-xl text-xs text-[#0a0a0a] placeholder:text-neutral-400 focus:outline-none focus:bg-white transition-all ${
                        touched.confirmPassword && errors.confirmPassword
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                          : signUpConfirmPassword && signUpPassword === signUpConfirmPassword
                          ? 'border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                          : 'border-neutral-200 hover:border-neutral-300 focus:border-[#0a0a0a] focus:ring-2 focus:ring-neutral-100'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showSignUpConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {signUpConfirmPassword && signUpPassword === signUpConfirmPassword && (
                    <p className="mt-1 text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Passwords match
                    </p>
                  )}
                  {touched.confirmPassword && errors.confirmPassword && (
                    <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* 5. Optional Phone */}
                <div>
                  <label
                    htmlFor="signup-phone"
                    className="block text-xs font-semibold text-neutral-800 mb-1"
                  >
                    Phone number <span className="text-neutral-400 text-[10px] font-normal">(Optional, for courier updates)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+92 300 1234567"
                      value={signUpPhone}
                      onChange={(e) => setSignUpPhone(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-neutral-50/50 border border-neutral-200 hover:border-neutral-300 focus:border-[#0a0a0a] rounded-xl text-xs text-[#0a0a0a] placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-neutral-100 transition-all"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 bg-[#e5341f] hover:bg-[#c42912] active:bg-[#a6220e] text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </form>
            ) : (
              /* SIGN IN FORM */
              <form onSubmit={handleSignInSubmit} noValidate className="space-y-3.5">
                {/* Email */}
                <div>
                  <label
                    htmlFor="signin-email"
                    className="block text-xs font-semibold text-neutral-800 mb-1"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="signin-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="you@example.com"
                      value={signInEmail}
                      onChange={(e) => {
                        setSignInEmail(e.target.value);
                        if (errors.signInEmail) setErrors((prev) => ({ ...prev, signInEmail: '' }));
                      }}
                      className="w-full pl-10 pr-3 py-2.5 bg-neutral-50/50 border border-neutral-200 hover:border-neutral-300 focus:border-[#0a0a0a] rounded-xl text-xs text-[#0a0a0a] placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-neutral-100 transition-all"
                    />
                  </div>
                  {errors.signInEmail && (
                    <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {errors.signInEmail}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="signin-password"
                      className="block text-xs font-semibold text-neutral-800"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCheckoutGateOpen(false);
                        navigateTo('forgot-password');
                      }}
                      className="text-[11px] font-bold text-[#e5341f] hover:underline cursor-pointer"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="signin-password"
                      name="password"
                      type={showSignInPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      placeholder="Enter your password"
                      value={signInPassword}
                      onChange={(e) => {
                        setSignInPassword(e.target.value);
                        if (errors.signInPassword) setErrors((prev) => ({ ...prev, signInPassword: '' }));
                      }}
                      className="w-full pl-10 pr-10 py-2.5 bg-neutral-50/50 border border-neutral-200 hover:border-neutral-300 focus:border-[#0a0a0a] rounded-xl text-xs text-[#0a0a0a] placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-neutral-100 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.signInPassword && (
                    <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {errors.signInPassword}
                    </p>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 bg-[#0a0a0a] hover:bg-[#262626] active:bg-[#404040] text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>
            )}

            {/* Toggle between Sign In and Sign Up */}
            <div className="mt-5 pt-4 text-center border-t border-neutral-100">
              {activeTab === 'signup' ? (
                <p className="text-xs text-neutral-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('signin')}
                    className="font-bold text-[#0a0a0a] hover:text-[#e5341f] underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Sign in here
                  </button>
                </p>
              ) : (
                <p className="text-xs text-neutral-500">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('signup')}
                    className="font-bold text-[#0a0a0a] hover:text-[#e5341f] underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Create account
                  </button>
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
