import React, { useState } from 'react';
import { Truck, X, ShieldAlert, Send, ExternalLink } from 'lucide-react';
import { Order } from '../types';
import { useStore } from '../context/StoreContext';

interface OrderFulfillmentModalProps {
  order: Order;
  onClose: () => void;
}

const COURIER_URLS: { [key: string]: string } = {
  'TCS Express': 'https://www.tcsexpress.com/tracking?track=',
  'Leopards Courier': 'https://www.leopardscourier.com/tracking?id=',
  'Trax Logistics': 'https://trax.pk/tracking/',
  'DHL Express': 'https://www.dhl.com/pk-en/home/tracking.html?tracking-id=',
  'PostEx': 'https://postex.pk/tracking/',
  'Custom Courier': 'https://forge.supply/track?id=',
};

export const OrderFulfillmentModal: React.FC<OrderFulfillmentModalProps> = ({ order, onClose }) => {
  const { dispatchOrderToCourier, themeMode } = useStore();

  const [courierName, setCourierName] = useState<string>('TCS Express');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [dispatchNote, setDispatchNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isFormValid = trackingNumber.trim().length >= 4;

  const handleConfirmDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);

    const baseUrl = COURIER_URLS[courierName] || 'https://forge.supply/track?id=';
    const trackingUrl = `${baseUrl}${encodeURIComponent(trackingNumber.trim())}`;

    setTimeout(() => {
      dispatchOrderToCourier(order.id, courierName, trackingNumber.trim(), trackingUrl, dispatchNote.trim());
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  const cardBg = themeMode === 'dark' ? 'bg-[#12151c] border-[#232833] text-white' : 'bg-white border-slate-200 text-slate-900';
  const inputBg = themeMode === 'dark' ? 'bg-[#181c24] border-[#232833]' : 'bg-[#f9fafb] border-slate-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl border ${cardBg} p-6 space-y-6`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-inherit pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Dispatch to Courier</h3>
              <p className="text-xs text-slate-400">Order #{order.orderNumber} • {order.customer.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirmDispatch} className="space-y-4 text-xs">
          {/* Complete Customer & Destination Details Card */}
          <div className={`p-4 rounded-xl border ${inputBg} space-y-3`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="font-extrabold text-[11px] text-blue-500 uppercase tracking-wider">
                Full Customer &amp; Delivery Profile
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Payment: {order.paymentMethod.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer Contact</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{order.customer.fullName}</p>
                <p className="text-slate-500 dark:text-slate-300 font-mono text-[11px]">{order.customer.email}</p>
                <p className="text-slate-500 dark:text-slate-300 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  📱 {order.customer.phone || 'No phone provided'}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Shipping Address</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {order.customer.address}
                  {order.customer.apartment ? `, ${order.customer.apartment}` : ''}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  {order.customer.city}, {order.customer.state} {order.customer.postalCode}
                </p>
                <p className="text-slate-500 dark:text-slate-400 font-bold">{order.customer.country}</p>
              </div>
            </div>

            {/* Order Items Breakdown */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Ordered Items ({order.items.length})</span>
              <div className="space-y-1">
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px]">
                    <span className="truncate max-w-[240px] font-medium">
                      {it.quantity}x {it.product.title} <span className="text-slate-400">({it.selectedSize})</span>
                    </span>
                    <span className="font-mono font-bold">Rs. {(it.product.price * it.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Courier Selector */}
          <div className="space-y-1.5">
            <label className="block font-bold">1. Select Courier Service Provider</label>
            <select
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              className={`w-full p-2.5 rounded-xl border ${inputBg} font-semibold outline-none focus:border-blue-500`}
            >
              <option value="TCS Express">TCS Express (Pakistan)</option>
              <option value="Leopards Courier">Leopards Courier</option>
              <option value="Trax Logistics">Trax Logistics</option>
              <option value="DHL Express">DHL Express Worldwide</option>
              <option value="PostEx">PostEx Courier</option>
              <option value="Custom Courier">Custom / Local Dispatch</option>
            </select>
          </div>

          {/* Mandatory Tracking Number Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-bold">2. Tracking Number / Waybill ID <span className="text-red-500">* (Mandatory)</span></label>
              {!isFormValid && (
                <span className="text-[10px] font-mono text-amber-500 flex items-center space-x-1">
                  <ShieldAlert className="w-3 h-3 inline" />
                  <span>Required to dispatch</span>
                </span>
              )}
            </div>
            <input
              type="text"
              required
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter waybill ID e.g. TCS-99881122..."
              className={`w-full p-2.5 rounded-xl border ${inputBg} font-mono font-bold text-sm outline-none ${
                !isFormValid ? 'focus:border-amber-500' : 'focus:border-emerald-500'
              }`}
            />
          </div>

          {/* Optional Dispatch Note */}
          <div className="space-y-1.5">
            <label className="block font-bold">3. Optional Dispatch Note for Customer</label>
            <textarea
              rows={2}
              value={dispatchNote}
              onChange={(e) => setDispatchNote(e.target.value)}
              placeholder="e.g. Handed over to express rider. Expected delivery in 24-48 hours."
              className={`w-full p-2.5 rounded-xl border ${inputBg} font-sans outline-none`}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-inherit">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-inherit font-semibold hover:bg-slate-500/10 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-white font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                isFormValid && !isSubmitting
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30'
                  : 'bg-slate-600/50 opacity-50 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Dispatching...' : 'Confirm Courier Dispatch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
