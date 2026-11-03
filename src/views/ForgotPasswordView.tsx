import React, { useState } from 'react';
import { Mail, AlertCircle, ArrowRight, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';

export const ForgotPasswordView: React.FC = () => {
  const { navigateTo, requestPasswordReset, setOtpResetEmail, addToast } = useStore();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await requestPasswordReset(normalizedEmail);
      if (result.success) {
        setOtpResetEmail(normalizedEmail);
        setSuccess(
          'A 6-digit verification OTP code has been sent to your email. Redirecting to verification...'
        );
        setTimeout(() => {
          navigateTo('verify-otp');
        }, 1200);
      } else if (result.notRegistered) {
        setOtpResetEmail(normalizedEmail);
        setError(`No account found for "${normalizedEmail}". If you usually sign in with Google, please check the email address or use Google Sign-In.`);
        addToast({
          type: 'info',
          title: 'Account Not Found',
          message: `No account found for "${normalizedEmail}". Please verify the email or register a new account.`,
          duration: 4500,
        });
      } else {
        setError(result.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
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
        <button
          onClick={() => navigateTo('login')}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-neutral-500 hover:text-[#0a0a0a] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </button>

        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-xl text-[#0a0a0a]">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto text-[#0a0a0a] mb-3">
              <KeyRound className="w-6 h-6 text-[#e5341f]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">
              Forgot Password
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Enter your registered email address and we will send you a secure 6-digit OTP code to reset your password.
            </p>
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

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="forgot-email"
                className="block text-xs font-semibold text-neutral-800 mb-1"
              >
                Registered Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="forgot-email"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-[#e5341f] hover:bg-[#c42912] active:bg-[#a6220e] text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send 6-Digit OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 text-center border-t border-neutral-100">
            <p className="text-xs text-neutral-500">
              Remembered your password?{' '}
              <button
                type="button"
                onClick={() => navigateTo('login')}
                className="font-bold text-[#0a0a0a] hover:text-[#e5341f] underline underline-offset-2 transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
