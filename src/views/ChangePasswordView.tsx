import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';

export const ChangePasswordView: React.FC = () => {
  const { currentCustomer, navigateTo, changeCustomerPasswordApi, updateCustomerPassword } = useStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!currentCustomer) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#0a0a0a]">Authentication Required</h2>
        <p className="text-xs text-neutral-500">Please sign in to change your password.</p>
        <button
          onClick={() => navigateTo('login')}
          className="px-6 py-2.5 bg-[#0a0a0a] text-white text-xs font-bold rounded-xl hover:bg-[#e5341f] transition-colors cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const supaResult = await updateCustomerPassword(newPassword);

      const result = await changeCustomerPasswordApi({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (supaResult.success || result.success) {
        setSuccess('Your password has been changed and saved to Supabase successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(supaResult.error || result.message || 'Failed to update password.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans space-y-6 text-[#0a0a0a]">
      <button
        onClick={() => navigateTo('account')}
        className="inline-flex items-center space-x-1.5 text-xs font-bold text-neutral-500 hover:text-[#0a0a0a] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Account Overview</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6"
      >
        <div className="border-b border-neutral-100 pb-4">
          <h1 className="text-xl font-bold tracking-tight text-[#0a0a0a]">Change Password</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Ensure your account is using a strong password with at least 8 characters.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-start gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
              Current Password <span className="text-[#e5341f]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showCurrentPw ? 'text' : 'password'}
                required
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full pl-10 pr-10 py-2.5 bg-neutral-50/50 border border-neutral-200 hover:border-neutral-300 focus:border-[#0a0a0a] rounded-xl text-xs text-[#0a0a0a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-neutral-100 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                tabIndex={-1}
              >
                {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
              New Password <span className="text-[#e5341f]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showNewPw ? 'text' : 'password'}
                required
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full pl-10 pr-10 py-2.5 bg-neutral-50/50 border border-neutral-200 hover:border-neutral-300 focus:border-[#0a0a0a] rounded-xl text-xs text-[#0a0a0a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-neutral-100 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                tabIndex={-1}
              >
                {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
              Confirm New Password <span className="text-[#e5341f]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <input
                type={showConfirmPw ? 'text' : 'password'}
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full pl-10 pr-10 py-2.5 bg-neutral-50/50 border border-neutral-200 hover:border-neutral-300 focus:border-[#0a0a0a] rounded-xl text-xs text-[#0a0a0a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-neutral-100 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                tabIndex={-1}
              >
                {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="h-10 px-6 bg-[#0a0a0a] hover:bg-[#e5341f] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center space-x-2 shadow-xs disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigateTo('account')}
              className="h-10 px-4 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
