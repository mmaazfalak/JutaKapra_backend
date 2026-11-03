import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  ShoppingBag,
  MapPin,
  ShieldCheck,
  LogOut,
  ArrowLeft,
  Edit3,
  Save,
  X,
  KeyRound,
  Eye,
  EyeOff,
  Package,
  Truck,
  CheckCircle2,
  ExternalLink,
  Clock,
  Lock,
  AlertTriangle,
  Camera,
  Trash2,
  Upload,
  Check,
  ChevronRight,
  RefreshCw,
  Copy,
  CreditCard,
  Search,
  Filter,
  ArrowUpRight,
  Shield,
  Award,
  FileText,
  Printer,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { formatPKR } from '../utils/format';
import { AddressManager } from '../components/AddressManager';
import { OrderStatus } from '../types';

type AccountTab = 'overview' | 'orders' | 'addresses' | 'security';
type OrderFilterType = 'all' | 'processing' | 'confirmed' | 'dispatched' | 'delivered';

export const AccountView: React.FC = () => {
  const {
    currentCustomer,
    profile,
    isAuthLoading,
    orders,
    refreshOrders,
    themeMode,
    navigateTo,
    openAuthModal,
    logoutCustomer,
    updateProfile,
    changeCustomerPassword,
    changeCustomerPasswordApi,
    updateCustomerPassword,
    fetchFreshUserProfile,
    addToast,
  } = useStore();

  const isDark = themeMode === 'dark';
  const [activeTab, setActiveTab] = useState<AccountTab>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncingOrders, setIsSyncingOrders] = useState(false);
  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);

  // Search and filter for orders
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderFilterType>('all');

  // Pull fresh user details directly from database on view mount
  useEffect(() => {
    fetchFreshUserProfile();
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchFreshUserProfile();
    await refreshOrders();
    setTimeout(() => {
      setIsRefreshing(false);
      addToast({
        type: 'success',
        title: 'Account Synchronized',
        message: 'Your profile and order stages are up to date.',
        duration: 2500,
      });
    }, 400);
  };

  const handleSyncOrders = async () => {
    setIsSyncingOrders(true);
    try {
      const res = await refreshOrders();
      addToast({
        type: 'success',
        title: 'Live Stages Synced',
        message: `Updated order tracking stages (${res.count || orders.length} orders synchronized).`,
        duration: 2500,
      });
    } catch {
      addToast({
        type: 'info',
        title: 'Sync Complete',
        message: 'Order stages up to date.',
        duration: 2000,
      });
    } finally {
      setTimeout(() => {
        setIsSyncingOrders(false);
      }, 500);
    }
  };

  // Helper for admin-aligned multi-stage pipeline
  const getOrderStageDetails = (status: OrderStatus | string) => {
    const s = String(status || '').trim();
    if (s === 'Processing' || s === 'Pending') {
      return {
        stepIndex: 0,
        stageNumber: 'Stage 1',
        title: 'Pending / Processing',
        badgeText: '⚡ Stage 1: Processing',
        shortText: 'Processing',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        dotColor: 'bg-amber-400',
        description: 'Order received & queued for authentication and warehouse packaging.',
      };
    }
    if (s === 'Confirmed') {
      return {
        stepIndex: 1,
        stageNumber: 'Stage 1.5',
        title: 'Vault Confirmed',
        badgeText: '✓ Confirmed by Warehouse',
        shortText: 'Confirmed',
        badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        dotColor: 'bg-cyan-400',
        description: 'Verified & confirmed by warehouse. Packing parcel for courier dispatch.',
      };
    }
    if (s === 'Dispatched to Courier' || s === 'In Transit') {
      return {
        stepIndex: 2,
        stageNumber: 'Stage 2',
        title: 'In Transit / Courier Dispatched',
        badgeText: '🚚 Stage 2: In Transit',
        shortText: 'In Transit',
        badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse',
        dotColor: 'bg-blue-400',
        description: 'Handed over to courier partner. On the road to your shipping address.',
      };
    }
    if (s === 'Delivered') {
      return {
        stepIndex: 3,
        stageNumber: 'Stage 3',
        title: 'Delivered',
        badgeText: '✓ Stage 3: Delivered',
        shortText: 'Delivered',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        dotColor: 'bg-emerald-400',
        description: 'Package successfully delivered and confirmed.',
      };
    }
    if (s === 'Cancelled') {
      return {
        stepIndex: -1,
        stageNumber: 'Cancelled',
        title: 'Cancelled',
        badgeText: '✕ Cancelled',
        shortText: 'Cancelled',
        badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',
        dotColor: 'bg-red-400',
        description: 'This order was cancelled.',
      };
    }
    return {
      stepIndex: 0,
      stageNumber: 'Stage 1',
      title: s,
      badgeText: s,
      shortText: s,
      badgeClass: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
      dotColor: 'bg-neutral-400',
      description: 'Order registered in system.',
    };
  };

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security / Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);

  // Effective customer object
  const activeFullName = profile?.full_name || currentCustomer?.fullName || 'Collector';
  const activeEmail = profile?.email || currentCustomer?.email || '';
  const activePhone = profile?.phone || currentCustomer?.phone || '';
  const activeAvatar = profile?.avatar_url || currentCustomer?.avatarUrl || '';
  const activeAddresses = currentCustomer?.addresses || [];
  const defaultAddress = activeAddresses.find((a) => a.isDefault) || activeAddresses[0];

  // Orders filtered for this customer
  const customerOrders = orders.filter(
    (o) =>
      o.customerId === currentCustomer?.id ||
      o.customerId === profile?.id ||
      (o.customer?.email && o.customer.email.toLowerCase() === activeEmail.toLowerCase())
  );

  const activeShipments = customerOrders.filter(
    (o) =>
      o.status === 'Dispatched to Courier' ||
      (o.status as string) === 'In Transit' ||
      o.status === 'Processing' ||
      o.status === 'Pending' ||
      o.status === 'Confirmed'
  );

  const totalSpent = customerOrders.reduce((sum, o) => (o.status !== 'Cancelled' ? sum + o.total : sum), 0);
  const latestOrder = customerOrders[0] || null;

  // Filtered orders list for Orders tab
  const filteredOrders = customerOrders.filter((ord) => {
    const q = orderSearchQuery.trim().toLowerCase();
    const trackingNo = (ord.courierTracking?.trackingNumber || ord.trackingNumber || '').toLowerCase();
    const courierPartner = (ord.courierTracking?.courierName || ord.courier || '').toLowerCase();
    const dispatchNote = (ord.courierTracking?.dispatchNote || '').toLowerCase();

    const matchesSearch =
      !q ||
      ord.orderNumber.toLowerCase().includes(q) ||
      trackingNo.includes(q) ||
      courierPartner.includes(q) ||
      dispatchNote.includes(q) ||
      ord.items.some((it) => it.product.title.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (orderStatusFilter === 'processing') return ord.status === 'Processing' || ord.status === 'Pending';
    if (orderStatusFilter === 'confirmed') return ord.status === 'Confirmed';
    if (orderStatusFilter === 'dispatched') return ord.status === 'Dispatched to Courier' || (ord.status as string) === 'In Transit';
    if (orderStatusFilter === 'delivered') return ord.status === 'Delivered';
    return true;
  });

  // Dynamic Theme Classes
  const pageBg = isDark ? 'bg-[#0a0a0a] text-neutral-100' : 'bg-[#fafafa] text-[#0a0a0a]';
  const cardBg = isDark ? 'bg-[#111317] border-neutral-800/90 shadow-lg' : 'bg-white border-neutral-200/90 shadow-sm';
  const subCardBg = isDark ? 'bg-[#161922] border-neutral-800' : 'bg-neutral-50 border-neutral-100';
  const textPrimary = isDark ? 'text-white' : 'text-[#0a0a0a]';
  const textMuted = isDark ? 'text-neutral-400' : 'text-neutral-500';
  const inputBg = isDark
    ? 'bg-[#181c24] border-neutral-700 text-white placeholder-neutral-500 focus:border-white'
    : 'bg-white border-neutral-200 text-[#0a0a0a] placeholder-neutral-400 focus:border-[#0a0a0a]';
  const headerBarBg = isDark ? 'bg-[#0a0a0a]/90 border-neutral-800/80' : 'bg-white/80 border-neutral-200/70';

  // Loading Gate: prevent empty inputs or premature auth bounce during initial session hydration
  if (isAuthLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 font-sans text-center space-y-6">
        <div className={`${cardBg} rounded-3xl p-12 text-center space-y-4`}>
          <div className="w-10 h-10 border-3 border-[#e5341f] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
            Syncing Profile with Cloud Database...
          </p>
        </div>
      </div>
    );
  }

  // Auth Guard: If not logged in after hydration finishes, show sign-in prompt
  if (!currentCustomer && !profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 font-sans text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`${cardBg} rounded-3xl p-8 sm:p-12 shadow-xl space-y-6`}
        >
          <div className="w-16 h-16 rounded-2xl bg-[#0a0a0a] text-white flex items-center justify-center mx-auto shadow-md border border-neutral-800">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${textPrimary}`}>
              Customer Account
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
              Sign in to manage your profile, view orders, save delivery addresses, and track shipments in real-time.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
            <button
              onClick={() => openAuthModal('google')}
              className={`w-full sm:w-auto h-11 px-5 rounded-xl border ${isDark ? 'border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800' : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'} font-bold text-xs transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-xs`}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>
            <button
              onClick={() => navigateTo('login')}
              className={`w-full sm:w-auto h-11 px-5 rounded-xl border ${isDark ? 'border-neutral-600 text-white hover:bg-white hover:text-black' : 'border-[#0a0a0a] text-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white'} font-bold text-xs transition-all cursor-pointer flex items-center justify-center space-x-2`}
            >
              <User className="w-4 h-4" />
              <span>Log In</span>
            </button>
            <button
              onClick={() => navigateTo('register')}
              className="w-full sm:w-auto h-11 px-5 rounded-xl bg-[#e5341f] hover:bg-[#c42912] text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-sm"
            >
              <span>Create Account</span>
            </button>
          </div>

          <button
            onClick={() => navigateTo('shop')}
            className="inline-flex items-center space-x-1 text-xs font-bold text-neutral-400 hover:text-white pt-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Store Catalog</span>
          </button>
        </motion.div>
      </div>
    );
  }

  const startEditing = () => {
    setEditName(activeFullName);
    setEditPhone(activePhone);
    setEditAvatarUrl(activeAvatar);
    setIsEditingProfile(true);
  };

  const cancelEditing = () => {
    setIsEditingProfile(false);
  };

  const saveProfile = async () => {
    setIsSaving(true);
    const trimmedName = editName.trim();
    const trimmedPhone = editPhone.trim();
    const trimmedAvatar = editAvatarUrl.trim();

    try {
      await updateProfile({
        full_name: trimmedName || activeFullName,
        phone: trimmedPhone,
        avatar_url: trimmedAvatar || activeAvatar,
      });

      addToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your personal details have been saved to your account.',
        duration: 3000,
      });

      setIsEditingProfile(false);
    } catch {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Could not update profile. Please try again.',
        duration: 3500,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast({
        type: 'error',
        title: 'File Too Large',
        message: 'Please choose a photo under 5MB.',
        duration: 3500,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const resultData = uploadEvent.target?.result as string;
      if (resultData) {
        setEditAvatarUrl(resultData);
        await updateProfile({ avatar_url: resultData });
        addToast({
          type: 'success',
          title: 'Photo Updated',
          message: 'Your profile picture has been updated.',
          duration: 3000,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const removeProfilePhoto = async () => {
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeFullName)}&background=0a0a0a&color=fff&size=200&bold=true`;
    setEditAvatarUrl(defaultAvatar);
    await updateProfile({ avatar_url: defaultAvatar });
    addToast({
      type: 'info',
      title: 'Photo Reset',
      message: 'Profile picture reset to default monogram.',
      duration: 3000,
    });
  };

  const handleCopyTracking = (trackingNum: string) => {
    navigator.clipboard.writeText(trackingNum);
    setCopiedTrackingId(trackingNum);
    addToast({
      type: 'info',
      title: 'Tracking Code Copied',
      message: `${trackingNum} copied to clipboard.`,
      duration: 2500,
    });
    setTimeout(() => {
      setCopiedTrackingId(null);
    }, 2000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPw(true);
    try {
      const supaResult = await updateCustomerPassword(newPassword);

      const result = await changeCustomerPasswordApi({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      const localResult = changeCustomerPassword(currentPassword, newPassword);

      if (supaResult.success || result.success || localResult.success) {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        addToast({
          type: 'success',
          title: 'Password Saved in Supabase',
          message: 'Your account password has been updated in Supabase. You can now use it to sign in or change it anytime.',
          duration: 3500,
        });
      } else {
        setPasswordError(supaResult.error || result.message || localResult.error || 'Failed to update password.');
      }
    } finally {
      setIsChangingPw(false);
    }
  };

  const navItems: { id: AccountTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview & Profile', icon: <User className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders & Tracking', icon: <ShoppingBag className="w-4 h-4" />, badge: customerOrders.length },
    { id: 'addresses', label: 'Shipping Addresses', icon: <MapPin className="w-4 h-4" />, badge: activeAddresses.length },
    { id: 'security', label: 'Security & Login', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div className={`min-h-screen ${pageBg} font-sans pb-16 transition-colors duration-200`}>
      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Header Breadcrumb & Actions Bar */}
      <div className={`border-b ${headerBarBg} backdrop-blur-md sticky top-0 z-20 transition-colors`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className={`flex items-center space-x-2 text-xs ${textMuted}`}>
            <button
              onClick={() => navigateTo('home')}
              className={`hover:${textPrimary} transition-colors cursor-pointer`}
            >
              Store
            </button>
            <span>/</span>
            <span className={`font-semibold ${textPrimary}`}>Account Dashboard</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border ${isDark ? 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white' : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 hover:text-[#0a0a0a]'} text-[11px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50`}
              title="Synchronize live data"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-[#e5341f]' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync Cloud'}</span>
            </button>

            <button
              onClick={() => navigateTo('shop')}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#e5341f] hover:bg-[#c42912] text-white text-[11px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <span>Catalog</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {/* Luxury Obsidian Hero Profile Banner */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a0a0a] via-[#111317] to-[#0a0a0a] text-white p-6 sm:p-8 shadow-2xl border border-neutral-800"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-600/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* User Identity Info */}
            <div className="flex items-center space-x-4 sm:space-x-6 min-w-0">
              <div className="relative group shrink-0">
                <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-neutral-700 bg-neutral-900 shadow-xl relative ring-4 ring-white/5">
                  {activeAvatar ? (
                    <img
                      src={activeAvatar}
                      alt={activeFullName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-neutral-800 to-neutral-700 flex items-center justify-center text-white font-black text-2xl sm:text-3xl">
                      {activeFullName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Upload Overlay on hover */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer gap-1 backdrop-blur-2xs"
                  >
                    <Camera className="w-4 h-4 text-white" />
                    <span>Change</span>
                  </button>
                </div>

                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0a0a0a] flex items-center justify-center text-white shadow-sm" title="Active Authenticated Member">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>

              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white truncate">
                    {activeFullName}
                  </h1>
                </div>

                <p className="text-xs sm:text-sm text-neutral-400 font-mono truncate">
                  {activeEmail}
                </p>

                {activePhone ? (
                  <p className="text-xs text-neutral-300 flex items-center gap-1.5 font-medium">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{activePhone}</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={startEditing}
                    className="text-xs text-[#e5341f] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Phone className="w-3 h-3" />
                    <span>+ Add Delivery Phone</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="w-full lg:w-auto grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-neutral-800">
              <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800/90 rounded-2xl p-3 sm:p-4 text-center min-w-[95px] sm:min-w-[115px]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Spend</p>
                <p className="text-sm sm:text-base font-bold text-white mt-0.5 font-mono">{formatPKR(totalSpent || currentCustomer?.lifetimeValue || 0)}</p>
              </div>

              <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800/90 rounded-2xl p-3 sm:p-4 text-center min-w-[95px] sm:min-w-[115px]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Orders</p>
                <p className="text-sm sm:text-base font-bold text-white mt-0.5 font-mono">{customerOrders.length}</p>
              </div>

              <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800/90 rounded-2xl p-3 sm:p-4 text-center min-w-[95px] sm:min-w-[115px]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">In Transit</p>
                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                  {activeShipments.length > 0 && <span className="w-2 h-2 rounded-full bg-[#e5341f] animate-ping" />}
                  <p className="text-sm sm:text-base font-bold text-[#e5341f] font-mono">{activeShipments.length}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mobile Horizontal Navigation Tabs */}
        <div className={`lg:hidden flex items-center space-x-1.5 p-1.5 rounded-2xl ${cardBg} overflow-x-auto no-scrollbar shadow-xs`}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 min-w-[110px] flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? `${isDark ? 'bg-white text-black' : 'bg-[#0a0a0a] text-white'} shadow-sm font-black`
                    : `${textMuted} hover:${textPrimary} ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'}`
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-[#e5341f] text-white' : isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Desktop 2-Column Luxury Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Account Navigation Sidebar */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-4 sticky top-20">
            <div className={`${cardBg} rounded-3xl p-3.5 space-y-1.5`}>
              <div className="px-3.5 py-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Account Menu
                </span>
              </div>

              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? `${isDark ? 'bg-white text-black' : 'bg-[#0a0a0a] text-white'} shadow-sm font-black`
                        : `${textMuted} ${isDark ? 'hover:bg-neutral-800/80 hover:text-white' : 'hover:bg-neutral-100 hover:text-[#0a0a0a]'}`
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-1.5 rounded-xl ${isActive ? (isDark ? 'bg-black/10 text-black' : 'bg-white/10 text-white') : textMuted}`}>
                        {item.icon}
                      </div>
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          isActive ? 'bg-[#e5341f] text-white' : isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className={`pt-2 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-100'} mt-2`}>
                <button
                  onClick={logoutCustomer}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold ${textMuted} hover:text-[#e5341f] ${isDark ? 'hover:bg-red-950/30' : 'hover:bg-red-50'} transition-colors cursor-pointer`}
                >
                  <div className="p-1.5 rounded-xl">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Cloud Auto-Sync Notice Card */}
            <div className="bg-neutral-900/90 text-neutral-300 border border-neutral-800 rounded-3xl p-5 space-y-2.5 shadow-sm">
              <div className="flex items-center space-x-2 text-white font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Encrypted Cloud Sync</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Profile records, order consignments, and address details are securely persisted to the Supabase cloud infrastructure.
              </p>
            </div>
          </div>

          {/* Right Column: Main Content Area */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            <AnimatePresence mode="wait">
              {/* ============ OVERVIEW & PROFILE TAB ============ */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Personal Profile Details Card */}
                  <div className={`${cardBg} rounded-3xl p-6 sm:p-8 space-y-6`}>
                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`}>
                      <div>
                        <h2 className={`text-lg font-black ${textPrimary}`}>Profile & Contact Information</h2>
                        <p className={`text-xs ${textMuted} mt-0.5`}>
                          Delivery updates and courier calls are routed using these details.
                        </p>
                      </div>

                      {!isEditingProfile ? (
                        <button
                          onClick={startEditing}
                          className={`h-10 px-5 rounded-xl ${isDark ? 'bg-white text-black hover:bg-[#e5341f] hover:text-white' : 'bg-[#0a0a0a] text-white hover:bg-[#e5341f]'} font-bold text-xs transition-all cursor-pointer flex items-center space-x-2 shadow-xs active:scale-95`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Profile</span>
                        </button>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={cancelEditing}
                            disabled={isSaving}
                            className={`h-10 px-4 rounded-xl border ${isDark ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'} font-bold text-xs cursor-pointer flex items-center space-x-1.5 transition-colors disabled:opacity-50`}
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                          <button
                            onClick={saveProfile}
                            disabled={isSaving}
                            className="h-10 px-5 rounded-xl bg-[#e5341f] hover:bg-[#c42912] text-white font-bold text-xs transition-all cursor-pointer flex items-center space-x-2 shadow-sm active:scale-95 disabled:opacity-50"
                          >
                            {isSaving ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-3.5 h-3.5" />
                                <span>Save Changes</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Profile Photo Bar */}
                    <div className={`p-4 sm:p-5 rounded-2xl ${subCardBg} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-neutral-700 bg-neutral-900 shrink-0 shadow-2xs">
                          <img
                            src={isEditingProfile && editAvatarUrl ? editAvatarUrl : activeAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeFullName)}&background=0a0a0a&color=fff`}
                            alt={activeFullName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className={`text-xs font-bold ${textPrimary} uppercase tracking-wider`}>Collector Monogram / Avatar</h4>
                          <p className={`text-[11px] ${textMuted} mt-0.5`}>High-resolution PNG, JPG, or WebP</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`h-9 px-3.5 rounded-xl border ${isDark ? 'border-neutral-700 hover:border-neutral-500 bg-neutral-800 text-white' : 'border-neutral-300 hover:border-[#0a0a0a] bg-white text-[#0a0a0a]'} text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs active:scale-95`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Image</span>
                        </button>
                        <button
                          type="button"
                          onClick={removeProfilePhoto}
                          title="Reset to default monogram"
                          className={`h-9 px-3 rounded-xl border ${isDark ? 'border-neutral-700 hover:border-red-400 hover:bg-red-950/30 text-neutral-400 hover:text-red-400' : 'border-neutral-200 hover:border-red-300 hover:bg-red-50 text-neutral-500 hover:text-red-600'} text-xs font-medium transition-colors flex items-center cursor-pointer`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Form or Info Display */}
                    {isEditingProfile ? (
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-xs font-bold uppercase tracking-wider ${textPrimary} mb-1.5`}>
                              Full Name <span className="text-[#e5341f]">*</span>
                            </label>
                            <div className="relative flex items-center">
                              <User className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
                              <input
                                type="text"
                                required
                                value={editName}
                                placeholder="Your full name"
                                onChange={(e) => setEditName(e.target.value)}
                                className={`w-full pl-10 pr-3 py-3 ${inputBg} rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all`}
                              />
                            </div>
                          </div>

                          <div>
                            <label className={`block text-xs font-bold uppercase tracking-wider ${textPrimary} mb-1.5`}>
                              Courier Contact Phone (Pakistan)
                            </label>
                            <div className="relative flex items-center">
                              <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
                              <input
                                type="tel"
                                value={editPhone}
                                placeholder="e.g. +92 300 1234567 or 03001234567"
                                onChange={(e) => setEditPhone(e.target.value)}
                                className={`w-full pl-10 pr-3 py-3 ${inputBg} rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all`}
                              />
                            </div>
                            <p className="text-[11px] text-neutral-400 mt-1">
                              Used for courier dispatch calls and delivery coordination.
                            </p>
                          </div>
                        </div>

                        <div className={`p-4 ${subCardBg} rounded-2xl text-xs text-neutral-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
                            <span className="truncate">Primary Email: <strong className={`${textPrimary} font-mono`}>{activeEmail}</strong></span>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shrink-0">
                            Verified Identity
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className={`p-5 rounded-2xl ${subCardBg} space-y-1`}>
                          <div className="flex items-center space-x-2 text-neutral-400">
                            <User className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Full Name</span>
                          </div>
                          <p className={`text-sm font-bold ${textPrimary} pt-1 truncate`}>{activeFullName}</p>
                        </div>

                        <div className={`p-5 rounded-2xl ${subCardBg} space-y-1`}>
                          <div className="flex items-center space-x-2 text-neutral-400">
                            <Mail className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Email Address</span>
                          </div>
                          <p className={`text-sm font-bold ${textPrimary} pt-1 truncate font-mono`}>{activeEmail}</p>
                        </div>

                        <div className={`p-5 rounded-2xl ${subCardBg} space-y-1`}>
                          <div className="flex items-center space-x-2 text-neutral-400">
                            <Phone className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Delivery Contact Phone</span>
                          </div>
                          {activePhone ? (
                            <p className={`text-sm font-bold ${textPrimary} pt-1 font-mono`}>{activePhone}</p>
                          ) : (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={startEditing}
                                className="text-xs text-[#e5341f] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                              >
                                + Add phone number
                              </button>
                            </div>
                          )}
                        </div>

                        <div className={`p-5 rounded-2xl ${subCardBg} space-y-1`}>
                          <div className="flex items-center space-x-2 text-neutral-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Member Since</span>
                          </div>
                          <p className={`text-sm font-bold ${textPrimary} pt-1`}>
                            {new Date(profile?.created_at || currentCustomer?.createdAt || Date.now()).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recent Order Spotlight (if any orders exist) */}
                  {latestOrder && (() => {
                    const latestStage = getOrderStageDetails(latestOrder.status);
                    return (
                      <div className={`${cardBg} rounded-3xl p-6 sm:p-8 space-y-4`}>
                        <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`}>
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-8 h-8 rounded-xl ${subCardBg} flex items-center justify-center ${textPrimary}`}>
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className={`text-sm font-bold ${textPrimary}`}>Latest Order #{latestOrder.orderNumber}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${latestStage.badgeClass}`}>
                                  {latestStage.shortText}
                                </span>
                              </div>
                              <p className={`text-[11px] ${textMuted}`}>
                                Placed on {new Date(latestOrder.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {latestStage.description}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => setActiveTab('orders')}
                            className="text-xs font-bold text-[#e5341f] hover:underline inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>Track Order</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Items Preview */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {latestOrder.items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className={`flex items-center space-x-3 p-3 rounded-2xl ${subCardBg}`}>
                              <img
                                src={item.product.images[0]}
                                alt={item.product.title}
                                className={`w-12 h-12 rounded-xl object-cover border ${isDark ? 'border-neutral-700 bg-neutral-800' : 'border-neutral-200 bg-white'} shrink-0`}
                              />
                              <div className="min-w-0 flex-1">
                                <h5 className={`font-bold text-xs truncate ${textPrimary}`}>{item.product.title}</h5>
                                <p className={`text-[11px] ${textMuted} mt-0.5`}>Size {item.selectedSize} • Qty {item.quantity}</p>
                              </div>
                              <span className={`text-xs font-bold font-mono ${textPrimary} shrink-0`}>
                                {formatPKR(item.product.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Fast Navigation Shortcut Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      onClick={() => setActiveTab('orders')}
                      className={`p-5 rounded-3xl ${cardBg} ${isDark ? 'hover:border-neutral-600' : 'hover:border-[#0a0a0a]'} text-left transition-all cursor-pointer group hover:shadow-md`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`w-10 h-10 rounded-2xl ${isDark ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-100 text-neutral-700'} group-hover:bg-[#e5341f] group-hover:text-white transition-colors flex items-center justify-center`}>
                          <Package className="w-5 h-5" />
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <h4 className={`text-sm font-bold ${textPrimary} mt-4`}>Order History</h4>
                      <p className={`text-xs ${textMuted} mt-1`}>{customerOrders.length} orders on file</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('addresses')}
                      className={`p-5 rounded-3xl ${cardBg} ${isDark ? 'hover:border-neutral-600' : 'hover:border-[#0a0a0a]'} text-left transition-all cursor-pointer group hover:shadow-md`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`w-10 h-10 rounded-2xl ${isDark ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-100 text-neutral-700'} group-hover:bg-[#e5341f] group-hover:text-white transition-colors flex items-center justify-center`}>
                          <MapPin className="w-5 h-5" />
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <h4 className={`text-sm font-bold ${textPrimary} mt-4`}>Address Book</h4>
                      <p className={`text-xs ${textMuted} mt-1`}>{activeAddresses.length} saved destinations</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('security')}
                      className={`p-5 rounded-3xl ${cardBg} ${isDark ? 'hover:border-neutral-600' : 'hover:border-[#0a0a0a]'} text-left transition-all cursor-pointer group hover:shadow-md`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`w-10 h-10 rounded-2xl ${isDark ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-100 text-neutral-700'} group-hover:bg-[#e5341f] group-hover:text-white transition-colors flex items-center justify-center`}>
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <h4 className={`text-sm font-bold ${textPrimary} mt-4`}>Security & Password</h4>
                      <p className={`text-xs ${textMuted} mt-1`}>Credentials & session keys</p>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ============ ORDERS & TRACKING TAB ============ */}
              {activeTab === 'orders' && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Top Search & Filter Bar */}
                  <div className={`${cardBg} rounded-3xl p-5 sm:p-6 space-y-4`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2.5">
                          <h2 className={`text-lg font-black ${textPrimary}`}>Orders & Tracking</h2>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#e5341f]/10 text-[#e5341f] border border-[#e5341f]/20 font-mono">
                            {customerOrders.length} {customerOrders.length === 1 ? 'Order' : 'Orders'}
                          </span>
                        </div>
                        <p className={`text-xs ${textMuted} mt-0.5`}>
                          Real-time fulfillment stages directly synchronized with the Admin Dispatch Pipeline.
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 self-start sm:self-auto">
                        <button
                          onClick={handleSyncOrders}
                          disabled={isSyncingOrders}
                          className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border ${
                            isDark
                              ? 'border-neutral-700 bg-neutral-800 text-neutral-200 hover:text-white hover:border-neutral-600'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:text-neutral-950 hover:bg-neutral-50'
                          } text-xs font-bold transition-all cursor-pointer shadow-2xs`}
                          title="Sync live status from database"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingOrders ? 'animate-spin text-[#e5341f]' : ''}`} />
                          <span>{isSyncingOrders ? 'Syncing...' : 'Live Sync'}</span>
                        </button>

                        <button
                          onClick={() => navigateTo('account-orders')}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#e5341f] hover:bg-[#c42912] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        >
                          <span>Portal Tracker</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Search Input & Status Tabs */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={orderSearchQuery}
                          onChange={(e) => setOrderSearchQuery(e.target.value)}
                          placeholder="Search by order # (FS-xxxxx), product name, or waybill ID..."
                          className={`w-full pl-10 pr-4 py-2.5 ${inputBg} rounded-xl text-xs font-medium focus:outline-none transition-all`}
                        />
                      </div>

                      <div className={`flex items-center space-x-1 p-1 ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-neutral-100'} rounded-xl overflow-x-auto shrink-0 no-scrollbar`}>
                        {([
                          { id: 'all', label: 'All' },
                          { id: 'processing', label: 'Stage 1: Processing' },
                          { id: 'confirmed', label: 'Stage 1.5: Confirmed' },
                          { id: 'dispatched', label: 'Stage 2: In Transit' },
                          { id: 'delivered', label: 'Stage 3: Delivered' },
                        ] as const).map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setOrderStatusFilter(tab.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                              orderStatusFilter === tab.id
                                ? isDark ? 'bg-neutral-800 text-white shadow-xs' : 'bg-white text-[#0a0a0a] shadow-xs'
                                : `${textMuted} hover:${textPrimary}`
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Orders Listing */}
                  {filteredOrders.length === 0 ? (
                    <div className={`p-12 text-center rounded-3xl border border-dashed ${isDark ? 'border-neutral-800 bg-[#111317]' : 'border-neutral-300 bg-white'} space-y-4 shadow-xs`}>
                      <div className={`w-14 h-14 rounded-2xl ${subCardBg} flex items-center justify-center mx-auto text-neutral-400`}>
                        <Package className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className={`text-base font-bold ${textPrimary}`}>No Orders Found</h3>
                        <p className={`text-xs ${textMuted} max-w-sm mx-auto`}>
                          {orderSearchQuery || orderStatusFilter !== 'all'
                            ? 'No orders match your current filter or search keyword.'
                            : 'You have not placed any orders yet. Discover rare footwear and curated drops in our catalog.'}
                        </p>
                      </div>
                      {orderSearchQuery || orderStatusFilter !== 'all' ? (
                        <button
                          onClick={() => {
                            setOrderSearchQuery('');
                            setOrderStatusFilter('all');
                          }}
                          className="inline-flex items-center h-9 px-5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
                        >
                          Clear Filters
                        </button>
                      ) : (
                        <button
                          onClick={() => navigateTo('shop')}
                          className="inline-flex items-center h-10 px-6 rounded-xl bg-[#e5341f] hover:bg-[#c42912] text-white font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
                        >
                          Explore Drops
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {filteredOrders.map((ord) => {
                        const stage = getOrderStageDetails(ord.status);
                        const isDispatched = ord.status === 'Dispatched to Courier' || (ord.status as string) === 'In Transit';
                        const isDelivered = ord.status === 'Delivered';
                        const isConfirmed = ord.status === 'Confirmed';
                        const isCancelled = ord.status === 'Cancelled';
                        const trackingNumber = ord.courierTracking?.trackingNumber || ord.trackingNumber;
                        const courierName = ord.courierTracking?.courierName || ord.courier || 'TCS Express';
                        const trackingUrl = ord.courierTracking?.trackingUrl;
                        const dispatchNote = ord.courierTracking?.dispatchNote;
                        const dispatchedAt = ord.courierTracking?.dispatchedAt;

                        // Progress line calculation
                        // 0 = Order Placed (0%), 1 = Confirmed (33.3%), 2 = Dispatched (66.6%), 3 = Delivered (100%)
                        const stepIdx = stage.stepIndex;
                        const progressWidth =
                          isCancelled
                            ? '100%'
                            : stepIdx <= 0
                            ? '0%'
                            : stepIdx === 1
                            ? '33.33%'
                            : stepIdx === 2
                            ? '66.66%'
                            : '100%';

                        return (
                          <div
                            key={ord.id}
                            className={`${cardBg} rounded-3xl p-5 sm:p-7 space-y-6 transition-colors shadow-sm`}
                          >
                            {/* Order Card Top Bar */}
                            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`}>
                              <div className="flex items-center space-x-3 flex-wrap gap-y-1.5">
                                <span className="font-mono text-sm sm:text-base font-black text-[#e5341f]">
                                  #{ord.orderNumber}
                                </span>
                                <span
                                  className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wide uppercase border ${stage.badgeClass}`}
                                >
                                  {stage.badgeText}
                                </span>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                                <div className={`${textMuted} flex items-center gap-2 text-[11px]`}>
                                  <span>{new Date(ord.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                  <span>•</span>
                                  <strong className={`${textPrimary} font-mono text-sm sm:text-base`}>{formatPKR(ord.total)}</strong>
                                </div>
                                <button
                                  onClick={() => window.print()}
                                  className={`p-2 rounded-xl border ${isDark ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-300' : 'border-neutral-200 hover:bg-neutral-100 text-neutral-600'} transition-colors cursor-pointer`}
                                  title="Print Order Receipt"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Multi-Stage Visual Fulfillment Pipeline */}
                            <div className={`p-4 sm:p-5 rounded-2xl ${subCardBg} space-y-4`}>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                                  Fulfillment Stage Timeline
                                </span>
                                <span className={`text-[11px] font-bold ${isCancelled ? 'text-red-400' : textPrimary}`}>
                                  {stage.description}
                                </span>
                              </div>

                              <div className="relative pt-2 pb-1">
                                {/* Connecting Background Track */}
                                <div className={`absolute top-6 left-6 right-6 h-1 ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'} -z-0 rounded-full`}>
                                  <div
                                    className={`h-full transition-all duration-500 rounded-full ${
                                      isCancelled
                                        ? 'bg-red-500'
                                        : isDelivered
                                        ? 'bg-emerald-500'
                                        : isDispatched
                                        ? 'bg-blue-500'
                                        : isConfirmed
                                        ? 'bg-cyan-500'
                                        : 'bg-amber-500'
                                    }`}
                                    style={{ width: progressWidth }}
                                  />
                                </div>

                                {/* 4 Pipeline Stage Nodes */}
                                <div className="grid grid-cols-4 relative z-10 text-center">
                                  {/* Stage 1: Order Placed */}
                                  <div className="flex flex-col items-center space-y-1.5">
                                    <div
                                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
                                        isCancelled
                                          ? 'bg-red-500 text-white border-red-500'
                                          : stepIdx >= 0
                                          ? isDark ? 'bg-white text-black border-white shadow-sm' : 'bg-[#0a0a0a] text-white border-[#0a0a0a] shadow-sm'
                                          : isDark ? 'bg-neutral-900 text-neutral-500 border-neutral-700' : 'bg-white text-neutral-400 border-neutral-300'
                                      }`}
                                    >
                                      <FileText className="w-4 h-4" />
                                    </div>
                                    <span className={`text-[10px] sm:text-[11px] font-bold ${stepIdx >= 0 ? textPrimary : textMuted}`}>
                                      1. Placed
                                    </span>
                                  </div>

                                  {/* Stage 1.5: Confirmed */}
                                  <div className="flex flex-col items-center space-y-1.5">
                                    <div
                                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
                                        isCancelled
                                          ? 'bg-neutral-800 text-neutral-500 border-neutral-700'
                                          : stepIdx >= 1
                                          ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                                          : isDark ? 'bg-neutral-900 text-neutral-500 border-neutral-700' : 'bg-white text-neutral-400 border-neutral-300'
                                      }`}
                                    >
                                      <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    <span className={`text-[10px] sm:text-[11px] font-bold ${stepIdx >= 1 ? (isDark ? 'text-cyan-400' : 'text-cyan-700') : textMuted}`}>
                                      2. Confirmed
                                    </span>
                                  </div>

                                  {/* Stage 2: Dispatched */}
                                  <div className="flex flex-col items-center space-y-1.5">
                                    <div
                                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
                                        isCancelled
                                          ? 'bg-neutral-800 text-neutral-500 border-neutral-700'
                                          : stepIdx >= 2
                                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                                          : isDark ? 'bg-neutral-900 text-neutral-500 border-neutral-700' : 'bg-white text-neutral-400 border-neutral-300'
                                      }`}
                                    >
                                      <Truck className="w-4 h-4" />
                                    </div>
                                    <span className={`text-[10px] sm:text-[11px] font-bold ${stepIdx >= 2 ? (isDark ? 'text-blue-400' : 'text-blue-700') : textMuted}`}>
                                      3. Dispatched
                                    </span>
                                  </div>

                                  {/* Stage 3: Delivered */}
                                  <div className="flex flex-col items-center space-y-1.5">
                                    <div
                                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
                                        isCancelled
                                          ? 'bg-neutral-800 text-neutral-500 border-neutral-700'
                                          : stepIdx >= 3
                                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                                          : isDark ? 'bg-neutral-900 text-neutral-500 border-neutral-700' : 'bg-white text-neutral-400 border-neutral-300'
                                      }`}
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <span className={`text-[10px] sm:text-[11px] font-bold ${stepIdx >= 3 ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : textMuted}`}>
                                      4. Delivered
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Live Courier Tracking Consignment Card (Dispatched / In Transit / Delivered / Tracking Assigned) */}
                            {(isDispatched || ord.courierTracking || trackingNumber) && (
                              <div className={`p-4 sm:p-5 rounded-2xl ${isDark ? 'bg-blue-950/30 border-blue-900/60' : 'bg-blue-50/70 border-blue-200'} border space-y-3.5`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                      <Truck className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <div className="flex items-center space-x-2">
                                        <p className={`text-xs sm:text-sm font-bold ${isDark ? 'text-blue-300' : 'text-blue-950'}`}>
                                          {courierName} Consignment
                                        </p>
                                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                          Official Dispatch
                                        </span>
                                      </div>
                                      <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-400' : 'text-blue-800/80'}`}>
                                        {isDelivered
                                          ? 'Consignment was delivered to your address.'
                                          : isDispatched
                                          ? 'Express dispatch in transit to your registered address.'
                                          : 'Tracking waybill assigned and registered with carrier.'}
                                      </p>
                                    </div>
                                  </div>

                                  {trackingUrl ? (
                                    <a
                                      href={trackingUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                                    >
                                      <span>Live Courier Tracker</span>
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  ) : (
                                    <button
                                      onClick={() => navigateTo('account-orders')}
                                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                                    >
                                      <span>Track Order</span>
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                {/* Tracking Metadata Grid */}
                                <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl ${isDark ? 'bg-black/40 border-white/5' : 'bg-white border-blue-200/80'} border text-xs`}>
                                  <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-0.5">
                                      Tracking / Waybill ID
                                    </span>
                                    {trackingNumber ? (
                                      <div className="flex items-center space-x-2">
                                        <span className={`font-mono text-xs sm:text-sm font-bold ${isDark ? 'text-blue-400' : 'text-blue-800'} select-all`}>
                                          {trackingNumber}
                                        </span>
                                        <button
                                          onClick={() => handleCopyTracking(trackingNumber)}
                                          title="Copy Tracking ID"
                                          className={`p-1 ${isDark ? 'text-blue-400 hover:text-white' : 'text-blue-600 hover:text-blue-950'} cursor-pointer transition-colors`}
                                        >
                                          {copiedTrackingId === trackingNumber ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                                          ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-neutral-400 italic">Assigned upon dispatch</span>
                                    )}
                                  </div>

                                  <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-0.5">
                                      Carrier Partner
                                    </span>
                                    <span className={`font-bold ${textPrimary}`}>{courierName}</span>
                                  </div>

                                  <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-0.5">
                                      Dispatch Timestamp
                                    </span>
                                    <span className={`${textPrimary} font-medium`}>
                                      {dispatchedAt ? new Date(dispatchedAt).toLocaleString() : 'Logged in pipeline'}
                                    </span>
                                  </div>
                                </div>

                                {/* Dispatch Note if assigned by admin */}
                                {dispatchNote && (
                                  <div className={`p-3 rounded-xl ${isDark ? 'bg-black/30 text-neutral-300' : 'bg-white/80 text-neutral-700'} text-xs flex items-start space-x-2`}>
                                    <span className="text-blue-400 font-bold shrink-0">Admin Note:</span>
                                    <span className="italic">{dispatchNote}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Items Preview */}
                            <div className="space-y-2.5">
                              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">
                                Consignment Items ({ord.items.length})
                              </span>
                              {ord.items.map((it, idx) => (
                                <div key={idx} className={`flex items-center space-x-3.5 p-3.5 rounded-2xl ${subCardBg}`}>
                                  <img
                                    src={it.product.images[0]}
                                    alt={it.product.title}
                                    className={`w-13 h-13 sm:w-15 sm:h-15 object-cover rounded-xl border ${isDark ? 'border-neutral-700 bg-neutral-800' : 'border-neutral-200 bg-white'} shrink-0`}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <h5 className={`font-bold text-xs sm:text-sm truncate ${textPrimary}`}>{it.product.title}</h5>
                                    <p className={`text-xs ${textMuted} mt-0.5`}>
                                      Size <span className={`font-semibold ${textPrimary}`}>{it.selectedSize}</span> • Quantity {it.quantity}
                                    </p>
                                  </div>
                                  <span className={`font-bold text-xs sm:text-sm ${textPrimary} font-mono shrink-0`}>
                                    {formatPKR(it.product.price * it.quantity)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Order Footer Details (Shipping address & payment) */}
                            <div className={`pt-4 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-100'} flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${textMuted}`}>
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                <span className="truncate">
                                  Delivery to: <strong className={textPrimary}>{ord.customer.fullName}</strong> ({ord.customer.city || 'Pakistan'})
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="uppercase text-[10px] font-black tracking-wider px-2 py-0.5 rounded bg-neutral-500/10 text-neutral-400 border border-neutral-500/20 font-mono">
                                  {ord.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : ord.paymentMethod.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ============ ADDRESSES TAB ============ */}
              {activeTab === 'addresses' && (
                <motion.div
                  key="addresses"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={`${cardBg} rounded-3xl p-6 sm:p-8`}>
                    <AddressManager />
                  </div>
                </motion.div>
              )}

              {/* ============ SECURITY & LOGIN TAB ============ */}
              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className={`${cardBg} rounded-3xl p-6 sm:p-8 space-y-6`}>
                    {/* Google Linked Account Status */}
                    {(currentCustomer.authProvider === 'google' || profile?.auth_provider === 'google') && (
                      <div className={`${isDark ? 'bg-blue-950/30 border-blue-900/60' : 'bg-gradient-to-r from-blue-50/70 to-indigo-50/50 border-blue-100'} border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                        <div className="flex items-center space-x-3.5">
                          <div className={`w-11 h-11 rounded-2xl ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-blue-200'} border flex items-center justify-center shrink-0 shadow-xs`}>
                            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className={`text-xs font-bold ${textPrimary} flex items-center gap-1.5`}>
                              <span>Google Identity Linked</span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                                Active
                              </span>
                            </h4>
                            <p className="text-[11px] text-neutral-400 font-mono mt-0.5">{activeEmail}</p>
                          </div>
                        </div>

                        <span className={`text-[11px] font-medium ${isDark ? 'text-blue-300 bg-blue-900/40 border-blue-800' : 'text-blue-800 bg-blue-100/70 border-blue-200/70'} px-3 py-1.5 rounded-xl border self-start sm:self-auto`}>
                          Google 1-Click + Password Dual Login Active
                        </span>
                      </div>
                    )}

                    <div>
                      <h2 className={`text-lg font-black ${textPrimary}`}>
                        {currentCustomer.passwordHash || currentCustomer.hasPassword
                          ? 'Account Password'
                          : 'Set Up Account Password'}
                      </h2>
                      <p className={`text-xs ${textMuted} mt-0.5`}>
                        {currentCustomer.passwordHash || currentCustomer.hasPassword
                          ? 'Update your account login password. You can sign in using either Google or your email & password.'
                          : 'Create a password for this account so you can log in directly with your email & password on any device.'}
                      </p>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                      {(currentCustomer.passwordHash && currentCustomer.authProvider !== 'google') && (
                        <div>
                          <label className={`block text-xs font-bold uppercase tracking-wider ${textPrimary} mb-1.5`}>
                            Current Password
                          </label>
                          <div className="relative flex items-center">
                            <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
                            <input
                              type={showCurrentPw ? 'text' : 'password'}
                              required
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className={`w-full pl-10 pr-10 py-3 ${inputBg} rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/20`}
                              placeholder="Enter your current password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPw(!showCurrentPw)}
                              className={`absolute right-3.5 text-neutral-400 hover:${textPrimary} cursor-pointer`}
                            >
                              {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-xs font-bold uppercase tracking-wider ${textPrimary} mb-1.5`}>
                            {currentCustomer.passwordHash || currentCustomer.hasPassword ? 'New Password' : 'Create Password'}
                          </label>
                          <div className="relative flex items-center">
                            <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
                            <input
                              type={showNewPw ? 'text' : 'password'}
                              required
                              value={newPassword}
                              onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); setPasswordSuccess(false); }}
                              className={`w-full pl-10 pr-10 py-3 ${inputBg} rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/20`}
                              placeholder="Min 6 characters"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPw(!showNewPw)}
                              className={`absolute right-3.5 text-neutral-400 hover:${textPrimary} cursor-pointer`}
                            >
                              {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className={`block text-xs font-bold uppercase tracking-wider ${textPrimary} mb-1.5`}>
                            Confirm Password
                          </label>
                          <div className="relative flex items-center">
                            <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
                            <input
                              type="password"
                              required
                              value={confirmPassword}
                              onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                              className={`w-full pl-10 pr-3 py-3 ${inputBg} rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/20`}
                              placeholder="Re-enter password"
                            />
                          </div>
                        </div>
                      </div>

                      {passwordError && (
                        <div className={`flex items-center space-x-2 p-3.5 ${isDark ? 'bg-red-950/40 border-red-900/60' : 'bg-red-50 border-red-200'} border rounded-xl text-xs text-[#e5341f] font-medium`}>
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{passwordError}</span>
                        </div>
                      )}

                      {passwordSuccess && (
                        <div className={`flex items-center space-x-2 p-3.5 ${isDark ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'} border rounded-xl text-xs font-medium`}>
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Password saved successfully! You can now log in using either Google or your email &amp; password.</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isChangingPw}
                        className="h-11 px-6 rounded-xl bg-[#e5341f] hover:bg-[#c42912] text-white font-bold text-xs transition-all cursor-pointer flex items-center space-x-2 shadow-xs active:scale-95 disabled:opacity-50"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          {isChangingPw
                            ? 'Saving Password...'
                            : currentCustomer.passwordHash || currentCustomer.hasPassword
                            ? 'Update Password'
                            : 'Save & Enable Password Login'}
                        </span>
                      </button>
                    </form>
                  </div>

                  {/* Active Session & Device Card */}
                  <div className={`${cardBg} rounded-3xl p-6 sm:p-8 space-y-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                    <div>
                      <h3 className={`text-sm sm:text-base font-bold ${textPrimary}`}>Device Session</h3>
                      <p className={`text-xs ${textMuted} mt-0.5`}>
                        Currently active on this device. Sign out when using a shared or public computer.
                      </p>
                    </div>

                    <button
                      onClick={logoutCustomer}
                      className={`h-11 px-5 rounded-xl border ${isDark ? 'border-neutral-700 hover:border-red-500/50 hover:bg-red-950/30 text-neutral-300 hover:text-red-400' : 'border-neutral-200 hover:border-red-300 hover:bg-red-50 text-neutral-700 hover:text-red-600'} font-bold text-xs transition-all cursor-pointer flex items-center space-x-2 shrink-0 active:scale-95`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out from Device</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
