import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';

export const ResetPasswordView: React.FC = () => {
  const {
    navigateTo,
    otpResetEmail,
    verifiedResetOtp,
    resetPasswordWithOtp,
  } = useStore();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!otpResetEmail || !verifiedResetOtp) {
      setError('Missing OTP verification session. Please restart the password reset flow.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPasswordWithOtp({
        email: otpResetEmail,
        otp: verifiedResetOtp,
        newPassword,
        confirmPassword,
      });

      if (result.success) {
        setSuccess('Password updated successfully! Redirecting to login...');
        setTimeout(() => {
          navigateTo('login');
        }, 1500);
      } else {
        setError(result.message || 'Failed to update password. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
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
          <span>Cancel & Back to Login</span>
        </button>

        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-xl text-[#0a0a0a]">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto text-emerald-600 mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">
              Set New Password
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Your identity has been verified. Enter your new account password below.
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
            {/* New Password */}
            <div>
              <label
                htmlFor="reset-new-password"
                className="block text-xs font-semibold text-neutral-800 mb-1"
              >
                New Password <span className="text-[#e5341f]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="reset-new-password"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
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

            {/* Confirm New Password */}
            <div>
              <label
                htmlFor="reset-confirm-password"
                className="block text-xs font-semibold text-neutral-800 mb-1"
              >
                Confirm New Password <span className="text-[#e5341f]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <input
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError(null);
                  }}
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
              className="w-full mt-2 py-3 bg-[#0a0a0a] hover:bg-[#e5341f] text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
