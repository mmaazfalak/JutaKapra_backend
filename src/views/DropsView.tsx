import React, { useState, useEffect } from 'react';
import {
  Clock,
  Bell,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
  Flame,
} from 'lucide-react';
import { DROP_EVENTS } from '../data/mockData';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';

export const DropsView: React.FC = () => {
  const { products, navigateTo, subscribeAlert, themeMode } = useStore();
  const [activeAlertDrop, setActiveAlertDrop] = useState<string | null>(null);
  const [alertEmail, setAlertEmail] = useState<string>('');
  const [alertPhone, setAlertPhone] = useState<string>('');

  const isDark = themeMode === 'dark';

  // Ticking countdown timer
  const [timeLefts, setTimeLefts] = useState<{
    [id: string]: { days: number; hours: number; minutes: number; seconds: number };
  }>({});

  useEffect(() => {
    const updateCountdowns = () => {
      const now = Date.now();
      const nextMap: {
        [id: string]: { days: number; hours: number; minutes: number; seconds: number };
      } = {};

      DROP_EVENTS.forEach((drop) => {
        const diff = Math.max(0, drop.targetTimestamp - now);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        nextMap[drop.id] = { days, hours, minutes, seconds };
      });

      setTimeLefts(nextMap);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertEmail.trim()) return;
    const drop = DROP_EVENTS.find((d) => d.id === activeAlertDrop);
    subscribeAlert(alertEmail, drop ? drop.title : undefined);
    setActiveAlertDrop(null);
    setAlertEmail('');
    setAlertPhone('');
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 font-sans space-y-12 sm:space-y-16 ${
      isDark ? 'text-neutral-100' : 'text-[#0a0a0a]'
    }`}>
      {/* Header */}
      <div className="max-w-3xl space-y-3 sm:space-y-4">
        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold ${
          isDark
            ? 'bg-neutral-900 border border-neutral-800 text-neutral-200'
            : 'bg-[#fafafa] border border-[#0a0a0a]/15 text-[#0a0a0a]'
        }`}>
          <Flame className="w-4 h-4 text-[#e5341f]" />
          <span>Curated Weekly Releases</span>
        </div>
        <h1 className={`text-2xl sm:text-5xl font-black tracking-[-0.04em] ${
          isDark ? 'text-white' : 'text-[#0a0a0a]'
        }`}>
          Drop Calendar &amp; Vault Releases
        </h1>
        <p className={`text-xs sm:text-base leading-relaxed ${
          isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/75'
        }`}>
          We release vintage batches in limited weekly themed capsules every Friday at midnight and Sunday at 6 PM EST. Set an alert to receive direct private links 15 minutes before public drop.
        </p>
      </div>

      {/* Featured Drop Capsules */}
      <div className="space-y-10 sm:space-y-12">
        {DROP_EVENTS.map((drop) => {
          const timer = timeLefts[drop.id] || { days: 0, hours: 0, minutes: 0, seconds: 0 };
          const previewItems = products.filter((p) =>
            drop.previewProductIds.includes(p.id)
          );

          return (
            <div
              key={drop.id}
              className={`rounded-3xl overflow-hidden shadow-sm transition-all duration-300 border ${
                isDark
                  ? 'bg-[#111317] border-neutral-800 hover:border-neutral-700'
                  : 'bg-white border-[#0a0a0a]/15 hover:border-[#0a0a0a]/40'
              }`}
            >
              {/* Banner Top */}
              <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-[#0a0a0a]">
                <img
                  src={drop.bannerImage}
                  alt={drop.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />

                {/* Drop details over banner */}
                <div className="absolute inset-x-4 bottom-4 sm:inset-x-8 sm:bottom-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center space-x-2.5">
                      <span className="bg-[#e5341f] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider">
                        {drop.badge}
                      </span>
                      <span className="text-xs font-bold text-white/80">
                        {drop.category} • {drop.itemCount} Unique Pieces
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white">
                      {drop.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-white/80 line-clamp-2">
                      {drop.description}
                    </p>
                  </div>

                  {/* Countdown Clock Box */}
                  <div className="bg-black/80 backdrop-blur-md border border-white/20 p-2.5 sm:p-4 rounded-2xl flex items-center gap-2.5 sm:gap-3 shrink-0">
                    <div className="text-center">
                      <span className="block text-lg sm:text-2xl font-black font-mono leading-none text-white">
                        {String(timer.days).padStart(2, '0')}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-white/60">Days</span>
                    </div>
                    <span className="text-lg sm:text-xl font-bold text-white/40">:</span>
                    <div className="text-center">
                      <span className="block text-lg sm:text-2xl font-black font-mono leading-none text-white">
                        {String(timer.hours).padStart(2, '0')}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-white/60">Hours</span>
                    </div>
                    <span className="text-lg sm:text-xl font-bold text-white/40">:</span>
                    <div className="text-center">
                      <span className="block text-lg sm:text-2xl font-black font-mono leading-none text-white">
                        {String(timer.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-white/60">Mins</span>
                    </div>
                    <span className="text-lg sm:text-xl font-bold text-white/40">:</span>
                    <div className="text-center">
                      <span className="block text-lg sm:text-2xl font-black font-mono leading-none text-[#e5341f]">
                        {String(timer.seconds).padStart(2, '0')}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-white/60">Secs</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar & Sneak Peek Preview Grid */}
              <div className="p-4 sm:p-8 space-y-6">
                <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5 sm:pb-6 ${
                  isDark ? 'border-neutral-800' : 'border-[#0a0a0a]/10'
                }`}>
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/50'
                    }`}>
                      Release Scheduled For:
                    </span>
                    <div className={`text-sm sm:text-base font-black flex items-center space-x-2 mt-0.5 ${
                      isDark ? 'text-white' : 'text-[#0a0a0a]'
                    }`}>
                      <Clock className="w-4 h-4 text-[#e5341f]" />
                      <span>{drop.dateStr}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 sm:space-x-3 w-full sm:w-auto">
                    <button
                      onClick={() => setActiveAlertDrop(drop.id)}
                      className="flex-1 sm:flex-none h-10 sm:h-11 px-4 sm:px-5 rounded-xl bg-[#e5341f] hover:bg-[#c42912] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-sm active:scale-95"
                    >
                      <Bell className="w-4 h-4" />
                      <span>Get Drop Alert</span>
                    </button>

                    <button
                      onClick={() => navigateTo('shop')}
                      className={`h-10 sm:h-11 px-4 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                        isDark
                          ? 'border-neutral-700 text-neutral-200 hover:bg-neutral-800'
                          : 'border-[#0a0a0a]/15 hover:border-[#0a0a0a] text-[#0a0a0a] hover:bg-neutral-50'
                      }`}
                    >
                      Shop Vault
                    </button>
                  </div>
                </div>

                {/* Sneak Peek Preview Cards */}
                {previewItems.length > 0 && (
                  <div>
                    <h3 className={`text-xs font-black uppercase tracking-wider mb-4 ${
                      isDark ? 'text-neutral-300' : 'text-[#0a0a0a]'
                    }`}>
                      Sneak Peek Grails from this Capsule:
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {previewItems.map((prod) => (
                        <ProductCard key={prod.id} product={prod} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Alert Subscription Modal */}
      {activeAlertDrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm font-sans">
          <div className={`max-w-md w-full rounded-2xl p-6 sm:p-8 border shadow-2xl relative ${
            isDark
              ? 'bg-[#111317] border-neutral-800 text-white'
              : 'bg-white border-[#0a0a0a]/15 text-[#0a0a0a]'
          }`}>
            <button
              onClick={() => setActiveAlertDrop(null)}
              className={`absolute top-4 right-4 p-1.5 rounded-full cursor-pointer ${
                isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-[#0a0a0a]/60 hover:text-[#0a0a0a] hover:bg-[#fafafa]'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#e5341f]/10 text-[#e5341f] flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#0a0a0a]'}`}>
                VIP Early Drop Notification
              </h3>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/70'}`}>
                Receive an encrypted private link with priority cart checkout 15 minutes before the public release drops.
              </p>
            </div>

            <form onSubmit={handleAlertSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-neutral-200' : 'text-[#0a0a0a]'}`}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none border ${
                    isDark
                      ? 'bg-black/40 border-neutral-700 text-white focus:border-[#e5341f]'
                      : 'bg-[#fafafa] border-[#0a0a0a]/15 text-[#0a0a0a] focus:bg-white focus:border-[#0a0a0a]'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-neutral-200' : 'text-[#0a0a0a]'}`}>
                  Mobile SMS (Optional for text alert)
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={alertPhone}
                  onChange={(e) => setAlertPhone(e.target.value)}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none border ${
                    isDark
                      ? 'bg-black/40 border-neutral-700 text-white focus:border-[#e5341f]'
                      : 'bg-[#fafafa] border-[#0a0a0a]/15 text-[#0a0a0a] focus:bg-white focus:border-[#0a0a0a]'
                  }`}
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-[#e5341f] hover:bg-[#c42912] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-md active:scale-95"
              >
                Confirm Priority Alert
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
