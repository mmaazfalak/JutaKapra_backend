import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { GOOGLE_CLIENT_ID, loadGoogleGsiScript } from '../lib/googleAuth';

export const LoginView: React.FC = () => {
  const { navigateTo, loginCustomer, loginWithGoogleCredential, currentCustomer } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          text: 'signin_with',
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

  if (currentCustomer) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#0a0a0a]">Already Signed In</h2>
        <p className="text-xs text-neutral-500">
          You are signed in as <strong>{currentCustomer.email}</strong>.
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginCustomer(email.trim(), password);
      if (result.success) {
        navigateTo('account');
      } else {
        setError(result.message || 'Invalid email or password. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to server. Please try again.');
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
              Login
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

          {/* 1-Click Google Sign In */}
          <div className="space-y-4 mb-5">
            <div className="w-full max-w-[250px] mx-auto flex justify-center overflow-hidden">
              <div
                ref={googleContainerRef}
                id="g_id_signin_loginview"
                className="w-full flex justify-center min-h-[44px] max-w-full overflow-hidden"
              />
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-neutral-200"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold tracking-wider uppercase text-neutral-400">
                Or sign in with email & password
              </span>
              <div className="flex-grow border-t border-neutral-200"></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-neutral-800 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full pl-10 pr-3 py-2.5 bg-neutral-50/50 border border-neutral-200 hover:border-neutral-300 focus:border-[#0a0a0a] rounded-xl text-xs text-[#0a0a0a] placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-neutral-100 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="login-password"
                  className="text-xs font-semibold text-neutral-800"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => navigateTo('forgot-password')}
                  className="text-[11px] font-bold text-[#e5341f] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-[#0a0a0a] hover:bg-[#262626] active:bg-[#404040] text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="mt-6 pt-4 text-center border-t border-neutral-100">
            <p className="text-xs text-neutral-500">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => navigateTo('register')}
                className="font-bold text-[#0a0a0a] hover:text-[#e5341f] underline underline-offset-2 transition-colors cursor-pointer"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
