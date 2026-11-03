import React, { useState } from 'react';
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Printer,
  Package,
  ArrowLeft,
  ShieldCheck,
  Search,
  X,
  UserCheck,
  Copy,
  Check,
  MapPin,
  ChevronRight,
  AlertCircle,
  FileText,
  Calendar,
  CreditCard,
  Phone,
  Sparkles,
  ArrowUpRight,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { formatPKR } from '../utils/format';
import { Order, OrderStatus } from '../types';

export const CustomerOrdersView: React.FC = () => {
  const { orders, currentCustomer, profile, navigateTo, openAuthModal, addToast } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'processing' | 'dispatched' | 'delivered'>('all');
  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);

  const cleanQuery = searchQuery.trim().toLowerCase();

  // Strict Privacy & Order Association:
  let userOrders: Order[] = [];

  const activeUserEmail = profile?.email || currentCustomer?.email;
  const activeUserId = profile?.id || currentCustomer?.id;

  if (activeUserEmail || activeUserId) {
    userOrders = orders.filter(
      (o) =>
        (activeUserId && o.customerId === activeUserId) ||
        (activeUserEmail && o.customer?.email && o.customer.email.toLowerCase() === activeUserEmail.toLowerCase())
    );
  } else if (cleanQuery) {
    userOrders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase() === cleanQuery ||
        o.orderNumber.toLowerCase().includes(cleanQuery) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase() === cleanQuery) ||
        (o.courierTracking?.trackingNumber && o.courierTracking.trackingNumber.toLowerCase() === cleanQuery)
    );
  } else {
    userOrders = [];
  }

  // Search filter
  if ((activeUserEmail || activeUserId) && cleanQuery) {
    userOrders = userOrders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(cleanQuery) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(cleanQuery)) ||
        (o.courierTracking?.trackingNumber && o.courierTracking.trackingNumber.toLowerCase().includes(cleanQuery)) ||
        (o.courierTracking?.courierName && o.courierTracking.courierName.toLowerCase().includes(cleanQuery)) ||
        o.items.some((it) => it.product.title.toLowerCase().includes(cleanQuery))
    );
  }

  // Filter tabs
  const processingOrders = userOrders.filter((o) => o.status === 'Processing' || o.status === 'Pending');
  const dispatchedOrders = userOrders.filter((o) => o.status === 'Dispatched to Courier');
  const deliveredOrders = userOrders.filter((o) => o.status === 'Delivered');

  const displayOrders =
    activeTab === 'processing'
      ? processingOrders
      : activeTab === 'dispatched'
      ? dispatchedOrders
      : activeTab === 'delivered'
      ? deliveredOrders
      : userOrders;

  const handleCopyTracking = (trackingNum: string) => {
    navigator.clipboard.writeText(trackingNum);
    setCopiedTrackingId(trackingNum);
    addToast({
      type: 'info',
      title: 'Tracking Code Copied',
      message: `${trackingNum} copied to your clipboard.`,
      duration: 2500,
    });
    setTimeout(() => {
      setCopiedTrackingId(null);
    }, 2000);
  };

  const handlePrintReceipt = (_orderNumber: string) => {
    window.print();
  };

  const getStatusStepIndex = (status: OrderStatus | string): number => {
    const s = String(status || '').toLowerCase().trim();
    if (s === 'pending' || s === 'order placed' || s === 'placed') {
      return 0;
    }
    if (s === 'confirmed' || s === 'processing' || s === 'verified' || s === 'packed') {
      return 1;
    }
    if (s === 'dispatched to courier' || s === 'dispatched' || s === 'in transit' || s === 'shipped' || s === 'on road') {
      return 2;
    }
    if (s === 'delivered' || s === 'completed') {
      return 3;
    }
    if (s === 'cancelled') {
      return -1;
    }
    return 0;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 font-sans space-y-8 text-[#0a0a0a]">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/90 pb-6">
        <div className="space-y-1">
          <button
            onClick={() => navigateTo('shop')}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-neutral-500 hover:text-[#0a0a0a] transition-colors cursor-pointer mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Store Catalog</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0a0a0a]">
            Orders &amp; Live Tracking
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500">
            Real-time courier updates, provenance authentication, and dispatch logs.
          </p>
        </div>

        {/* User Context & Actions */}
        {currentCustomer || profile ? (
          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-neutral-50 border border-neutral-200/90 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-[#0a0a0a] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {(profile?.full_name || currentCustomer?.fullName || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 pr-2">
              <span className="font-bold text-xs text-[#0a0a0a] block truncate">
                {profile?.full_name || currentCustomer?.fullName}
              </span>
              <span className="text-[10px] text-neutral-500 font-mono block truncate">
                {profile?.email || currentCustomer?.email}
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={() => openAuthModal('signin')}
            className="h-10 px-4 rounded-xl bg-[#0a0a0a] hover:bg-[#e5341f] text-white font-bold text-xs transition-colors cursor-pointer flex items-center space-x-2 shadow-xs"
          >
            <UserCheck className="w-4 h-4" />
            <span>Sign In for Full History</span>
          </button>
        )}
      </div>

      {/* Quick Search & Filter Bar */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order # (e.g. FS-99120), Tracking #, item name, or courier..."
              className="w-full pl-10 pr-10 py-2.5 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 focus:border-[#0a0a0a] rounded-xl text-xs text-[#0a0a0a] placeholder-neutral-400 focus:outline-none focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 rounded-md text-neutral-400 hover:text-[#0a0a0a] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status Tab Pills */}
        {userOrders.length > 0 && (
          <div className="flex items-center space-x-1.5 pt-2 border-t border-neutral-100 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-[#0a0a0a] text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
              }`}
            >
              All Orders ({userOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('processing')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'processing'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
              }`}
            >
              ⚡ Processing ({processingOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('dispatched')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'dispatched'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
              }`}
            >
              🚀 Dispatched ({dispatchedOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('delivered')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'delivered'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
              }`}
            >
              ✅ Delivered ({deliveredOrders.length})
            </button>
          </div>
        )}
      </div>

      {/* Orders List / Empty State */}
      {displayOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-neutral-200/90 rounded-2xl p-10 sm:p-14 text-center space-y-4 shadow-xs"
        >
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
            <Package className="w-8 h-8" />
          </div>

          {currentCustomer || profile ? (
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-base font-bold text-[#0a0a0a]">No orders found</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                {cleanQuery
                  ? `No orders matching "${searchQuery}" in your order directory.`
                  : 'You have not placed any orders under this account yet. Explore the archival vault to acquire your first 1-of-1 piece.'}
              </p>
              <button
                onClick={() => navigateTo('shop')}
                className="mt-2 px-5 py-2.5 rounded-xl bg-[#0a0a0a] hover:bg-[#e5341f] text-white font-bold text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center space-x-1.5"
              >
                <span>Explore Archival Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-w-md mx-auto">
              <h3 className="text-base font-bold text-[#0a0a0a]">Track Order Progress</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                {cleanQuery
                  ? `No active shipment matching "${searchQuery}". Please verify your Order # (e.g. FS-99120) from your confirmation email.`
                  : 'Enter your unique order number or courier tracking code above to check live dispatch and delivery milestones.'}
              </p>
              {!cleanQuery && (
                <button
                  onClick={() => openAuthModal('signin')}
                  className="px-5 py-2.5 rounded-xl bg-[#0a0a0a] hover:bg-[#e5341f] text-white font-bold text-xs transition-colors cursor-pointer shadow-xs inline-block"
                >
                  Sign In to Account
                </button>
              )}
            </div>
          )}
        </motion.div>
      ) : (
        <div className="space-y-6">
          {displayOrders.map((ord) => {
            const isDispatched = ord.status === 'Dispatched to Courier';
            const isDelivered = ord.status === 'Delivered';
            const stepIdx = getStatusStepIndex(ord.status);
            const activeCourierName = ord.courierTracking?.courierName || ord.courier || 'Express Courier';
            const activeTrackingNum = ord.courierTracking?.trackingNumber || ord.trackingNumber;
            const trackingUrl = ord.courierTracking?.trackingUrl;

            return (
              <motion.div
                key={ord.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-sm transition-all duration-200"
              >
                {/* Order Top Strip */}
                <div className="p-5 sm:p-6 bg-neutral-50/60 border-b border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-sm sm:text-base font-black text-[#0a0a0a]">
                        #{ord.orderNumber}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isDelivered
                            ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                            : isDispatched
                            ? 'bg-blue-500/10 text-blue-700 border border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                        }`}
                      >
                        {isDelivered
                          ? '✅ Delivered & Verified'
                          : isDispatched
                          ? '🚀 Dispatched to Courier'
                          : '⚡ Processing & Packing'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-neutral-500 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Placed on {new Date(ord.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>•</span>
                      <span>{ord.items.length} item{ord.items.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block">Total Amount</span>
                      <span className="font-black text-sm sm:text-base text-[#0a0a0a]">{formatPKR(ord.total)}</span>
                    </div>
                    <button
                      onClick={() => handlePrintReceipt(ord.orderNumber)}
                      className="p-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-600 hover:text-[#0a0a0a] transition-colors cursor-pointer shadow-2xs"
                      title="Print Official Order Invoice"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Visual Step-by-Step Delivery Progress Bar */}
                <div className="px-5 sm:px-6 py-6 border-b border-neutral-100 bg-white">
                  <div className="relative">
                    {/* Connecting line */}
                    <div className="absolute top-4 left-6 right-6 h-1 bg-neutral-100 -z-0">
                      <div
                        className="h-full bg-[#0a0a0a] transition-all duration-500"
                        style={{
                          width:
                            stepIdx === 0
                              ? '0%'
                              : stepIdx === 1
                              ? '33.33%'
                              : stepIdx === 2
                              ? '66.66%'
                              : stepIdx === 3
                              ? '100%'
                              : '0%',
                        }}
                      />
                    </div>

                    {/* 4 Key Steps */}
                    <div className="grid grid-cols-4 relative z-10 text-center">
                      {/* Step 1: Order Placed */}
                      <div className="flex flex-col items-center space-y-1.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-colors ${
                            stepIdx >= 0
                              ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                              : 'bg-white text-neutral-400 border-neutral-200'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <span className={`text-[10px] sm:text-[11px] font-bold ${stepIdx >= 0 ? 'text-[#0a0a0a]' : 'text-neutral-400'}`}>
                          Order Placed
                        </span>
                      </div>

                      {/* Step 2: Quality Inspection / Packing */}
                      <div className="flex flex-col items-center space-y-1.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-colors ${
                            stepIdx >= 1
                              ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                              : 'bg-white text-neutral-400 border-neutral-200'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <span className={`text-[10px] sm:text-[11px] font-bold ${stepIdx >= 1 ? 'text-[#0a0a0a]' : 'text-neutral-400'}`}>
                          Verified &amp; Packed
                        </span>
                      </div>

                      {/* Step 3: Courier Dispatch */}
                      <div className="flex flex-col items-center space-y-1.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-colors ${
                            stepIdx >= 2
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white text-neutral-400 border-neutral-200'
                          }`}
                        >
                          <Truck className="w-3.5 h-3.5" />
                        </div>
                        <span className={`text-[10px] sm:text-[11px] font-bold ${stepIdx >= 2 ? 'text-blue-700 font-black' : 'text-neutral-400'}`}>
                          On Road
                        </span>
                      </div>

                      {/* Step 4: Delivered */}
                      <div className="flex flex-col items-center space-y-1.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-colors ${
                            stepIdx >= 3
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-neutral-400 border-neutral-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <span className={`text-[10px] sm:text-[11px] font-bold ${stepIdx >= 3 ? 'text-emerald-700 font-black' : 'text-neutral-400'}`}>
                          Delivered
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* LIVE COURIER TRACKING HIGHLIGHT CARD */}
                {(isDispatched || activeTrackingNum) && (
                  <div className="p-5 sm:p-6 bg-blue-50/50 border-b border-blue-100 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-xs sm:text-sm text-blue-900">
                              Live Courier Dispatch Info
                            </h4>
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                              {activeCourierName}
                            </span>
                          </div>
                          <p className="text-xs text-blue-700/80 mt-0.5">
                            Dispatched via official courier partner for express priority delivery.
                          </p>
                        </div>
                      </div>

                      {/* Tracking link button */}
                      {trackingUrl && (
                        <a
                          href={trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center justify-center space-x-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
                        >
                          <span>Live Portal Tracking</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    {/* Tracking details grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-white border border-blue-200/80 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
                          Tracking ID
                        </span>
                        <div className="flex items-center space-x-2">
                          <strong className="font-mono text-sm text-blue-900 select-all">
                            {activeTrackingNum || 'Pending'}
                          </strong>
                          {activeTrackingNum && (
                            <button
                              onClick={() => handleCopyTracking(activeTrackingNum)}
                              className="p-1 text-neutral-400 hover:text-blue-600 transition-colors"
                              title="Copy Tracking Number"
                            >
                              {copiedTrackingId === activeTrackingNum ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
                          Carrier Partner
                        </span>
                        <span className="font-bold text-neutral-800">
                          {activeCourierName}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
                          Dispatch Timestamp
                        </span>
                        <span className="text-neutral-700 font-medium">
                          {ord.courierTracking?.dispatchedAt
                            ? new Date(ord.courierTracking.dispatchedAt).toLocaleString()
                            : 'Logged in transit'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Items in Order */}
                <div className="p-5 sm:p-6 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
                    Curated Archival Pieces ({ord.items.length})
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ord.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-3.5 p-3 rounded-xl border border-neutral-200/80 bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
                      >
                        <img
                          src={it.product.images[0]}
                          alt={it.product.title}
                          className="w-14 h-14 object-cover rounded-xl bg-neutral-200 border border-neutral-200/80 shrink-0"
                        />
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <h5 className="font-bold text-xs text-[#0a0a0a] truncate">
                            {it.product.title}
                          </h5>
                          <div className="flex items-center space-x-2 text-[11px] text-neutral-500 font-medium">
                            <span>Size: <strong>{it.selectedSize || it.product.size}</strong></span>
                            <span>•</span>
                            <span>Grade: {it.product.conditionGrade}</span>
                          </div>
                          <span className="font-black text-xs text-[#0a0a0a] block">
                            {formatPKR(it.product.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Destination & Payment Summary Footer */}
                <div className="p-5 sm:p-6 bg-neutral-50 border-t border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="flex items-start space-x-2 text-neutral-600">
                    <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#0a0a0a] block">
                        {ord.customer?.fullName || 'Recipient'} ({ord.customer?.phone || 'No phone'})
                      </span>
                      <span className="text-neutral-500 block">
                        {ord.customer?.address}, {ord.customer?.city}, {ord.customer?.state} {ord.customer?.postalCode}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-neutral-200 text-neutral-700 font-bold">
                      <CreditCard className="w-3.5 h-3.5 text-neutral-500" />
                      <span className="uppercase">{ord.paymentMethod?.replace('_', ' ') || 'COD'}</span>
                    </div>

                    <button
                      onClick={() => handlePrintReceipt(ord.orderNumber)}
                      className="h-8 px-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 font-bold text-xs inline-flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Receipt</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
