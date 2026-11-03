import React from 'react';
import { Home, Compass, Flame, ShoppingBag, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';

export const MobileAppNavBar: React.FC = () => {
  const {
    currentView,
    navigateTo,
    cartCount,
    setIsCartOpen,
    currentCustomer,
    profile,
  } = useStore();

  const isHomeActive = currentView === 'home';
  const isShopActive = currentView === 'shop' || currentView === 'product';
  const isDropsActive = currentView === 'drops';
  const isAccountActive = [
    'account',
    'account-profile',
    'account-orders',
    'account-change-password',
    'login',
    'register',
    'forgot-password',
    'verify-otp',
    'reset-password',
  ].includes(currentView);

  const avatarSrc = profile?.avatar_url || currentCustomer?.avatarUrl;
  const userDisplayName = profile?.full_name || currentCustomer?.fullName;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-[calc(env(safe-area-inset-bottom,0px)+6px)] px-3">
      <nav
        aria-label="Mobile Navigation Dock"
        className="pointer-events-auto mx-auto max-w-md bg-[#0a0a0a]/92 backdrop-blur-2xl border border-white/12 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.45)] px-2 py-2 flex items-center justify-around ring-1 ring-white/5 transition-all duration-300"
      >
        {/* 1. HOME TAB */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => navigateTo('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1.5 rounded-2xl transition-all duration-200 relative ${
            isHomeActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
          aria-label="Home"
        >
          {isHomeActive && (
            <motion.span
              layoutId="mobileNavActiveIndicator"
              className="absolute -top-1.5 w-6 h-1 bg-[#e5341f] rounded-full shadow-[0_0_10px_rgba(229,52,31,0.9)]"
            />
          )}
          <Home className={`w-5 h-5 ${isHomeActive ? 'stroke-[2.5px] text-[#e5341f]' : 'stroke-2'}`} />
          <span className={`text-[10px] tracking-tight mt-0.5 ${isHomeActive ? 'font-black text-white' : 'font-semibold'}`}>
            Home
          </span>
        </motion.button>

        {/* 2. EXPLORE / SHOP TAB */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => navigateTo('shop')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1.5 rounded-2xl transition-all duration-200 relative ${
            isShopActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
          aria-label="Shop Catalog"
        >
          {isShopActive && (
            <motion.span
              layoutId="mobileNavActiveIndicator"
              className="absolute -top-1.5 w-6 h-1 bg-[#e5341f] rounded-full shadow-[0_0_10px_rgba(229,52,31,0.9)]"
            />
          )}
          <Compass className={`w-5 h-5 ${isShopActive ? 'stroke-[2.5px] text-[#e5341f]' : 'stroke-2'}`} />
          <span className={`text-[10px] tracking-tight mt-0.5 ${isShopActive ? 'font-black text-white' : 'font-semibold'}`}>
            Explore
          </span>
        </motion.button>

        {/* 3. DROPS / 1-OF-1 VAULT TAB */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => navigateTo('drops')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1.5 rounded-2xl transition-all duration-200 relative ${
            isDropsActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
          aria-label="Exclusive Drops"
        >
          {isDropsActive && (
            <motion.span
              layoutId="mobileNavActiveIndicator"
              className="absolute -top-1.5 w-6 h-1 bg-[#e5341f] rounded-full shadow-[0_0_10px_rgba(229,52,31,0.9)]"
            />
          )}
          <div className="relative">
            <Flame className={`w-5 h-5 ${isDropsActive ? 'stroke-[2.5px] text-[#e5341f] fill-[#e5341f]/20' : 'stroke-2'}`} />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#e5341f] animate-ping" />
          </div>
          <span className={`text-[10px] tracking-tight mt-0.5 ${isDropsActive ? 'font-black text-white' : 'font-semibold'}`}>
            Drops
          </span>
        </motion.button>

        {/* 4. SHOPPING BAG TAB */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1.5 rounded-2xl transition-all duration-200 relative text-zinc-400 hover:text-zinc-200"
          aria-label={`Shopping Bag (${cartCount} items)`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 stroke-2" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-[#e5341f] text-white text-[9px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow-lg border border-black animate-pulse">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold tracking-tight mt-0.5">Bag</span>
        </motion.button>

        {/* 5. USER ACCOUNT TAB */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => navigateTo(currentCustomer || profile ? 'account' : 'login')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1.5 rounded-2xl transition-all duration-200 relative ${
            isAccountActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
          aria-label="User Account"
        >
          {isAccountActive && (
            <motion.span
              layoutId="mobileNavActiveIndicator"
              className="absolute -top-1.5 w-6 h-1 bg-[#e5341f] rounded-full shadow-[0_0_10px_rgba(229,52,31,0.9)]"
            />
          )}
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={userDisplayName || 'User'}
              className={`w-5 h-5 rounded-full object-cover border ${
                isAccountActive ? 'border-[#e5341f] ring-2 ring-[#e5341f]/30' : 'border-white/20'
              }`}
            />
          ) : (
            <User className={`w-5 h-5 ${isAccountActive ? 'stroke-[2.5px] text-[#e5341f]' : 'stroke-2'}`} />
          )}
          <span className={`text-[10px] tracking-tight mt-0.5 truncate max-w-[48px] ${isAccountActive ? 'font-black text-white' : 'font-semibold'}`}>
            {userDisplayName ? userDisplayName.split(' ')[0] : 'Account'}
          </span>
        </motion.button>
      </nav>
    </div>
  );
};
