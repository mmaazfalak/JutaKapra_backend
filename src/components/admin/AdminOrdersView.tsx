import React, { useState } from 'react';
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ArrowUpDown,
  Printer,
  ExternalLink,
  MessageCircle,
  Mail,
  Phone,
  AlertTriangle,
  FileText,
  ChevronRight,
  Package,
  XCircle,
  X,
  Store,
  MapPin,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus } from '../../types';
import { formatPKR } from '../../utils/format';
import { OrderFulfillmentModal } from '../OrderFulfillmentModal';

export const AdminOrdersView: React.FC = () => {
  const {
    orders,
    confirmOrder,
    completeOrderDelivery,
    stores,
    adminRole,
    currentStoreId,
    themeMode,
    navigateTo,
    addToast,
  } = useStore();

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [storeFilter, setStoreFilter] = useState<string>(currentStoreId || 'all');
  const [sortBy, setSortBy] = useState<'newest' | 'urgency' | 'value'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [dispatchModalOrder, setDispatchModalOrder] = useState<Order | null>(null);
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);

  const isDark = themeMode === 'dark';
  const cardBg = isDark ? 'bg-[#12151c] border-[#232833]' : 'bg-white border-slate-200';
  const inputBg = isDark ? 'bg-[#181c24] border-[#232833] text-white' : 'bg-white border-slate-200 text-slate-900';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-[#9aa4b2]' : 'text-slate-500';
  const subCardBg = isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-200/80';

  const isStoreOwner = adminRole === 'store_owner' && !!currentStoreId;
  const activeStoreAccount = stores.find((s) => s.id === (isStoreOwner ? currentStoreId : storeFilter));

  // Filter orders by store scope
  const storeScopedOrders = orders.filter((ord) => {
    if (isStoreOwner) {
      return ord.items.some(
        (it) => (it.product.storeId || 'store-main') === currentStoreId
      );
    }
    if (storeFilter !== 'all') {
      return ord.items.some(
        (it) => (it.product.storeId || 'store-main') === storeFilter
      );
    }
    return true;
  });

  // Order sorting & filtering
  const filteredOrders = storeScopedOrders
    .filter((ord) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.customer.fullName.toLowerCase().includes(q) ||
        ord.customer.email.toLowerCase().includes(q) ||
        ord.customer.phone.toLowerCase().includes(q) ||
        (ord.trackingNumber && ord.trackingNumber.toLowerCase().includes(q)) ||
        (ord.courierTracking?.trackingNumber && ord.courierTracking.trackingNumber.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === 'All') return true;
      if (statusFilter === 'Processing') return ord.status === 'Processing' || ord.status === 'Pending';
      if (statusFilter === 'In Transit') return ord.status === 'Dispatched to Courier';
      if (statusFilter === 'Delivered') return ord.status === 'Delivered';
      if (statusFilter === 'Cancelled') return ord.status === 'Cancelled';
      if (statusFilter === 'Payment Pending') return ord.paymentMethod === 'cod' && ord.status !== 'Delivered';

      return ord.status === statusFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'value') {
        return b.total - a.total;
      }
      if (sortBy === 'urgency') {
        const rank = (status: OrderStatus) =>
          status === 'Processing' || status === 'Pending' ? 0 : status === 'Dispatched to Courier' ? 1 : 2;
        return rank(a.status) - rank(b.status);
      }
      return 0;
    });

  const processingCount = storeScopedOrders.filter((o) => o.status === 'Processing' || o.status === 'Pending').length;
  const inTransitCount = storeScopedOrders.filter((o) => o.status === 'Dispatched to Courier').length;
  const deliveredCount = storeScopedOrders.filter((o) => o.status === 'Delivered').length;

  return (
    <div className="space-y-6 animate-fade-in font-sans text-white">
      {/* STORE OWNER SCOPE BANNER */}
      {isStoreOwner && activeStoreAccount && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-blue-900/40 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-white">Orders for: {activeStoreAccount.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Store Owner Access
                </span>
              </div>
              <p className="text-xs text-blue-200/70 mt-0.5">
                You are managing orders that include products from <strong>{activeStoreAccount.name}</strong>. Dispatch couriers and add tracking numbers directly.
              </p>
            </div>
          </div>
          <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-black/40 border border-blue-500/20 text-blue-300 self-start sm:self-auto">
            {storeScopedOrders.length} Total Store Orders
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-500" />
              <span>{isStoreOwner ? 'Store Order Fulfillment & Courier Dispatch' : 'Two-Stage Courier Dispatch Pipeline'}</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              {processingCount} Awaiting Dispatch
            </span>
          </div>
          <p className={`text-xs mt-1 ${textMuted}`}>
            Step 1: Confirm order &amp; assign mandatory courier tracking ID • Step 2: Auto-sync delivery confirmation with archival.
          </p>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className={`p-4 rounded-xl border shadow-sm ${cardBg} border-amber-500/20`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${textMuted}`}>Stage 1: Processing Orders</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h4 className="text-2xl font-bold text-amber-400 font-mono">{processingCount}</h4>
            <span className="text-[10px] font-bold text-amber-400">Mandatory Tracking ID Required</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${cardBg} border-blue-500/20`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${textMuted}`}>Stage 2: In Transit / Rider Out</span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Truck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h4 className="text-2xl font-bold text-blue-400 font-mono">{inTransitCount}</h4>
            <span className="text-[10px] font-bold text-blue-400">With TCS / Leopards / Trax</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${cardBg} border-emerald-500/20`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${textMuted}`}>Archived: Delivered</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h4 className="text-2xl font-bold text-emerald-400 font-mono">{deliveredCount}</h4>
            <span className="text-[10px] font-bold text-emerald-400">Delivered &amp; Paid</span>
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Store Filter, Status & Sorting */}
      <div className={`p-3.5 rounded-xl border shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3 ${cardBg}`}>
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, customer, phone, tracking..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-inherit bg-transparent text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
          {/* Store Selector (Master Admin Only) */}
          {!isStoreOwner && (
            <div className="flex items-center space-x-1.5">
              <Store className="w-3.5 h-3.5 text-blue-400" />
              <select
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
                className={`${inputBg} rounded-lg px-2.5 py-1.5 text-xs outline-none cursor-pointer`}
              >
                <option value="all">All Stores ({orders.length})</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter Buttons */}
          <div className="flex items-center space-x-1 overflow-x-auto">
            {['All', 'Processing', 'In Transit', 'Delivered', 'Payment Pending'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'bg-black/20 dark:bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`${inputBg} rounded-lg px-2.5 py-1.5 text-xs outline-none cursor-pointer`}
            >
              <option value="newest">Newest Order</option>
              <option value="urgency">Delivery Urgency</option>
              <option value="value">Highest Order Value</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className={`rounded-xl border shadow-sm overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[850px]">
            <thead className="bg-black/10 dark:bg-white/5 border-b border-inherit font-bold uppercase tracking-wider text-[10px] text-slate-400">
              <tr>
                <th className="p-3.5">Order #</th>
                <th className="p-3.5">Customer &amp; Contact</th>
                <th className="p-3.5">Store Pieces</th>
                <th className="p-3.5">Total &amp; Payment</th>
                <th className="p-3.5">Fulfillment Stage</th>
                <th className="p-3.5">Courier Tracking</th>
                <th className="p-3.5 text-right">Dispatch Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inherit font-sans">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <ShoppingBag className="w-8 h-8 mx-auto text-slate-500" />
                      <p className="font-bold text-white text-sm">No orders matching criteria</p>
                      <p className="text-xs text-slate-400">
                        {statusFilter === 'Processing'
                          ? 'All clear! No pending orders awaiting courier dispatch.'
                          : 'Try changing your search keywords or status filter tabs.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const isProcessing = ord.status === 'Processing' || ord.status === 'Pending';
                  const isConfirmed = (ord.status as string) === 'Confirmed';
                  const isInTransit = ord.status === 'Dispatched to Courier';
                  const isDelivered = ord.status === 'Delivered';

                  // Filter items to show store items
                  const relevantItems = isStoreOwner
                    ? ord.items.filter((it) => (it.product.storeId || 'store-main') === currentStoreId)
                    : ord.items;

                  return (
                    <tr
                      key={ord.id}
                      onClick={() => setInspectingOrder(ord)}
                      className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {/* Order Number */}
                      <td className="p-3.5 font-mono font-bold text-blue-400">
                        {ord.orderNumber}
                        <span className="block text-[10px] text-slate-500 font-sans font-normal">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Customer Details & Contact Shortcuts */}
                      <td className="p-3.5">
                        <div className="font-semibold text-white">{ord.customer.fullName}</div>
                        <div className={`text-[11px] ${textMuted}`}>{ord.customer.city}, {ord.customer.country}</div>
                        <div className="flex items-center space-x-2 mt-1" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={`https://wa.me/${ord.customer.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold flex items-center gap-1"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-2.5 h-2.5" />
                            <span>WhatsApp</span>
                          </a>
                          <a
                            href={`mailto:${ord.customer.email}`}
                            className="p-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[10px] font-bold flex items-center gap-1"
                            title="Send Email"
                          >
                            <Mail className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </td>

                      {/* Thrift Items */}
                      <td className="p-3.5">
                        {relevantItems.map((it, idx) => (
                          <div key={idx} className="truncate max-w-[220px] text-xs">
                            <span className="font-bold text-white">{it.quantity}x</span> {it.product.title}{' '}
                            <span className="text-slate-400 font-mono">({it.selectedSize})</span>
                          </div>
                        ))}
                      </td>

                      {/* Total & Payment */}
                      <td className="p-3.5">
                        <div className="font-bold text-white font-mono">{formatPKR(ord.total)}</div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {ord.paymentMethod}
                        </span>
                      </td>

                      {/* Fulfillment Stage */}
                      <td className="p-3.5">
                        {isProcessing && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                            ⚡ Pending Dispatch
                          </span>
                        )}
                        {isConfirmed && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            ✓ Confirmed
                          </span>
                        )}
                        {isInTransit && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            🚚 In Transit
                          </span>
                        )}
                        {isDelivered && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ✓ Delivered
                          </span>
                        )}
                        {ord.status === 'Cancelled' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                            ✕ Cancelled
                          </span>
                        )}
                      </td>

                      {/* Courier Tracking */}
                      <td className="p-3.5">
                        {ord.courierTracking?.trackingNumber || ord.trackingNumber ? (
                          <div>
                            <span className="font-bold text-blue-400 block text-[11px]">
                              {ord.courierTracking?.courierName || ord.courier || 'TCS Express'}
                            </span>
                            <a
                              href={ord.courierTracking?.trackingUrl || '#'}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="font-mono text-emerald-400 hover:underline text-[10px] flex items-center gap-1"
                            >
                              <span>{ord.courierTracking?.trackingNumber || ord.trackingNumber}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">No Tracking Assigned</span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isProcessing && (
                            <button
                              onClick={() => confirmOrder(ord.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-bold text-xs transition-colors cursor-pointer flex items-center space-x-1"
                              title="Confirm order & dispatch customer notification"
                            >
                              <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                              <span>Confirm</span>
                            </button>
                          )}
                          {(isProcessing || isConfirmed) && (
                            <button
                              onClick={() => setDispatchModalOrder(ord)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-blue-600/20 flex items-center space-x-1.5"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Dispatch</span>
                            </button>
                          )}
                          {isInTransit && (
                            <button
                              onClick={() => completeOrderDelivery(ord.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 ml-auto"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Delivered</span>
                            </button>
                          )}
                          {isDelivered && (
                            <button
                              onClick={() => window.print()}
                              className="p-1.5 rounded-lg border border-inherit hover:bg-slate-500/10 text-slate-400 hover:text-white ml-auto cursor-pointer"
                              title="Print Waybill"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandatory Courier Fulfillment Modal */}
      {dispatchModalOrder && (
        <OrderFulfillmentModal
          order={dispatchModalOrder}
          onClose={() => setDispatchModalOrder(null)}
        />
      )}

      {/* Order Timeline & Inspection Modal */}
      {inspectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-2xl rounded-2xl shadow-2xl border ${cardBg} max-h-[92vh] overflow-y-auto p-6 space-y-6 custom-scrollbar ${textPrimary}`}>
            <div className="flex items-center justify-between border-b border-inherit pb-4">
              <div>
                <span className="text-xs font-mono text-blue-400 font-bold block">{inspectingOrder.orderNumber}</span>
                <h3 className="text-lg font-bold">Order Details &amp; Courier Timeline</h3>
              </div>
              <button onClick={() => setInspectingOrder(null)} className={`p-1 rounded-lg ${textMuted} hover:${textPrimary}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Timeline */}
            <div className={`p-4 rounded-xl ${subCardBg} border space-y-3`}>
              <span className={`text-[10px] uppercase font-bold tracking-wider block ${textMuted}`}>
                Two-Stage Fulfillment Progress:
              </span>
              <div className="flex items-center justify-between text-xs relative">
                <div className="flex flex-col items-center z-10">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">✓</div>
                  <span className="text-[10px] font-bold mt-1">Order Placed</span>
                </div>
                <div className="flex-1 h-0.5 bg-emerald-600/50 mx-2" />
                <div className="flex flex-col items-center z-10">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    inspectingOrder.status === 'Dispatched to Courier' || inspectingOrder.status === 'Delivered'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-white animate-pulse'
                  }`}>
                    {inspectingOrder.status === 'Dispatched to Courier' || inspectingOrder.status === 'Delivered' ? '✓' : '2'}
                  </div>
                  <span className="text-[10px] font-bold mt-1">Dispatched</span>
                </div>
                <div className="flex-1 h-0.5 bg-slate-700 mx-2" />
                <div className="flex flex-col items-center z-10">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    inspectingOrder.status === 'Delivered' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {inspectingOrder.status === 'Delivered' ? '✓' : '3'}
                  </div>
                  <span className="text-[10px] font-bold mt-1">Delivered</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">Delivery Destination</h4>
              <div className={`p-4 rounded-xl ${subCardBg} border text-xs space-y-1`}>
                <p className="font-bold text-white text-sm">{inspectingOrder.customer.fullName}</p>
                <p className="text-slate-300">{inspectingOrder.customer.address}</p>
                <p className={`text-[11px] ${textMuted}`}>{inspectingOrder.customer.city}, {inspectingOrder.customer.country}</p>
                <p className="text-emerald-400 font-mono text-[11px] pt-1">📱 {inspectingOrder.customer.phone}</p>
              </div>
            </div>

            {/* Order Items Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">Order Items</h4>
              <div className={`rounded-xl ${subCardBg} border divide-y divide-inherit`}>
                {inspectingOrder.items.map((it, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <img src={it.product.images[0]} alt={it.product.title} className="w-10 h-10 rounded-lg object-cover bg-slate-800" />
                      <div>
                        <p className="font-bold text-white">{it.product.title}</p>
                        <p className={`text-[11px] ${textMuted}`}>Size: {it.selectedSize} • Era: {it.product.era}</p>
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold">
                      <span className="text-slate-400 text-[11px] mr-2">{it.quantity}x</span>
                      <span className="text-white">{formatPKR(it.product.price * it.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-inherit">
              <button
                onClick={() => setInspectingOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
