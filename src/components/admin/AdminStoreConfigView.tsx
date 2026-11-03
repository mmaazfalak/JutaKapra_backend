import React, { useState } from 'react';
import {
  Settings,
  Store,
  Truck,
  Shield,
  Save,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  HelpCircle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const AdminStoreConfigView: React.FC = () => {
  const { themeMode, addToast } = useStore();

  const [storeName, setStoreName] = useState('Juta.Kapra');
  const [storeTagline, setStoreTagline] = useState('Authentic Archival & Vintage Thrift Studio');
  const [supportEmail, setSupportEmail] = useState('support@jutakapra.com');
  const [contactPhone, setContactPhone] = useState('+92 300 5550192');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(15000);
  const [defaultCourier, setDefaultCourier] = useState('TCS Express');
  const [address, setAddress] = useState('F-7 Markaz, Islamabad, Pakistan');

  const cardBg = themeMode === 'dark' ? 'bg-[#12151c] border-[#232833]' : 'bg-white border-slate-200';
  const textMuted = themeMode === 'dark' ? 'text-[#9aa4b2]' : 'text-[#475569]';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      type: 'success',
      title: 'Store Config Saved',
      message: 'Global storefront settings and shipping parameters updated.',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-400" />
              <span>Store Configuration &amp; Policies</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              Live Production
            </span>
          </div>
          <p className={`text-xs mt-1 ${textMuted}`}>
            Manage store brand parameters, contact channels, shipping thresholds, and operational rules.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        {/* Brand Identity */}
        <div className={`p-6 rounded-2xl border shadow-sm ${cardBg} space-y-4`}>
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <Store className="w-4 h-4 text-blue-400" />
            <span>Storefront Identity</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-300">Store Brand Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-300">Tagline / Mission</label>
              <input
                type="text"
                value={storeTagline}
                onChange={(e) => setStoreTagline(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Shipping & Logistics */}
        <div className={`p-6 rounded-2xl border shadow-sm ${cardBg} space-y-4`}>
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-400" />
            <span>Shipping &amp; Courier Logistics</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-300">Free Shipping Threshold (PKR)</label>
              <input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] text-white outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-300">Primary Courier Provider</label>
              <select
                value={defaultCourier}
                onChange={(e) => setDefaultCourier(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] text-white outline-none focus:border-blue-500"
              >
                <option value="TCS Express">TCS Express</option>
                <option value="Leopards Courier">Leopards Courier</option>
                <option value="Trax Logistics">Trax Logistics</option>
                <option value="Call Courier">Call Courier</option>
                <option value="M&P Express">M&P Express</option>
              </select>
            </div>
          </div>
        </div>

        {/* Support & Contact Details */}
        <div className={`p-6 rounded-2xl border shadow-sm ${cardBg} space-y-4`}>
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-purple-400" />
            <span>Customer Communications</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-300">Support Desk Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-300">WhatsApp / Helpline Phone</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#181c24] border border-[#232833] text-white outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Store Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
