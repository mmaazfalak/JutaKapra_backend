import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Lock, Eye, EyeOff, Check, X, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const GoogleSetupPasswordModal: React.FC = () => {
  const {
    isGoogleSetupPasswordModalOpen,
    setIsGoogleSetupPasswordModalOpen,
    currentCustomer,
    updateCustomerPassword,
    addToast,
  } = useStore();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPasswordAlready = Boolean(
    currentCustomer?.hasPassword ||
    currentCustomer?.passwordHash ||
    (typeof window !== 'undefined' && currentCustomer?.email && localStorage.getItem('has_password_' + currentCustomer.email.toLowerCase()) === 'true')
  );

  if (!isGoogleSetupPasswordModalOpen || !currentCustomer || hasPasswordAlready) {
    return null;
  }

  const handleClose = () => {
    setIsGoogleSetupPasswordModalOpen(false);
    if (currentCustomer?.email && typeof window !== 'undefined') {
      try {
        localStorage.setItem('dismissed_pwd_modal_' + currentCustomer.email.toLowerCase(), 'true');
      } catch {}
    }
    setPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateCustomerPassword(password);
      if (res.success) {
        if (currentCustomer?.email && typeof window !== 'undefined') {
          try {
            localStorage.setItem('has_password_' + currentCustomer.email.toLowerCase(), 'true');
          } catch {}
        }
        addToast({
          type: 'success',
          title: 'Password Set Successfully',
          message: 'Password saved directly to Supabase. You can now sign in using Google OR your email & password.',
          duration: 5000,
        });
        setIsGoogleSetupPasswordModalOpen(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(res.error || 'Failed to set password. You can try again in Settings.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md bg-[#12151c] border border-[#262c3b] rounded-2xl shadow-2xl p-6 sm:p-8 text-white relative space-y-6"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Account Setup</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">
              Set Up a Password <span className="text-xs font-normal text-slate-400">(Optional)</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
              Welcome, <strong className="text-white">{currentCustomer.fullName || currentCustomer.email}</strong>! You can always sign in with 1-click Google, but setting a password allows you to also sign in directly with your email.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <span className="font-bold">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>New Password</span>
                <span className="text-[10px] text-slate-400 font-mono">Min. 8 characters</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a secure password..."
                  className="w-full pl-9 pr-10 py-2.5 bg-[#0b0e14] border border-[#2a3040] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-white text-xs placeholder:text-slate-500 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password to confirm..."
                  className="w-full pl-9 pr-10 py-2.5 bg-[#0b0e14] border border-[#2a3040] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-white text-xs placeholder:text-slate-500 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Password...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Password</span>
                </>
              )}
            </button>
          </form>

          {/* Setup Later Option */}
          <div className="text-center pt-2 border-t border-[#232833]">
            <button
              type="button"
              onClick={handleClose}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium cursor-pointer"
            >
              Set up later in settings →
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
