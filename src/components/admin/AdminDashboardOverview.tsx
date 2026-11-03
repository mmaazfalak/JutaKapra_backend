import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Truck,
  CheckCircle2,
  ArrowUpRight,
  Activity,
  Calendar,
  AlertCircle,
  Package,
  LifeBuoy,
  CreditCard,
  ChevronRight,
  Info,
  ShieldCheck,
  Flame,
  Store,
  Percent,
  Sparkles,
  Plus,
  ExternalLink,
  MapPin,
  Clock,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatPKR } from '../../utils/format';
import { OrderFulfillmentModal } from '../OrderFulfillmentModal';
import { Order } from '../../types';

export const AdminDashboardOverview: React.FC = () => {
  const {
    orders,
    products,
    supportTickets,
    auditLogs,
    paymentGateways,
    customers,
    stores,
    adminRole,
    currentStoreId,
    themeMode,
    navigateTo,
    setActiveAdminModule,
    confirmOrder,
  } = useStore();

  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | 'all'>('7d');
  const [dispatchOrderModal, setDispatchOrderModal] = useState<Order | null>(null);

  const cardBg = themeMode === 'dark' ? 'bg-[#12151c] border-[#232833]' : 'bg-white border-slate-200';
  const textMuted = themeMode === 'dark' ? 'text-[#9aa4b2]' : 'text-[#475569]';

  const isStoreOwner = adminRole === 'store_owner';
  const activeStore = stores.find((s) => s.id === currentStoreId) || stores[0];
  const commissionRate = activeStore?.commissionRate !== undefined ? activeStore.commissionRate : 10;

  // Store-scoped products & orders
  const storeProducts = products.filter((p) => (p.storeId || 'store-main') === (currentStoreId || activeStore?.id));
  const storeOrders = orders.filter((o) =>
    o.items.some((item) => (item.product.storeId || 'store-main') === (currentStoreId || activeStore?.id))
  );

  // Store financial calculations
  const storeGrossSales = storeOrders.reduce((sum, o) => {
    // calculate total of items belonging to this store
    const storeItemTotal = o.items
      .filter((item) => (item.product.storeId || 'store-main') === (currentStoreId || activeStore?.id))
      .reduce((s, it) => s + it.product.price * it.quantity, 0);
    return sum + storeItemTotal;
  }, 0);

  const storeCommissionFee = Math.round(storeGrossSales * (commissionRate / 100));
  const storeNetPayout = storeGrossSales - storeCommissionFee;

  const storePendingOrders = storeOrders.filter((o) => o.status === 'Processing' || o.status === 'Pending');
  const storeInTransitOrders = storeOrders.filter((o) => o.status === 'Dispatched to Courier');
  const storeDeliveredOrders = storeOrders.filter((o) => o.status === 'Delivered');

  // Master Admin calculations
  const now = new Date().getTime();
  const totalUsersCount = customers.length;
  const newUsersCount = useMemo(() => {
    return customers.filter((c) => {
      const createdTime = new Date(c.createdAt).getTime();
      if (dateRange === 'today') return createdTime >= now - 24 * 60 * 60 * 1000;
      if (dateRange === '7d') return createdTime >= now - 7 * 24 * 60 * 60 * 1000;
      if (dateRange === '30d') return createdTime >= now - 30 * 24 * 60 * 60 * 1000;
      return true;
    }).length;
  }, [customers, dateRange, now]);

  const googleUsersCount = customers.filter((c) => c.authProvider === 'google').length;
  const emailUsersCount = customers.filter((c) => c.authProvider !== 'google').length;

  // Filter orders by date range for master admin
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderTime = new Date(o.createdAt).getTime();
      if (dateRange === 'today') return orderTime >= now - 24 * 60 * 60 * 1000;
      if (dateRange === '7d') return orderTime >= now - 7 * 24 * 60 * 60 * 1000;
      if (dateRange === '30d') return orderTime >= now - 30 * 24 * 60 * 60 * 1000;
      return true;
    });
  }, [orders, dateRange, now]);

  const totalRevenue = filteredOrders.reduce((acc, o) => acc + o.total, 0);
  const processingCount = filteredOrders.filter((o) => o.status === 'Processing' || o.status === 'Pending').length;
  const inTransitCount = filteredOrders.filter((o) => o.status === 'Dispatched to Courier').length;
  const completedCount = filteredOrders.filter((o) => o.status === 'Delivered').length;

  // =========================================================================
  // 1. DEDICATED STORE OWNER OVERVIEW (ISOLATED & WITH COMPANY COMMISSION)
  // =========================================================================
  if (isStoreOwner && activeStore) {
    return (
      <div className="space-y-6 animate-fade-in font-sans text-white">
        {/* Store Welcome Banner */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-950/40 to-slate-900 border border-blue-500/30 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-xl shadow-md">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-black text-white tracking-tight">{activeStore.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Store Active
                  </span>
                </div>
                <p className={`text-xs flex items-center gap-2 mt-0.5 ${textMuted}`}>
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeStore.city || 'Pakistan'}</span>
                  <span>•</span>
                  <span>Owner: <strong>{activeStore.ownerName}</strong> ({activeStore.ownerEmail})</span>
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveAdminModule('products')}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/25 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Product</span>
              </button>
              <button
                onClick={() => setActiveAdminModule('orders')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Store Orders ({storeOrders.length})</span>
              </button>
            </div>
          </div>

          {/* Company Commission Highlight Banner */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5 text-blue-300">
              <Percent className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <span className="font-bold text-white">Company Commission Rate: {commissionRate}%</span>
                <p className="text-[11px] text-blue-200/70">
                  Fixed platform commission rate set by Juta.Kapra administration. Automatically deducted from store payouts.
                </p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-500/40 font-mono font-bold text-blue-300 text-xs self-start sm:self-auto">
              Fee: {commissionRate}% per sale
            </div>
          </div>
        </div>

        {/* Financial & Inventory KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Gross Store Sales */}
          <div className={`p-4 rounded-xl border shadow-sm ${cardBg}`}>
            <span className={`text-xs font-semibold ${textMuted} block`}>Gross Store Sales</span>
            <h4 className="text-2xl font-bold font-mono text-white mt-1">
              {formatPKR(storeGrossSales)}
            </h4>
            <span className="text-[10px] text-slate-400 mt-1 block">Total sales from your products</span>
          </div>

          {/* 2. Company Commission Deducted */}
          <div className={`p-4 rounded-xl border shadow-sm ${cardBg} border-amber-500/20`}>
            <span className={`text-xs font-semibold text-amber-400 block`}>Company Commission ({commissionRate}%)</span>
            <h4 className="text-2xl font-bold font-mono text-amber-400 mt-1">
              {formatPKR(storeCommissionFee)}
            </h4>
            <span className="text-[10px] text-amber-400/70 mt-1 block">Platform service fee</span>
          </div>

          {/* 3. Net Store Payout */}
          <div className={`p-4 rounded-xl border shadow-sm ${cardBg} border-emerald-500/20 bg-emerald-500/5`}>
            <span className={`text-xs font-semibold text-emerald-400 block`}>Net Store Payout</span>
            <h4 className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {formatPKR(storeNetPayout)}
            </h4>
            <span className="text-[10px] text-emerald-400/80 mt-1 block">Available for vendor payout</span>
          </div>

          {/* 4. Active Products in Store */}
          <div className={`p-4 rounded-xl border shadow-sm ${cardBg}`}>
            <span className={`text-xs font-semibold ${textMuted} block`}>Live Products in Store</span>
            <h4 className="text-2xl font-bold font-mono text-blue-400 mt-1">
              {storeProducts.length} Items
            </h4>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {storeProducts.filter((p) => p.inStock).length} in stock • {storeProducts.filter((p) => !p.inStock).length} sold out
            </span>
          </div>
        </div>

        {/* Store Fulfillment Status Pipeline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className={`p-4 rounded-xl border ${cardBg} border-amber-500/20`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Pending Dispatch
              </span>
              <span className="text-xl font-bold font-mono text-amber-400">{storePendingOrders.length}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Orders requiring courier handover</p>
          </div>

          <div className={`p-4 rounded-xl border ${cardBg} border-blue-500/20`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" /> Dispatched / In Transit
              </span>
              <span className="text-xl font-bold font-mono text-blue-400">{storeInTransitOrders.length}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">With Trax / Leopard / TCS</p>
          </div>

          <div className={`p-4 rounded-xl border ${cardBg} border-emerald-500/20`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Completed Deliveries
              </span>
              <span className="text-xl font-bold font-mono text-emerald-400">{storeDeliveredOrders.length}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Successfully fulfilled</p>
          </div>
        </div>

        {/* Recent Store Orders Section */}
        <div className={`p-5 rounded-2xl border shadow-sm ${cardBg} space-y-4`}>
          <div className="flex items-center justify-between border-b border-inherit pb-3">
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-400" />
                <span>Recent Orders for {activeStore.name}</span>
              </h4>
              <p className={`text-xs mt-0.5 ${textMuted}`}>
                Manage and dispatch orders containing your listed products.
              </p>
            </div>
            <button
              onClick={() => setActiveAdminModule('orders')}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Store Orders</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {storeOrders.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No orders received yet for {activeStore.name}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-black/20 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Order #</th>
                    <th className="p-3">Customer &amp; City</th>
                    <th className="p-3">Items in Order</th>
                    <th className="p-3">Store Portion</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-inherit">
                  {storeOrders.slice(0, 5).map((o) => {
                    const storeItems = o.items.filter(
                      (item) => (item.product.storeId || 'store-main') === activeStore.id
                    );
                    const storePortionTotal = storeItems.reduce(
                      (s, it) => s + it.product.price * it.quantity,
                      0
                    );

                    return (
                      <tr key={o.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 font-mono font-bold text-white">#{o.orderNumber}</td>
                        <td className="p-3">
                          <span className="font-semibold text-white block">{o.customer.fullName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{o.customer.city}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-medium text-slate-300">
                            {storeItems.map((it) => it.product.title).join(', ') || `${storeItems.length} items`}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-400">
                          {formatPKR(storePortionTotal)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              o.status === 'Delivered'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : o.status === 'Dispatched to Courier'
                                ? 'bg-blue-500/15 text-blue-400'
                                : 'bg-amber-500/15 text-amber-400'
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {o.status === 'Processing' || o.status === 'Pending' ? (
                            <button
                              onClick={() => setDispatchOrderModal(o)}
                              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
                            >
                              Dispatch Order
                            </button>
                          ) : (
                            <button
                              onClick={() => setActiveAdminModule('orders')}
                              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors cursor-pointer"
                            >
                              View Details
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Courier Fulfillment Modal */}
        {dispatchOrderModal && (
          <OrderFulfillmentModal
            order={dispatchOrderModal}
            onClose={() => setDispatchOrderModal(null)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. MASTER ADMIN OVERVIEW (SUPER ADMIN WITH PLATFORM TELEMETRY & STORES)
  // =========================================================================
  return (
    <div className="space-y-6 animate-fade-in font-sans text-white">
      {/* Header + Date Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span>Master Admin Operations &amp; Revenue Telemetry</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              Root Level
            </span>
          </div>
          <p className={`text-xs mt-1 ${textMuted}`}>
            Unified platform metrics, store account management, vendor commission tracking, and courier pipeline.
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-black/20 border border-inherit">
          {(['today', '7d', '30d', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer capitalize ${
                dateRange === r ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Master KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className={`p-4 rounded-xl border shadow-sm ${cardBg}`}>
          <span className={`text-xs font-medium ${textMuted}`}>Gross Platform Sales</span>
          <h4 className="text-2xl font-bold font-mono text-white mt-1">
            {formatPKR(totalRevenue)}
          </h4>
          <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">Live across all stores</span>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${cardBg}`}>
          <span className={`text-xs font-medium ${textMuted}`}>Registered Stores</span>
          <h4 className="text-2xl font-bold font-mono text-blue-400 mt-1">
            {stores.length}
          </h4>
          <span className="text-[10px] text-blue-400/80 mt-1 block">
            {stores.filter((s) => !s.isHidden).length} live • {stores.filter((s) => s.isHidden).length} hidden
          </span>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${cardBg}`}>
          <span className={`text-xs font-medium ${textMuted}`}>Active Catalog Pieces</span>
          <h4 className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {products.length} Items
          </h4>
          <span className="text-[10px] text-amber-400/80 mt-1 block">1-of-1 thrift &amp; multi-stock</span>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${cardBg}`}>
          <span className={`text-xs font-medium ${textMuted}`}>Registered Customers</span>
          <h4 className="text-2xl font-bold font-mono text-white mt-1">
            {totalUsersCount}
          </h4>
          <span className="text-[10px] text-emerald-400 mt-1 block font-mono">+{newUsersCount} this period</span>
        </div>
      </div>

      {/* Stores Breakdown Quick Rail */}
      <div className={`p-5 rounded-2xl border ${cardBg} space-y-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Store className="w-4 h-4 text-blue-400" />
              <span>Stores &amp; Company Commission Overview</span>
            </h4>
            <p className={`text-xs mt-0.5 ${textMuted}`}>
              Track vendor inventory, platform commission rates, and manage store visibility.
            </p>
          </div>
          <button
            onClick={() => setActiveAdminModule('stores')}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
          >
            Manage All Stores
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stores.map((st) => {
            const stProducts = products.filter((p) => (p.storeId || 'store-main') === st.id);
            const stCommRate = st.commissionRate !== undefined ? st.commissionRate : 10;
            return (
              <div key={st.id} className="p-3.5 rounded-xl bg-black/20 border border-inherit space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white truncate max-w-[130px]">{st.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
                    {stCommRate}% Comm
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{st.city || 'Pakistan'}</span>
                  <span className="font-mono text-emerald-400 font-semibold">{stProducts.length} items</span>
                </div>
                <div className="pt-1 border-t border-inherit flex items-center justify-between text-[10px] text-slate-400">
                  <span className="truncate">Owner: {st.ownerName}</span>
                  <span className={st.isHidden ? 'text-amber-400' : 'text-emerald-400'}>
                    {st.isHidden ? 'Hidden' : 'Live'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Orders Pipeline */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className={`p-4 rounded-xl border ${cardBg} border-amber-500/20`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Processing Orders
            </span>
            <span className="text-xl font-bold font-mono text-amber-400">{processingCount}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Pending dispatch to courier</p>
        </div>

        <div className={`p-4 rounded-xl border ${cardBg} border-blue-500/20`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" /> Dispatched Orders
            </span>
            <span className="text-xl font-bold font-mono text-blue-400">{inTransitCount}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Active transit status</p>
        </div>

        <div className={`p-4 rounded-xl border ${cardBg} border-emerald-500/20`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Delivered Orders
            </span>
            <span className="text-xl font-bold font-mono text-emerald-400">{completedCount}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Successfully fulfilled</p>
        </div>
      </div>
    </div>
  );
};
