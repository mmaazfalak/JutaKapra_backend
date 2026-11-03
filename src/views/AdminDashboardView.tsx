import React, { useState, useEffect } from 'react';
import {
  Flame,
  AlertTriangle,
  X,
  User,
  ShoppingBag,
  Clock,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Customer, AuditLog } from '../types';
import { formatPKR } from '../utils/format';

// Sub-components
import { AdminDashboardOverview } from '../components/admin/AdminDashboardOverview';
import { AdminOrdersView } from '../components/admin/AdminOrdersView';
import { AdminProductsView } from '../components/admin/AdminProductsView';
import { AdminStoresView } from '../components/admin/AdminStoresView';
import { AdminDropsView } from '../components/admin/AdminDropsView';
import { AdminReviewsView } from '../components/admin/AdminReviewsView';
import { AdminSupportView } from '../components/admin/AdminSupportView';
import { AdminTeamRBACView } from '../components/admin/AdminTeamRBACView';
import { AdminStoreConfigView } from '../components/admin/AdminStoreConfigView';
import { PaymentMethodsManager } from '../components/PaymentMethodsManager';

export const AdminDashboardView: React.FC = () => {
  const {
    themeMode,
    activeAdminModule,
    setActiveAdminModule,
    adminRole,
    customers,
    auditLogs,
    navigateTo,
    isAdminLoggedIn,
    addToast,
  } = useStore();

  const [inspectingCustomer, setInspectingCustomer] = useState<Customer | null>(null);
  const [inspectingAuditPayload, setInspectingAuditPayload] = useState<AuditLog | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [filterProvider, setFilterProvider] = useState<'all' | 'google' | 'email'>('all');
  const [filterRole, setFilterRole] = useState<'all' | 'customer' | 'admin'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');

  const { updateUserRoleAndStatus, deleteCustomer, refreshUsersList } = useStore();

  // Redirect store owner if trying to access unauthorized modules (e.g. customers, stores, settings)
  useEffect(() => {
    if (adminRole === 'store_owner') {
      const allowedModules = ['dashboard', 'orders', 'products'];
      if (!allowedModules.includes(activeAdminModule)) {
        setActiveAdminModule('dashboard');
      }
    }
  }, [adminRole, activeAdminModule, setActiveAdminModule]);

  // Auto-sync real customers when admin panel opens or module switches (only for super_admin)
  useEffect(() => {
    if (isAdminLoggedIn && adminRole === 'super_admin') {
      refreshUsersList();
    }
  }, [isAdminLoggedIn, activeAdminModule, adminRole]);

  // Lock screen if admin is not authenticated
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0e14] text-white p-4 font-sans">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-[#12151c] border border-[#232833] text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
            <Flame className="w-8 h-8 fill-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">Forge Operations</h2>
            <p className="text-xs text-[#9aa4b2] mt-1">
              Enterprise Operations CRM &amp; Encrypted Switchboard
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#181c24] border border-[#232833] text-left text-xs space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Admin Authentication Required</span>
            </div>
            <p className="text-[#9aa4b2] text-[11px] leading-relaxed">
              This area is restricted to authorized Juta.Kapra administrators. Please sign in with an administrator account to continue.
            </p>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => navigateTo('admin-login')}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              Sign In with Staff Passcode
            </button>
            <button
              onClick={() => navigateTo('home')}
              className="w-full py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
            >
              Return to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cardBg = themeMode === 'dark' ? 'bg-[#12151c] border-[#232833]' : 'bg-white border-[#e5e7eb]';
  const textMuted = themeMode === 'dark' ? 'text-[#9aa4b2]' : 'text-[#475569]';

  const nowTime = new Date().getTime();
  const customerAccounts = customers.filter((c) => (c.role || 'customer') !== 'admin');
  const recentSignupsCount = customerAccounts.filter(
    (c) => new Date(c.createdAt).getTime() >= nowTime - 7 * 24 * 60 * 60 * 1000
  ).length;

  const filteredCustomers = customerAccounts.filter((c) => {
    const q = customerSearch.toLowerCase();
    const matchesQuery =
      !customerSearch ||
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      c.id.toLowerCase().includes(q);

    const matchesProvider =
      filterProvider === 'all' ||
      (filterProvider === 'google' && c.authProvider === 'google') ||
      (filterProvider === 'email' && c.authProvider !== 'google');

    const matchesStatus =
      filterStatus === 'all' || (c.status || 'active') === filterStatus;

    return matchesQuery && matchesProvider && matchesStatus;
  });

  return (
    <div className="space-y-6 w-full overflow-x-hidden text-white font-sans">
      {/* 1. DASHBOARD ANALYTICS OVERVIEW */}
      {activeAdminModule === 'dashboard' && <AdminDashboardOverview />}

      {/* 2. ORDERS & TWO-STAGE FULFILLMENT */}
      {activeAdminModule === 'orders' && <AdminOrdersView />}

      {/* 3. PRODUCTS & 1-OF-1 INVENTORY */}
      {activeAdminModule === 'products' && <AdminProductsView />}

      {/* 4. STORES & MULTI-STORE ACCOUNTS */}
      {activeAdminModule === 'stores' && adminRole === 'super_admin' && <AdminStoresView />}

      {/* 5. DROP CALENDAR */}
      {activeAdminModule === 'drops' && adminRole === 'super_admin' && <AdminDropsView />}

      {/* 5. CUSTOMER & USER ACCOUNTS CRM */}
      {activeAdminModule === 'customers' && adminRole === 'super_admin' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" />
                  <span>Customer Directory &amp; Collector Profiles</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                  {customerAccounts.length} Customers
                </span>
              </div>
              <p className={`text-xs mt-1 ${textMuted}`}>
                Customer profiles, order histories, total spending, and delivery contacts registered via Supabase Auth.
              </p>
            </div>

            <button
              onClick={async () => {
                const res = await refreshUsersList();
                if (res?.message) {
                  addToast({
                    type: 'success',
                    title: 'Database Synced',
                    message: res.message,
                  });
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer active:scale-95"
            >
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Sync All Databases</span>
            </button>
          </div>

          {/* User Directory Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-4 rounded-xl border ${cardBg}`}>
              <span className={`text-[11px] font-semibold ${textMuted} block`}>Total Customers</span>
              <span className="text-2xl font-bold font-mono text-white mt-1 block">{customerAccounts.length}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Registered buyer accounts</span>
            </div>
            <div className={`p-4 rounded-xl border ${cardBg}`}>
              <span className={`text-[11px] font-semibold ${textMuted} block`}>New This Week</span>
              <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">+{recentSignupsCount}</span>
              <span className="text-[10px] text-emerald-400/80 mt-1 block">Joined in last 7 days</span>
            </div>
            <div className={`p-4 rounded-xl border ${cardBg}`}>
              <span className={`text-[11px] font-semibold ${textMuted} block`}>Google OAuth Users</span>
              <span className="text-2xl font-bold font-mono text-blue-400 mt-1 block">
                {customerAccounts.filter((c) => c.authProvider === 'google').length}
              </span>
              <span className="text-[10px] text-blue-400/80 mt-1 block">1-click authentication</span>
            </div>
            <div className={`p-4 rounded-xl border ${cardBg}`}>
              <span className={`text-[11px] font-semibold ${textMuted} block`}>Active Customers</span>
              <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
                {customerAccounts.filter((c) => (c.status || 'active') === 'active').length}
              </span>
              <span className="text-[10px] text-emerald-400/80 mt-1 block">Active shopping status</span>
            </div>
          </div>

          {/* Search & Filters Bar */}
          <div className={`p-4 rounded-xl border ${cardBg} space-y-3`}>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Search Bar */}
              <div className="sm:col-span-6 relative">
                <input
                  type="text"
                  placeholder="Search customer by name, email, phone, or ID..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-black/20 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                {customerSearch && (
                  <button
                    onClick={() => setCustomerSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Filter: Auth Provider */}
              <div className="sm:col-span-3">
                <select
                  value={filterProvider}
                  onChange={(e) => setFilterProvider(e.target.value as any)}
                  className="w-full px-2.5 py-2 rounded-lg bg-black/20 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Providers</option>
                  <option value="google">Google OAuth</option>
                  <option value="email">Email &amp; Password</option>
                </select>
              </div>

              {/* Filter: Status */}
              <div className="sm:col-span-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full px-2.5 py-2 rounded-lg bg-black/20 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="suspended">Suspended Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Searchable Customers Table */}
          <div className={`rounded-xl border shadow-sm overflow-hidden ${cardBg}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[850px]">
                <thead className="bg-black/20 border-b border-inherit font-bold uppercase tracking-wider text-[10px] text-slate-400">
                  <tr>
                    <th className="p-3.5">Customer &amp; Contact</th>
                    <th className="p-3.5">Email Address</th>
                    <th className="p-3.5">Auth / Password</th>
                    <th className="p-3.5">Saved Addresses</th>
                    <th className="p-3.5">Total Orders</th>
                    <th className="p-3.5">Total Spent</th>
                    <th className="p-3.5">Created Date</th>
                    <th className="p-3.5">Account Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-inherit font-sans">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No customer accounts found matching your search or filters.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-white/5 transition-colors">
                        {/* Name + Profile Image */}
                        <td className="p-3.5 font-bold text-xs sm:text-sm">
                          <div className="flex items-center space-x-2.5">
                            <img
                              src={
                                c.avatarUrl ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(c.fullName)}&background=0a0a0a&color=fff&size=200&bold=true`
                              }
                              alt={c.fullName}
                              className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                            />
                            <div>
                              <div className="text-white font-bold flex items-center gap-1.5">
                                <span>{c.fullName}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {c.phone || (c.addresses?.[0]?.phone ? c.addresses[0].phone : 'No phone')}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="p-3.5 font-mono text-xs text-slate-200">
                          {c.email}
                        </td>

                        {/* Signup Method & Password */}
                        <td className="p-3.5">
                          {c.authProvider === 'google' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                              </svg>
                              <span>Google OAuth</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span>🔑 Bcrypt Password Active</span>
                            </span>
                          )}
                        </td>

                        {/* Saved Addresses Count */}
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/30 border border-slate-700 text-slate-300">
                            📍 {c.addresses?.length || 0} saved
                          </span>
                        </td>

                        {/* Total Orders */}
                        <td className="p-3.5 font-mono text-xs font-bold text-white">
                          {c.totalOrders || (c.purchaseHistory ? c.purchaseHistory.length : 0)}
                        </td>

                        {/* Total Spent */}
                        <td className="p-3.5 font-mono text-xs font-bold text-emerald-400">
                          {formatPKR(c.lifetimeValue || 0)}
                        </td>

                        {/* Created Date */}
                        <td className="p-3.5 font-mono text-[11px] text-slate-300">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                        </td>

                        {/* Account Status */}
                        <td className="p-3.5">
                          <button
                            type="button"
                            onClick={() => {
                              const nextStatus = c.status === 'suspended' ? 'active' : 'suspended';
                              updateUserRoleAndStatus(c.id, 'customer', nextStatus);
                            }}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                              c.status === 'suspended'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                            }`}
                            title="Click to toggle status"
                          >
                            {c.status === 'suspended' ? '⛔ Suspended' : '✓ Active'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setInspectingCustomer(c)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
                          >
                            Inspect Profile
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. REVIEWS MODERATION */}
      {activeAdminModule === 'reviews' && adminRole === 'super_admin' && <AdminReviewsView />}

      {/* 7. SUPPORT TICKETS */}
      {activeAdminModule === 'support' && adminRole === 'super_admin' && <AdminSupportView />}

      {/* 8. PAYMENT GATEWAYS MANAGER */}
      {activeAdminModule === 'payments' && adminRole === 'super_admin' && <PaymentMethodsManager />}

      {/* 9. AUDIT LOGS */}
      {activeAdminModule === 'audit_logs' && adminRole === 'super_admin' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <div className="flex items-center space-x-2.5">
              <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <span>Security &amp; AES-256 Audit Logs</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                {auditLogs.length} Events
              </span>
            </div>
            <p className={`text-xs mt-1 ${textMuted}`}>
              Immutable cryptographic ledger recording staff sessions, gateway configuration edits, and authorization events.
            </p>
          </div>

          <div className={`rounded-xl border shadow-sm overflow-hidden ${cardBg}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-black/10 dark:bg-white/5 border-b border-inherit font-bold uppercase tracking-wider text-[10px] text-slate-400">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Provider / Layer</th>
                    <th className="p-3.5">Security Action</th>
                    <th className="p-3.5">Transaction ID</th>
                    <th className="p-3.5">Status Code</th>
                    <th className="p-3.5">Operator</th>
                    <th className="p-3.5 text-right">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-inherit font-sans">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="p-3.5 font-mono text-slate-400 text-[11px]">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-3.5 font-bold text-white">{log.provider}</td>
                      <td className="p-3.5 font-mono font-semibold text-blue-400">{log.action}</td>
                      <td className="p-3.5 font-mono text-slate-400">{log.transactionId}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            log.httpStatusCode === 200 || log.httpStatusCode === 201
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {log.httpStatusCode} OK
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300">{log.adminUser}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setInspectingAuditPayload(log)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 transition-colors cursor-pointer"
                        >
                          Inspect JSON
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 10. TEAM RBAC */}
      {activeAdminModule === 'team_rbac' && adminRole === 'super_admin' && <AdminTeamRBACView />}

      {/* 11. STORE CONFIG */}
      {activeAdminModule === 'store_config' && adminRole === 'super_admin' && <AdminStoreConfigView />}

      {/* MODAL: CUSTOMER PROFILE INSPECTION MODAL */}
      {inspectingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-2xl rounded-2xl shadow-2xl border ${cardBg} max-h-[90vh] overflow-y-auto p-6 space-y-6 custom-scrollbar text-white`}>
            <div className="flex items-center justify-between border-b border-inherit pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-lg font-black shadow-md">
                  {inspectingCustomer.avatarUrl ? (
                    <img src={inspectingCustomer.avatarUrl} alt={inspectingCustomer.fullName} className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    inspectingCustomer.fullName.charAt(0)
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold tracking-tight">{inspectingCustomer.fullName}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      inspectingCustomer.accountType === 'AUTO_GUEST'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {inspectingCustomer.accountType === 'AUTO_GUEST' ? '⚡ Auto-Guest' : 'Registered Account'}
                    </span>
                  </div>
                  <p className={`text-xs ${textMuted}`}>Customer ID: {inspectingCustomer.id}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingCustomer(null)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border border-inherit bg-black/20">
                <span className={`text-[10px] uppercase font-bold block ${textMuted}`}>Total Orders</span>
                <span className="text-base font-bold mt-0.5 block">{inspectingCustomer.totalOrders}</span>
              </div>
              <div className="p-3 rounded-xl border border-inherit bg-black/20">
                <span className={`text-[10px] uppercase font-bold block ${textMuted}`}>Lifetime Value</span>
                <span className="text-base font-bold text-emerald-400 mt-0.5 block font-mono">{formatPKR(inspectingCustomer.lifetimeValue)}</span>
              </div>
              <div className="p-3 rounded-xl border border-inherit bg-black/20">
                <span className={`text-[10px] uppercase font-bold block ${textMuted}`}>Auth Method</span>
                <span className="text-xs font-bold mt-0.5 block capitalize">{inspectingCustomer.authProvider || 'email'}</span>
              </div>
              <div className="p-3 rounded-xl border border-inherit bg-black/20">
                <span className={`text-[10px] uppercase font-bold block ${textMuted}`}>Last Active</span>
                <span className="text-xs font-semibold mt-0.5 block">{new Date(inspectingCustomer.lastActivity).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-inherit bg-black/20 space-y-3 text-xs">
              <h4 className="font-bold uppercase text-[11px] text-blue-400 tracking-wider">Contact &amp; Credentials</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className={`text-[10px] block ${textMuted}`}>Email Address</span>
                  <span className="font-mono font-bold text-white break-all">{inspectingCustomer.email}</span>
                </div>
                <div>
                  <span className={`text-[10px] block ${textMuted}`}>Phone Number</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {inspectingCustomer.phone || (inspectingCustomer.addresses?.[0]?.phone ? inspectingCustomer.addresses[0].phone : 'Not provided')}
                  </span>
                </div>
                <div>
                  <span className={`text-[10px] block ${textMuted}`}>Password &amp; Security</span>
                  <span className="inline-flex items-center gap-1 font-mono font-semibold text-xs text-blue-300 mt-0.5">
                    {inspectingCustomer.authProvider === 'google' ? (
                      '🌐 Google OAuth'
                    ) : inspectingCustomer.hasPassword || inspectingCustomer.passwordHash ? (
                      '🔒 Bcrypt Hashed (Permanent)'
                    ) : (
                      '🔑 Account Active'
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold uppercase text-[11px] text-blue-400 tracking-wider">
                Saved Delivery Addresses ({inspectingCustomer.addresses?.length || 0})
              </h4>
              {inspectingCustomer.addresses && inspectingCustomer.addresses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inspectingCustomer.addresses.map((addr) => (
                    <div key={addr.id} className="p-3.5 rounded-xl border border-inherit bg-black/20 text-xs space-y-1 relative">
                      {addr.isDefault && (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Default
                        </span>
                      )}
                      <p className="font-bold text-white">{addr.recipientName || inspectingCustomer.fullName}</p>
                      <p className="text-slate-400 font-mono text-[11px]">📱 {addr.phone || inspectingCustomer.phone}</p>
                      <p className="text-slate-300 mt-1">
                        {addr.address}{addr.apartment ? `, ${addr.apartment}` : ''}
                      </p>
                      <p className={`text-[11px] ${textMuted}`}>
                        {addr.city}, {addr.state} {addr.postalCode} • {addr.country}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-xs ${textMuted} italic p-3 rounded-xl border border-dashed border-inherit`}>
                  No saved delivery addresses found for this profile.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-inherit">
              <button
                onClick={() => setInspectingCustomer(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AUDIT JSON PAYLOAD INSPECTOR */}
      {inspectingAuditPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl border ${cardBg} p-6 space-y-4 text-white font-mono text-xs`}>
            <div className="flex items-center justify-between border-b border-inherit pb-3">
              <div>
                <h3 className="font-bold text-sm text-blue-400">{inspectingAuditPayload.action}</h3>
                <span className="text-[10px] text-slate-400 font-sans">Transaction: {inspectingAuditPayload.transactionId}</span>
              </div>
              <button onClick={() => setInspectingAuditPayload(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-black/50 border border-slate-700 overflow-x-auto max-h-72">
              <pre className="text-[11px] text-emerald-400 whitespace-pre-wrap font-mono">
                {JSON.stringify(
                  {
                    id: inspectingAuditPayload.id,
                    provider: inspectingAuditPayload.provider,
                    action: inspectingAuditPayload.action,
                    timestamp: inspectingAuditPayload.timestamp,
                    adminUser: inspectingAuditPayload.adminUser,
                    httpStatusCode: inspectingAuditPayload.httpStatusCode,
                    payload: inspectingAuditPayload.payload,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectingAuditPayload(null)}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
