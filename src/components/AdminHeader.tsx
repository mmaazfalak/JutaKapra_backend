import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Sun,
  Moon,
  Bell,
  ChevronRight,
  ExternalLink,
  LogOut,
  Command,
  Menu,
  Clock,
  RefreshCw,
  ChevronDown,
  Database,
  ShoppingBag,
  Users,
  Zap,
  CheckCircle2,
  Server,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface AdminHeaderProps {
  onOpenMobileMenu?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onOpenMobileMenu }) => {
  const {
    themeMode,
    toggleThemeMode,
    isSidebarCollapsed,
    setIsCommandKOpen,
    activeAdminModule,
    setActiveAdminModule,
    adminRole,
    currentStoreId,
    setCurrentStoreId,
    stores,
    logoutAdmin,
    navigateTo,
    addToast,
    refreshAllData,
    refreshOrders,
    refreshUsersList,
    isSupabaseActive,
    orders,
    customers,
  } = useStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshingTarget, setRefreshingTarget] = useState<'all' | 'orders' | 'profiles' | null>(null);
  const [isReloadMenuOpen, setIsReloadMenuOpen] = useState(false);
  const reloadMenuRef = useRef<HTMLDivElement>(null);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close reload dropdown on outside click
  useEffect(() => {
    const handleReloadClickOutside = (event: MouseEvent) => {
      if (reloadMenuRef.current && !reloadMenuRef.current.contains(event.target as Node)) {
        setIsReloadMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleReloadClickOutside);
    return () => document.removeEventListener('mousedown', handleReloadClickOutside);
  }, []);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    setRefreshingTarget('all');
    try {
      const res = await refreshAllData();
      if (res.success) {
        addToast({
          type: 'success',
          title: 'All Bases Reloaded',
          message: `Orders, customer profiles, and inventory successfully updated from Supabase & MongoDB.`,
          duration: 3500,
        });
      } else {
        addToast({
          type: 'error',
          title: 'Sync Warning',
          message: res.message || 'Failed to complete full store sync.',
          duration: 3500,
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Sync Error',
        message: err.message || 'Failed to synchronize data.',
        duration: 3500,
      });
    } finally {
      setIsRefreshing(false);
      setRefreshingTarget(null);
      setIsReloadMenuOpen(false);
    }
  };

  const handleRefreshOrdersOnly = async () => {
    setIsRefreshing(true);
    setRefreshingTarget('orders');
    try {
      const res = await refreshOrders();
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Orders Reloaded',
          message: `Successfully reloaded orders from backend API and Supabase (${res.count} active).`,
          duration: 3500,
        });
      } else {
        addToast({
          type: 'error',
          title: 'Orders Sync Error',
          message: res.message || 'Failed to reload orders.',
          duration: 3500,
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Orders Sync Error',
        message: err.message || 'Failed to reload orders.',
        duration: 3500,
      });
    } finally {
      setIsRefreshing(false);
      setRefreshingTarget(null);
      setIsReloadMenuOpen(false);
    }
  };

  const handleRefreshProfilesOnly = async () => {
    setIsRefreshing(true);
    setRefreshingTarget('profiles');
    try {
      const res = await refreshUsersList();
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Profiles Reloaded',
          message: `Successfully refreshed customer profiles & addresses from Supabase (public.profiles) & MongoDB.`,
          duration: 3500,
        });
      } else {
        addToast({
          type: 'error',
          title: 'Profiles Sync Error',
          message: res.message || 'Failed to reload profiles.',
          duration: 3500,
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Profiles Sync Error',
        message: err.message || 'Failed to reload profiles.',
        duration: 3500,
      });
    } finally {
      setIsRefreshing(false);
      setRefreshingTarget(null);
      setIsReloadMenuOpen(false);
    }
  };

  // Temporary notifications sample state
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'New Order Received #ORD-9921',
      time: '2 mins ago',
      type: 'order',
      unread: true,
    },
    {
      id: 'notif-2',
      title: 'Stripe Payment Webhook Verified',
      time: '15 mins ago',
      type: 'system',
      unread: true,
    },
    {
      id: 'notif-3',
      title: 'Low Stock Alert: Nike Dunks 1999',
      time: '1 hour ago',
      type: 'alert',
      unread: true,
    },
  ]);

  // Click outside listener for temporary notification drawer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const triggerTestNotification = () => {
    addToast({
      type: 'info',
      title: 'Temporary Page Notification',
      message: 'This notification is non-permanent and auto-dismisses in 3.5s.',
      duration: 3500,
    });
    setIsNotificationOpen(false);
  };

  const getBreadcrumbs = () => {
    switch (activeAdminModule) {
      case 'dashboard':
        return ['Forge', 'Analytics'];
      case 'orders':
        return ['Forge', 'Orders'];
      case 'products':
        return ['Forge', 'Inventory'];
      case 'drops':
        return ['Forge', 'Drop Calendar'];
      case 'customers':
        return ['Forge', 'Customers'];
      case 'reviews':
        return ['Forge', 'Reviews'];
      case 'support':
        return ['Forge', 'Support'];
      case 'payments':
        return ['Forge', 'Payments'];
      case 'audit_logs':
        return ['Forge', 'Audit Logs'];
      case 'team_rbac':
        return ['Forge', 'Team RBAC'];
      case 'store_config':
        return ['Forge', 'Store Config'];
      default:
        return ['Forge', 'Operations'];
    }
  };

  const crumbs = getBreadcrumbs();

  return (
    <header
      className={`h-[60px] fixed top-0 right-0 z-30 flex items-center justify-between px-3 md:px-6 border-b transition-all duration-200 left-0 ${
        isSidebarCollapsed ? 'md:left-[76px]' : 'md:left-[260px]'
      } ${
        themeMode === 'dark'
          ? 'bg-[#12151c] border-[#232833] text-[#e5e9f0]'
          : 'bg-white border-[#e5e7eb] text-[#0f172a]'
      }`}
    >
      {/* Left: Mobile Hamburger Trigger + Breadcrumbs */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-lg bg-black/5 dark:bg-white/10 md:hidden text-slate-300 hover:text-white cursor-pointer"
          title="Open Mobile Navigation Drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-1.5 text-xs font-medium overflow-hidden">
          {crumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#94a3b8] shrink-0" />}
              <span
                className={
                  idx === crumbs.length - 1
                    ? themeMode === 'dark'
                      ? 'font-bold text-white truncate'
                      : 'font-bold text-[#0f172a] truncate'
                    : 'text-[#94a3b8] hidden sm:inline'
                }
              >
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Master Admin / Store Scope Pill */}
        {adminRole === 'super_admin' ? (
          <button
            onClick={() => {
              setActiveAdminModule('stores');
              setCurrentStoreId(null);
            }}
            className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/25 transition-all cursor-pointer shadow-sm ml-2"
            title="Master Admin: Unrestricted access across all stores"
          >
            <span>👑 Master Admin</span>
            <span className="text-[10px] text-blue-300 font-normal">({stores.length} Stores)</span>
          </button>
        ) : (
          <span className="hidden lg:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 ml-2">
            <span>🏪 {stores.find((s) => s.id === currentStoreId)?.name || 'Store Portal'}</span>
          </span>
        )}
      </div>

      {/* Center: Quick Search Trigger (max-w-[576px]) */}
      <div className="flex-1 max-w-[576px] mx-2 sm:mx-6">
        <button
          onClick={() => setIsCommandKOpen(true)}
          className={`w-full flex items-center justify-between px-2.5 sm:px-3.5 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
            themeMode === 'dark'
              ? 'bg-[#181c24] border-[#232833] text-[#9aa4b2] hover:border-[#3b4252]'
              : 'bg-[#f9fafb] border-[#e5e7eb] text-[#475569] hover:border-[#cbd5e1]'
          }`}
        >
          <div className="flex items-center space-x-2 truncate">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#94a3b8] shrink-0" />
            <span className="truncate text-[11px] sm:text-xs">Search SKUs, orders, or customers...</span>
          </div>
          <div className="hidden sm:flex items-center space-x-1 px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[10px] font-mono text-[#94a3b8]">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right Actions: Live Update Data, Status Pulse, Notifications, Theme Switch, Storefront link */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Live Data Sync Multi-Option Dropdown Control */}
        <div className="relative" ref={reloadMenuRef}>
          <div className="flex items-center rounded-lg border shadow-2xs overflow-hidden">
            {/* Primary Action: Reload All */}
            <button
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-60 active:scale-95 ${
                themeMode === 'dark'
                  ? 'bg-[#181c24] text-[#e5e9f0] hover:bg-[#212631]'
                  : 'bg-[#f9fafb] text-[#0f172a] hover:bg-white'
              }`}
              title="Reload all backend data from Supabase & MongoDB (No page reload needed)"
              aria-label="Reload all data"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#e5341f] shrink-0 ${
                  isRefreshing && refreshingTarget === 'all' ? 'animate-spin' : ''
                }`}
              />
              <span className="hidden sm:inline">
                {isRefreshing && refreshingTarget === 'all' ? 'Syncing...' : 'Reload Data'}
              </span>
            </button>

            {/* Dropdown Toggle Chevron */}
            <button
              onClick={() => setIsReloadMenuOpen(!isReloadMenuOpen)}
              disabled={isRefreshing}
              className={`px-1.5 py-1.5 border-l text-xs transition-colors cursor-pointer disabled:opacity-60 ${
                themeMode === 'dark'
                  ? 'bg-[#181c24] border-[#2e3545] text-[#9aa4b2] hover:text-white hover:bg-[#212631]'
                  : 'bg-[#f9fafb] border-[#e5e7eb] text-[#475569] hover:text-[#0f172a] hover:bg-white'
              }`}
              title="Select specific base to reload"
              aria-label="Reload options"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isReloadMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {/* Reload Options Menu */}
          {isReloadMenuOpen && (
            <div
              className={`absolute right-0 mt-2 w-72 sm:w-80 rounded-xl border shadow-2xl z-50 p-2.5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150 ${
                themeMode === 'dark'
                  ? 'bg-[#181c24] border-[#2e3545] text-white'
                  : 'bg-white border-[#e5e7eb] text-[#0f172a]'
              }`}
            >
              {/* Dropdown Header */}
              <div className="px-2 py-1.5 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Database className="w-4 h-4 text-[#e5341f]" />
                    <span className="font-bold text-xs">Live Database Sync</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-semibold">
                    Zero Reload
                  </span>
                </div>
                <p className="text-[11px] text-[#94a3b8] mt-0.5">
                  Fetch & rehydrate real-time state from all backend bases
                </p>
              </div>

              {/* Option Items */}
              <div className="space-y-1">
                {/* 1. Reload All Bases */}
                <button
                  onClick={handleRefreshAll}
                  disabled={isRefreshing}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
                    themeMode === 'dark'
                      ? 'hover:bg-[#212631] text-[#e5e9f0]'
                      : 'hover:bg-slate-100 text-[#0f172a]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-md bg-[#e5341f]/10 text-[#e5341f]">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Reload All Bases</div>
                      <div className="text-[10px] text-[#94a3b8]">
                        Supabase + MongoDB: Orders, Profiles & Catalog
                      </div>
                    </div>
                  </div>
                  {isRefreshing && refreshingTarget === 'all' && (
                    <RefreshCw className="w-3.5 h-3.5 text-[#e5341f] animate-spin" />
                  )}
                </button>

                {/* 2. Reload Orders */}
                <button
                  onClick={handleRefreshOrdersOnly}
                  disabled={isRefreshing}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
                    themeMode === 'dark'
                      ? 'hover:bg-[#212631] text-[#e5e9f0]'
                      : 'hover:bg-slate-100 text-[#0f172a]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Reload Orders Only</div>
                      <div className="text-[10px] text-[#94a3b8]">
                        Supabase orders & MongoDB API ({orders.length} cached)
                      </div>
                    </div>
                  </div>
                  {isRefreshing && refreshingTarget === 'orders' ? (
                    <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                  ) : (
                    <span className="text-[10px] font-mono text-[#94a3b8] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5">
                      {orders.length}
                    </span>
                  )}
                </button>

                {/* 3. Reload Customer Profiles */}
                <button
                  onClick={handleRefreshProfilesOnly}
                  disabled={isRefreshing}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
                    themeMode === 'dark'
                      ? 'hover:bg-[#212631] text-[#e5e9f0]'
                      : 'hover:bg-slate-100 text-[#0f172a]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Reload Profile Details</div>
                      <div className="text-[10px] text-[#94a3b8]">
                        public.profiles, addresses & phone info ({customers.length} users)
                      </div>
                    </div>
                  </div>
                  {isRefreshing && refreshingTarget === 'profiles' ? (
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                  ) : (
                    <span className="text-[10px] font-mono text-[#94a3b8] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5">
                      {customers.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Database Connections Status Footer */}
              <div className="pt-2 border-t border-black/10 dark:border-white/10 px-1 flex items-center justify-between text-[10px] text-[#94a3b8]">
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSupabaseActive ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span>Supabase: {isSupabaseActive ? 'Live' : 'Ready'}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>MongoDB API: Live</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Pulse Dot */}
        <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
          <span className="text-[11px] font-medium text-[#16a34a] whitespace-nowrap">
            Live Gateway Active
          </span>
        </div>

        {/* Notification Bell Dropdown (Temporary Popover View) */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors relative cursor-pointer border ${
              themeMode === 'dark'
                ? 'bg-[#181c24] border-[#232833] text-[#9aa4b2] hover:text-white hover:border-[#3b4252]'
                : 'bg-[#f9fafb] border-[#e5e7eb] text-[#475569] hover:text-[#0f172a] hover:border-[#cbd5e1]'
            }`}
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#e5341f] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Temporary Notification Drawer Popover */}
          {isNotificationOpen && (
            <div
              className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border shadow-2xl z-50 p-3.5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 ${
                themeMode === 'dark'
                  ? 'bg-[#181c24] border-[#2e3545] text-white'
                  : 'bg-white border-[#e5e7eb] text-[#0f172a]'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-[#e5341f]" />
                  <span className="font-bold text-xs tracking-wide">Temporary Notification Feed</span>
                </div>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#e5341f]/10 text-[#e5341f]">
                    {unreadCount} New
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      setNotifications((prev) =>
                        prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n))
                      );
                      addToast({
                        type: 'info',
                        title: notif.title,
                        message: `Timestamp: ${notif.time}`,
                        duration: 3500,
                      });
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      notif.unread
                        ? themeMode === 'dark'
                          ? 'bg-[#212631] border-[#3b4252] text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                        : themeMode === 'dark'
                        ? 'bg-[#181c24] border-transparent text-slate-400'
                        : 'bg-white border-transparent text-slate-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <p className="font-medium pr-2">{notif.title}</p>
                      {notif.unread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#e5341f] shrink-0 mt-1" />
                      )}
                    </div>
                    <div className="flex items-center space-x-1 mt-1 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{notif.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
                <button
                  onClick={triggerTestNotification}
                  className="w-full text-center py-1.5 px-3 rounded-lg bg-[#e5341f] hover:bg-[#d22d1a] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Test Auto-Dismiss Notification (3.5s)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Pill Switch */}
        <button
          onClick={toggleThemeMode}
          title={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="w-[44px] h-[24px] rounded-full bg-[#1e232d] p-[3px] flex items-center transition-colors relative cursor-pointer border border-[#2e3545]"
        >
          <div
            className={`w-[18px] h-[18px] rounded-full bg-white text-slate-900 flex items-center justify-center transition-transform duration-200 ${
              themeMode === 'dark' ? 'translate-x-[20px]' : 'translate-x-0'
            }`}
          >
            {themeMode === 'dark' ? (
              <Moon className="w-2.5 h-2.5 text-indigo-950" />
            ) : (
              <Sun className="w-2.5 h-2.5 text-amber-600" />
            )}
          </div>
        </button>

        {/* Storefront Link */}
        <button
          onClick={() => navigateTo('home')}
          className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <span>Storefront</span>
          <ExternalLink className="w-3 h-3 text-[#94a3b8]" />
        </button>

        {/* Logout Trigger */}
        <button
          onClick={logoutAdmin}
          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-[#dc2626] transition-colors cursor-pointer"
          title="Sign Out Admin Session"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
