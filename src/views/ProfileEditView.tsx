import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';

export const ProfileEditView: React.FC = () => {
  const { currentCustomer, profile, isAuthLoading, navigateTo, updateProfile, fetchFreshUserProfile } = useStore();

  const [fullName, setFullName] = useState(profile?.full_name || currentCustomer?.fullName || '');
  const [phone, setPhone] = useState(profile?.phone || currentCustomer?.phone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pull fresh user details from database on view load
  useEffect(() => {
    fetchFreshUserProfile();
  }, []);

  useEffect(() => {
    if (profile || currentCustomer) {
      setFullName(profile?.full_name || currentCustomer?.fullName || '');
      setPhone(profile?.phone || currentCustomer?.phone || '');
    }
  }, [profile, currentCustomer]);

  // Loading Gate: prevent empty form flash or premature auth bounce during session hydration
  if (isAuthLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-8 h-8 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-neutral-500">Loading your profile details...</p>
      </div>
    );
  }

  // Auth Guard
  if (!currentCustomer && !profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#0a0a0a]">Authentication Required</h2>
        <p className="text-xs text-neutral-500">Please sign in to manage your profile.</p>
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

    if (!fullName.trim()) {
      setError('Full name cannot be empty.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
      });

      if (result.success) {
        setSuccess('Profile details saved successfully.');
      } else {
        setError(result.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans space-y-6 text-[#0a0a0a]">
      {/* Navigation Breadcrumb */}
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
          <h1 className="text-xl font-bold tracking-tight text-[#0a0a0a]">Edit Profile</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Update your account name and courier delivery phone number.
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
              Full Name <span className="text-[#e5341f]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full pl-10 pr-3 py-2.5 bg-neutral-50/50 border border-neutral-200 hover:border-neutral-300 focus:border-[#0a0a0a] rounded-xl text-xs text-[#0a0a0a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-neutral-100 transition-all"
              />
            </div>
          </div>

          {/* Email (Readonly for security) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
              Email Address <span className="text-neutral-400 text-[10px] font-normal">(Primary account identity)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                disabled
                value={currentCustomer?.email || profile?.email || ''}
                className="w-full pl-10 pr-3 py-2.5 bg-neutral-100/70 border border-neutral-200 rounded-xl text-xs text-neutral-600 cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              For security, email updates require dedicated identity verification.
            </p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
              Phone Number <span className="text-neutral-400 text-[10px] font-normal">(for TCS / Leopards Courier Updates)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                placeholder="+92 300 1234567"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full pl-10 pr-3 py-2.5 bg-neutral-50/50 border border-neutral-200 hover:border-neutral-300 focus:border-[#0a0a0a] rounded-xl text-xs text-[#0a0a0a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-neutral-100 transition-all"
              />
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
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
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
