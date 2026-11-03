import React, { useState } from 'react';
import { ShoppingBag, ShieldCheck, Zap, MapPin, Lock } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const Footer: React.FC = () => {
  const { currentView, navigateTo, setSelectedCategory, subscribeAlert } = useStore();
  const [email, setEmail] = useState('');

  const isHome = currentView === 'home';

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (subscribeAlert(email, 'Weekly Archival Drops')) {
      setEmail('');
    }
  };

  return (
    <footer className={`${isHome ? 'block' : 'hidden md:block'} bg-[#0a0a0a] text-white border-t border-[#0a0a0a] font-sans`}>
      {/* Top Banner: Condition Trust & 1-of-1 Guarantee */}
      <div className="border-b border-white/10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="flex items-center space-x-3.5 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-[#e5341f]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">100% Verified Authentic</h4>
              <p className="text-xs text-white/60">Inspected for single-stitch, era tags &amp; provenance.</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-[#e5341f]">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Fast Worldwide Dispatch</h4>
              <p className="text-xs text-white/60">Free shipping over Rs. 5,000. Tracked global logistics.</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-[#e5341f]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Archival Pop-Up Vaults</h4>
              <p className="text-xs text-white/60">NYC Lower East Side • Harajuku Tokyo • Soho London.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Col */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center space-x-2.5">
            <img
              src="https://i.postimg.cc/W1hRXfMh/Screenshot-2026-09-19-at-12-25-17-AM.png"
              alt="Juta.Kapra Logo"
              className="w-8 h-8 rounded-lg object-contain bg-white p-0.5"
            />
            <span className="text-xl font-black tracking-tight">
              Juta<span className="text-[#e5341f]">.</span>Kapra
            </span>
          </div>

          <p className="text-xs text-white/70 max-w-sm leading-relaxed">
            Curated vintage, deadstock streetwear, Union-Made Americana workwear, and 1-of-1 archival grails. Every garment measured, steamed, and guaranteed authentic.
          </p>

          <form onSubmit={handleSubscribe} className="pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-2">
              Get 15-Minute Drop Head-Start
            </label>
            <div className="flex max-w-sm">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border border-white/15 px-3.5 py-2.5 text-xs text-white placeholder-white/40 rounded-l-md w-full focus:outline-none focus:border-white/40"
              />
              <button
                type="submit"
                className="bg-[#e5341f] hover:bg-[#c42912] text-white px-4 rounded-r-md text-xs font-bold transition-colors shrink-0 flex items-center justify-center cursor-pointer"
              >
                Join
              </button>
            </div>
          </form>
        </div>

        {/* Navigation Col 1 */}
        <div>
          <h5 className="text-xs font-black uppercase tracking-wider text-white mb-3.5">
            Catalog
          </h5>
          <ul className="space-y-2 text-xs text-white/70">
            <li>
              <button
                onClick={() => {
                  setSelectedCategory('All Vintage');
                  navigateTo('shop');
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                All Vintage
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setSelectedCategory('Vintage Tees & Trousers');
                  navigateTo('shop');
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Vintage Tees &amp; Trousers
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setSelectedCategory('Workwear & Jeans');
                  navigateTo('shop');
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Workwear &amp; Jeans
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setSelectedCategory('Jackets & Coats');
                  navigateTo('shop');
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Jackets &amp; Coats
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setSelectedCategory('Sneakers & Boots');
                  navigateTo('shop');
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Sneakers &amp; Boots
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setSelectedCategory('Accessories');
                  navigateTo('shop');
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Archival Accessories
              </button>
            </li>
          </ul>
        </div>

        {/* Navigation Col 2 */}
        <div>
          <h5 className="text-xs font-black uppercase tracking-wider text-white mb-3.5">
            Information
          </h5>
          <ul className="space-y-2 text-xs text-white/70">
            <li>
              <button
                onClick={() => navigateTo('condition-guide')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Condition Grading Standards
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('drops')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Drop Calendar
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('contact')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Pop-Up Store Locations
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('contact')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Sell to Us / Consign
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('cart')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Shopping Bag
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Legal bar */}
      <div className="border-t border-white/10 py-6 px-4 sm:px-6 lg:px-8 text-center text-xs text-white/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; {new Date().getFullYear()} Juta Kapra Curations LLC. All rights reserved.</span>
          <div className="flex items-center space-x-4">
            <span>Single-Stitch Certified</span>
            <span>•</span>
            <span>Non-Fungible Physical Goods</span>
            <span>•</span>
            <button
              onClick={() => navigateTo('admin')}
              className="hover:text-white flex items-center space-x-1.5 transition-colors cursor-pointer text-white/50"
              title="Internal Admin Portal"
            >
              <Lock className="w-3 h-3" />
              <span>Staff Portal</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
