import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  User,
  ChevronDown,
  ChevronRight,
  X,
  Menu,
  LogOut,
  LogIn,
  UserPlus,
  ShieldCheck,
  Flame,
  Sun,
  Moon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { CategoryType } from '../types';

export const Header: React.FC = () => {
  const {
    currentView,
    navigateTo,
    cartCount,
    setIsCartOpen,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    isAdminLoggedIn,
    currentCustomer,
    profile,
    setIsCheckoutGateOpen,
    openAuthModal,
    logoutCustomer,
    themeMode,
    toggleThemeMode,
  } = useStore();

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isAccessoriesHovered, setIsAccessoriesHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const accessoriesRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const categories: { label: CategoryType; isDeals?: boolean }[] = [
    { label: 'All Vintage' },
    { label: 'Sneakers & Boots' },
    { label: 'Vintage Tees & Trousers' },
    { label: 'Workwear & Jeans' },
    { label: 'Jackets & Coats' },
    { label: 'Accessories' },
    { label: 'Deals', isDeals: true },
  ];

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileUserMenuOpen, setIsMobileUserMenuOpen] = useState(false);
  const mobileUserMenuRef = useRef<HTMLDivElement>(null);

  // Scroll lock background page when mobile hamburger drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobileMenuOpen]);

  // Scroll listener for sticky header border/shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close User menu and Accessories dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accessoriesRef.current && !accessoriesRef.current.contains(event.target as Node)) {
        setIsAccessoriesHovered(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (mobileUserMenuRef.current && !mobileUserMenuRef.current.contains(event.target as Node)) {
        setIsMobileUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo('shop');
    setIsMobileSearchOpen(false);
  };

  const handleCategorySelect = (cat: CategoryType) => {
    setSelectedCategory(cat);
    if (cat === 'Accessories') {
      setSelectedSubcategory('all');
    }
    navigateTo('shop');
  };

  const isDark = themeMode === 'dark';
  const isExplorePage = currentView === 'shop';

  return (
    <header
      className={`sticky top-0 z-50 w-full font-sans transition-colors duration-200 ${
        isDark
          ? `bg-[#0a0a0a] text-neutral-100 ${isScrolled ? 'shadow-lg border-b border-neutral-800' : 'border-b border-neutral-900'}`
          : `bg-white text-[#0a0a0a] ${isScrolled ? 'shadow-sm border-b border-[#0a0a0a]/10' : 'border-b border-[#0a0a0a]/8'}`
      }`}
    >
      {/* =========================================================================
          MOBILE PHONE TOPBAR (Phone Only - Clean Minimal Redesign)
          ========================================================================= */}
      <div className={`md:hidden flex flex-col ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
        <div className="h-14 px-4 flex items-center justify-between gap-3">
          {/* Left: Brand Logo & Title */}
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center space-x-2.5 text-left active:scale-95 transition-transform cursor-pointer"
            aria-label="Juta Kapra Home"
          >
            <img
              src="https://i.postimg.cc/W1hRXfMh/Screenshot-2026-09-19-at-12-25-17-AM.png"
              alt="Juta.Kapra Logo"
              className="w-8 h-8 rounded-lg object-contain shadow-xs border border-black/5"
            />
            <div className="flex flex-col">
              <span className={`text-[17px] font-black tracking-tight leading-none ${isDark ? 'text-white' : 'text-[#0a0a0a]'}`}>
                JUTA<span className="text-[#e5341f]">.</span>KAPRA
              </span>
              <span className={`text-[8.5px] uppercase font-bold tracking-widest mt-0.5 ${isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/50'}`}>
                Archival Vault
              </span>
            </div>
          </button>

          {/* Right Actions: Search (Explore Page Only) + Menu Drawer */}
          <div className="flex items-center space-x-2">
            {/* Search Trigger Button - ONLY shown on Explore / Shop page */}
            {isExplorePage && (
              <button
                onClick={() => setIsMobileSearchOpen((prev) => !prev)}
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all active:scale-90 cursor-pointer ${
                  isMobileSearchOpen
                    ? isDark
                      ? 'bg-white text-black border-white'
                      : 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                    : isDark
                    ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-800'
                    : 'bg-[#fafafa] hover:bg-[#f0f0f0] text-[#0a0a0a] border-[#0a0a0a]/10'
                }`}
                aria-label="Search Explore Catalog"
                title="Search Products"
              >
                {isMobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              </button>
            )}

            {/* Mobile Menu Drawer Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all shadow-xs cursor-pointer ${
                isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-[#0a0a0a] text-white hover:bg-neutral-800'
              }`}
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Search Dropdown with Tag Pills - Only active when on Explore page */}
        <AnimatePresence>
          {isExplorePage && isMobileSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className={`overflow-hidden border-t px-3.5 py-3 ${
                isDark ? 'border-neutral-800 bg-[#121212]' : 'border-[#0a0a0a]/8 bg-[#fafafa]'
              }`}
            >
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className={`w-4 h-4 absolute left-3 pointer-events-none ${isDark ? 'text-neutral-500' : 'text-[#0a0a0a]/40'}`} />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search 90s tees, Carhartt, boots, workwear..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full border rounded-xl pl-9 pr-18 py-2 text-xs outline-none shadow-xs ${
                    isDark
                      ? 'bg-neutral-900 border-neutral-700 text-white placeholder-neutral-500 focus:border-[#e5341f]'
                      : 'bg-white border-[#0a0a0a]/15 text-[#0a0a0a] placeholder-[#0a0a0a]/40 focus:border-[#e5341f]'
                  }`}
                />
                <button
                  type="submit"
                  className={`absolute right-1.5 px-3 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                    isDark ? 'bg-white text-black hover:bg-[#e5341f] hover:text-white' : 'bg-[#0a0a0a] text-white hover:bg-[#e5341f]'
                  }`}
                >
                  Search
                </button>
              </form>

              {/* Quick Suggestion Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pt-2.5">
                <span className={`text-[10px] font-bold uppercase mr-0.5 shrink-0 ${isDark ? 'text-neutral-500' : 'text-[#0a0a0a]/40'}`}>
                  Quick:
                </span>
                {['90s Tees', 'Carhartt', 'Jordan 1', 'Vintage Jeans', 'Jackets'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSearchQuery(tag);
                      navigateTo('shop');
                      setIsMobileSearchOpen(false);
                    }}
                    className={`text-[10px] font-semibold border px-2.5 py-1 rounded-full whitespace-nowrap active:scale-95 transition-all shrink-0 shadow-2xs ${
                      isDark
                        ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-[#e5341f] hover:text-white'
                        : 'bg-white border-[#0a0a0a]/10 text-[#0a0a0a]/80 hover:border-[#e5341f]'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* =========================================================================
          DESKTOP MAIN HEADER BAR (Hidden on Mobile)
          ========================================================================= */}
      <div className={`hidden md:block h-[65px] sm:h-[70px] px-3 sm:px-6 lg:px-8 ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-[#0a0a0a]'}`}>
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-2 sm:gap-6">
          {/* Desktop Brand Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <button
              onClick={() => navigateTo('home')}
              className="flex items-center space-x-2.5 text-left group cursor-pointer shrink-0 focus:outline-none min-h-[44px]"
              aria-label="Juta Kapra Home"
            >
              <img
                src="https://i.postimg.cc/W1hRXfMh/Screenshot-2026-09-19-at-12-25-17-AM.png"
                alt="Juta.Kapra Logo"
                className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-lg object-contain transition-transform group-hover:scale-105"
              />
              <div className="flex flex-col">
                <span className={`text-xl sm:text-2xl font-black tracking-[-0.04em] leading-none whitespace-nowrap ${isDark ? 'text-white' : 'text-[#0a0a0a]'}`}>
                  Juta<span className="text-[#e5341f]">.</span>Kapra
                </span>
                <span className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-widest mt-0.5 hidden sm:block ${isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/50'}`}>
                  Vintage Tees &amp; Trousers
                </span>
              </div>
            </button>
          </div>

          {/* Center Search-first inline field (Desktop Only) */}
          <form
            onSubmit={handleSearchSubmit}
            className={`flex flex-1 max-w-xl mx-2 items-center rounded-lg transition-all duration-150 relative h-11 px-3 border ${
              isDark
                ? 'bg-neutral-900 border-neutral-700 focus-within:border-neutral-500'
                : 'bg-[#fafafa] hover:bg-white focus-within:bg-white border-[#0a0a0a]/15 focus-within:border-[#0a0a0a]'
            }`}
          >
            <Search className={`w-4 h-4 mr-2 shrink-0 ${isDark ? 'text-neutral-500' : 'text-[#0a0a0a]/40'}`} />
            <input
              type="text"
              placeholder="Search 90s Carhartt, band tees, Jordan 1s, workwear..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-transparent text-sm focus:outline-none ${
                isDark ? 'text-white placeholder-neutral-500' : 'text-[#0a0a0a] placeholder-[#0a0a0a]/40'
              }`}
            />

            {/* Inset Sale-Red Submit Button */}
            <button
              type="submit"
              className="ml-2 h-8 px-3.5 rounded-md bg-[#e5341f] hover:bg-[#c42912] text-white font-medium text-xs flex items-center justify-center space-x-1 transition-colors cursor-pointer shadow-sm shrink-0"
              title="Search catalog"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Search</span>
            </button>
          </form>

          {/* Right Action Group (Desktop) */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Dark / Light Mood Toggle */}
            <button
              onClick={toggleThemeMode}
              className={`h-9 sm:h-10 px-3 rounded-full border flex items-center space-x-1.5 text-xs font-bold cursor-pointer transition-all shadow-2xs hover:shadow-xs active:scale-95 ${
                isDark
                  ? 'border-neutral-700 bg-neutral-900 text-amber-400 hover:border-neutral-600'
                  : 'border-[#0a0a0a]/15 hover:border-[#0a0a0a] bg-white text-[#0a0a0a]'
              }`}
              aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mood`}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} mood`}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden lg:inline text-[11px] font-bold">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#0a0a0a]" />
                  <span className="hidden lg:inline text-[11px] font-bold">Dark</span>
                </>
              )}
            </button>

            {/* Logged-In Client Profile Picture Action (Clickable to /account) */}
            {(currentCustomer || profile) ? (
              <button
                onClick={() => navigateTo('account')}
                className={`h-9 sm:h-10 pl-1.5 pr-2.5 sm:pr-3 rounded-full border flex items-center space-x-2 text-xs font-bold cursor-pointer transition-all shadow-xs hover:shadow-md group active:scale-95 shrink-0 ${
                  isDark
                    ? 'border-neutral-700 hover:border-[#e5341f] bg-neutral-900 text-white'
                    : 'border-[#0a0a0a]/15 hover:border-[#e5341f] bg-white text-[#0a0a0a]'
                }`}
                aria-label={`Account profile for ${profile?.full_name || currentCustomer?.fullName || 'Account'}`}
                title={`Account: ${profile?.full_name || currentCustomer?.fullName || 'Account'}`}
              >
                <img
                  src={
                    profile?.avatar_url ||
                    currentCustomer?.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || currentCustomer?.fullName || 'User')}&background=0a0a0a&color=fff&size=200&bold=true`
                  }
                  alt={profile?.full_name || currentCustomer?.fullName || 'Account'}
                  className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full object-cover border border-[#0a0a0a]/20 group-hover:scale-105 transition-transform"
                />
                <span className={`hidden sm:inline max-w-[110px] truncate group-hover:text-[#e5341f] transition-colors ${isDark ? 'text-white' : 'text-[#0a0a0a]'}`}>
                  {(profile?.full_name || currentCustomer?.fullName || 'Account').split(' ')[0]}
                </span>
              </button>
            ) : (
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <button
                  onClick={() => openAuthModal('signin')}
                  className={`h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-lg border font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95 ${
                    isDark
                      ? 'border-neutral-700 hover:border-neutral-500 bg-neutral-900 text-white'
                      : 'border-[#0a0a0a]/15 hover:border-[#0a0a0a] hover:bg-[#fafafa] text-[#0a0a0a]'
                  }`}
                  title="Log in to your account"
                >
                  <LogIn className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#0a0a0a]'}`} />
                  <span className="hidden sm:inline">Log In</span>
                </button>

                <button
                  onClick={() => openAuthModal('signup')}
                  className="h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-lg bg-[#0a0a0a] hover:bg-[#e5341f] text-white font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95 border border-neutral-700"
                  title="Create a new account"
                >
                  <UserPlus className="w-3.5 h-3.5 text-white" />
                  <span className="hidden sm:inline">Create Account</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          Tier 3: Category Hairline Rail (Mobile Friendly Touch Swipe)
          - Hidden on Account, Auth, and Checkout views
          ========================================================================= */}
      {!['account', 'account-orders', 'account-profile', 'account-change-password', 'login', 'register', 'forgot-password', 'verify-otp', 'reset-password', 'checkout'].includes(currentView) && (
        <div className={`h-12 border-t px-3 sm:px-6 lg:px-8 relative z-30 overflow-x-auto no-scrollbar ${
          isDark ? 'bg-[#0a0a0a] border-neutral-800 text-neutral-300' : 'bg-white border-[#0a0a0a]/8 text-[#0a0a0a]/80'
        }`}>
          <div className="max-w-7xl mx-auto h-full flex items-center justify-between min-w-max md:min-w-0">
            {/* Category Rail items */}
            <nav className="flex items-center space-x-1 sm:space-x-3 shrink-0">
              {categories.map((cat) => {
                const isActive =
                  currentView === 'shop' && selectedCategory === cat.label;

                if (cat.label === 'Accessories') {
                  return (
                    <div
                      key={cat.label}
                      ref={accessoriesRef}
                      className="relative"
                      onMouseEnter={() => setIsAccessoriesHovered(true)}
                      onMouseLeave={() => setIsAccessoriesHovered(false)}
                    >
                      <button
                        onClick={() => {
                          setIsAccessoriesHovered(!isAccessoriesHovered);
                          handleCategorySelect('Accessories');
                        }}
                        className={`relative group py-3 px-2 sm:px-3 text-xs sm:text-[13px] font-semibold transition-colors cursor-pointer flex items-center space-x-1 whitespace-nowrap ${
                          isDark ? 'text-neutral-300 hover:text-white' : 'text-[#0a0a0a]/80 hover:text-[#0a0a0a]'
                        }`}
                      >
                        <span>Accessories</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isAccessoriesHovered ? 'rotate-180' : ''} ${isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/50'}`} />

                        {/* Animated Red Hairline Bar */}
                        <span
                          className={`absolute bottom-0 left-2 right-2 h-[2px] bg-[#e5341f] transition-transform duration-200 origin-center ${
                            isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                          }`}
                        />
                      </button>

                      {/* Accessories Subcategory Transparent Bubble Dropdown */}
                      {isAccessoriesHovered && (
                        <div className={`absolute top-full left-0 mt-1 w-44 backdrop-blur-md border shadow-2xl rounded-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 ${
                          isDark ? 'bg-[#181818]/95 border-neutral-700 text-white' : 'bg-white/95 border-slate-200/90 text-slate-900'
                        }`}>
                          {[
                            { id: 'all', label: 'All' },
                            { id: 'watch', label: 'Watch' },
                            { id: 'glasses', label: 'Glasses' },
                            { id: 'bags', label: 'Bags' },
                            { id: 'wallets', label: 'Wallets' },
                          ].map((sub) => {
                            const isSubActive =
                              currentView === 'shop' &&
                              selectedCategory === 'Accessories' &&
                              selectedSubcategory === sub.id;

                            return (
                              <button
                                key={sub.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCategory('Accessories');
                                  setSelectedSubcategory(sub.id);
                                  navigateTo('shop');
                                  setIsAccessoriesHovered(false);
                                }}
                                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                                  isSubActive
                                    ? isDark ? 'bg-neutral-800 text-white font-bold' : 'bg-[#0a0a0a] text-white shadow-sm'
                                    : isDark ? 'text-neutral-300 hover:text-white hover:bg-neutral-800' : 'text-[#0a0a0a]/80 hover:text-[#0a0a0a] hover:bg-black/5'
                                }`}
                              >
                                <span>{sub.label}</span>
                                {isSubActive && <span className="w-1.5 h-1.5 rounded-full bg-[#e5341f]" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <button
                    key={cat.label}
                    onClick={() => handleCategorySelect(cat.label)}
                    className={`relative group py-3 px-2 sm:px-3 text-xs sm:text-[13px] font-semibold transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                      isDark ? 'text-neutral-300 hover:text-white' : 'text-[#0a0a0a]/80 hover:text-[#0a0a0a]'
                    }`}
                  >
                    <span>{cat.label}</span>
                    {cat.isDeals && (
                      <span className="bg-[#e5341f] text-white text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide">
                        HOT
                      </span>
                    )}

                    {/* Animated Red Hairline Bar */}
                    <span
                      className={`absolute bottom-0 left-2 right-2 h-[2px] bg-[#e5341f] transition-transform duration-200 origin-center ${
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`}
                    />
                  </button>
                );
              })}
            </nav>

            {/* Quick Sub-navigation links (Desktop) */}
            <div className={`hidden lg:flex items-center space-x-4 text-xs font-medium shrink-0 ${isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/60'}`}>
              <button
                onClick={() => navigateTo('drops')}
                className={`transition-colors cursor-pointer ${
                  currentView === 'drops' ? 'text-[#e5341f] font-bold' : isDark ? 'hover:text-white' : 'hover:text-[#0a0a0a]'
                }`}
              >
                Drop Calendar
              </button>
              <span className={isDark ? 'text-neutral-700' : 'text-[#0a0a0a]/20'}>•</span>
              <button
                onClick={() => navigateTo('condition-guide')}
                className={`transition-colors cursor-pointer ${
                  currentView === 'condition-guide' ? 'text-[#e5341f] font-bold' : isDark ? 'hover:text-white' : 'hover:text-[#0a0a0a]'
                }`}
              >
                Condition Standards
              </button>
              <span className={isDark ? 'text-neutral-700' : 'text-[#0a0a0a]/20'}>•</span>
              <button
                onClick={() => navigateTo('contact')}
                className={`transition-colors cursor-pointer ${
                  currentView === 'contact' ? 'text-[#e5341f] font-bold' : isDark ? 'hover:text-white' : 'hover:text-[#0a0a0a]'
                }`}
              >
                Pop-Up Locations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Slide-Out Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Slide-In Drawer Sheet */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className={`relative w-4/5 max-w-xs h-full shadow-2xl z-10 flex flex-col justify-between overflow-y-auto ${
                isDark ? 'bg-[#121212] text-white' : 'bg-white text-[#0a0a0a]'
              }`}
            >
              {/* Drawer Header */}
              <div>
                <div className={`p-4 border-b flex items-center justify-between ${
                  isDark ? 'border-neutral-800 bg-[#181818]' : 'border-[#0a0a0a]/10 bg-[#fafafa]'
                }`}>
                  <div className="flex items-center space-x-2.5">
                    <img
                      src="https://i.postimg.cc/W1hRXfMh/Screenshot-2026-09-19-at-12-25-17-AM.png"
                      alt="Juta.Kapra Logo"
                      className="w-7 h-7 rounded-md object-contain"
                    />
                    <span className={`font-black text-base ${isDark ? 'text-white' : 'text-[#0a0a0a]'}`}>Juta.Kapra</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`p-1.5 rounded-lg cursor-pointer ${
                      isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-[#0a0a0a]'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Search Bar in Mobile Menu */}
                <div className={`p-4 border-b ${isDark ? 'border-neutral-800 bg-[#121212]' : 'border-[#0a0a0a]/10 bg-white'}`}>
                  <form
                    onSubmit={(e) => {
                      handleSearchSubmit(e);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center border rounded-lg px-3 py-2 ${
                      isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-[#fafafa] border-[#0a0a0a]/15'
                    }`}
                  >
                    <Search className={`w-4 h-4 mr-2 shrink-0 ${isDark ? 'text-neutral-500' : 'text-[#0a0a0a]/40'}`} />
                    <input
                      type="text"
                      placeholder="Search vintage grails..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full bg-transparent text-xs focus:outline-none ${
                        isDark ? 'text-white placeholder-neutral-500' : 'text-[#0a0a0a] placeholder-[#0a0a0a]/40'
                      }`}
                    />
                  </form>
                </div>

                {/* Account Section in Mobile Menu */}
                <div className={`p-4 border-b ${isDark ? 'border-neutral-800 bg-[#121212]' : 'border-[#0a0a0a]/10 bg-white'}`}>
                  {(currentCustomer || profile) ? (
                    <div className={`p-3 border rounded-xl space-y-2.5 ${
                      isDark ? 'bg-[#181818] border-neutral-800' : 'bg-[#fafafa] border-[#0a0a0a]/10'
                    }`}>
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={
                            profile?.avatar_url ||
                            currentCustomer?.avatarUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || currentCustomer?.fullName || 'User')}&background=0a0a0a&color=fff&size=200&bold=true`
                          }
                          alt={profile?.full_name || currentCustomer?.fullName || 'User'}
                          className="w-9 h-9 rounded-full object-cover border border-[#0a0a0a]/20 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-xs truncate ${isDark ? 'text-white' : 'text-[#0a0a0a]'}`}>{profile?.full_name || currentCustomer?.fullName}</p>
                          <p className={`text-[10px] truncate font-mono ${isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/60'}`}>{profile?.email || currentCustomer?.email}</p>
                        </div>
                      </div>

                      <div className={`grid grid-cols-2 gap-2 pt-1 border-t ${isDark ? 'border-neutral-800' : 'border-[#0a0a0a]/8'}`}>
                        <button
                          onClick={() => {
                            navigateTo('account');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`py-1.5 px-2 border font-bold text-xs rounded-lg text-center ${
                            isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-[#0a0a0a]/15 text-[#0a0a0a]'
                          }`}
                        >
                          My Account
                        </button>
                        <button
                          onClick={() => {
                            logoutCustomer();
                            setIsMobileMenuOpen(false);
                          }}
                          className="py-1.5 px-2 bg-red-500/10 hover:bg-red-500/20 text-[#e5341f] border border-red-500/20 font-bold text-xs rounded-lg text-center transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className={`text-[10px] font-extrabold uppercase tracking-wider mb-1 ${isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/40'}`}>
                        Collector Account Access
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            openAuthModal('signin');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm ${
                            isDark ? 'border-neutral-700 bg-neutral-900 text-white' : 'border-[#0a0a0a]/15 hover:border-[#0a0a0a] bg-white text-[#0a0a0a]'
                          }`}
                        >
                          <LogIn className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-[#0a0a0a]'}`} />
                          <span>Log In</span>
                        </button>

                        <button
                          onClick={() => {
                            openAuthModal('signup');
                            setIsMobileMenuOpen(false);
                          }}
                          className="py-2.5 px-3 rounded-xl bg-[#0a0a0a] hover:bg-[#e5341f] text-white font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm border border-neutral-700"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-white" />
                          <span>Create Account</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Categories Menu List */}
                <div className="p-4 space-y-3">
                  <div className={`text-[10px] font-extrabold uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/40'}`}>
                    Browse Store Categories
                  </div>
                  <div className="space-y-1">
                    {categories.map((cat) => (
                      <div key={cat.label} className="space-y-1">
                        <button
                          onClick={() => {
                            handleCategorySelect(cat.label);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                            selectedCategory === cat.label
                              ? isDark ? 'bg-white text-black' : 'bg-[#0a0a0a] text-white'
                              : isDark ? 'text-neutral-200 hover:bg-neutral-800' : 'text-[#0a0a0a]/80 hover:bg-[#fafafa]'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span>{cat.label}</span>
                            {cat.isDeals && (
                              <span className="bg-[#e5341f] text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                                HOT
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                        </button>

                        {/* Accessories Subcategories inside Mobile Menu */}
                        {cat.label === 'Accessories' && (
                          <div className={`pl-3 pr-1 py-1 space-y-1 rounded-xl border my-1 ${
                            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-slate-50 border-slate-100'
                          }`}>
                            {[
                              { id: 'all', label: 'All Accessories' },
                              { id: 'watch', label: 'Watch' },
                              { id: 'glasses', label: 'Glasses' },
                              { id: 'bags', label: 'Bags' },
                              { id: 'wallets', label: 'Wallets' },
                            ].map((sub) => (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  setSelectedCategory('Accessories');
                                  setSelectedSubcategory(sub.id);
                                  navigateTo('shop');
                                  setIsMobileMenuOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                                  selectedCategory === 'Accessories' && selectedSubcategory === sub.id
                                    ? 'bg-[#e5341f] text-white font-bold'
                                    : isDark ? 'text-neutral-300 hover:text-white hover:bg-neutral-800' : 'text-[#0a0a0a]/70 hover:text-[#0a0a0a] hover:bg-slate-100'
                                }`}
                              >
                                <span>{sub.label}</span>
                                {selectedCategory === 'Accessories' && selectedSubcategory === sub.id && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Links */}
              <div className={`p-4 border-t space-y-2 text-xs ${isDark ? 'border-neutral-800 bg-[#181818]' : 'border-[#0a0a0a]/10 bg-[#fafafa]'}`}>
                <button
                  onClick={() => {
                    navigateTo('drops');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left py-2.5 px-3 font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                    isDark ? 'text-neutral-300 hover:text-white hover:bg-neutral-800' : 'text-[#0a0a0a]/80 hover:text-[#0a0a0a] hover:bg-black/5'
                  }`}
                >
                  <span>Drop Calendar</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </button>
                <button
                  onClick={() => {
                    navigateTo('condition-guide');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left py-2.5 px-3 font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                    isDark ? 'text-neutral-300 hover:text-white hover:bg-neutral-800' : 'text-[#0a0a0a]/80 hover:text-[#0a0a0a] hover:bg-black/5'
                  }`}
                >
                  <span>Condition Standards</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </button>
                <button
                  onClick={() => {
                    navigateTo('contact');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left py-2.5 px-3 font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                    isDark ? 'text-neutral-300 hover:text-white hover:bg-neutral-800' : 'text-[#0a0a0a]/80 hover:text-[#0a0a0a] hover:bg-black/5'
                  }`}
                >
                  <span>Pop-Up Locations</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </button>

                {/* Theme Mode Toggle inside Drawer */}
                <div className={`pt-2.5 mt-2 border-t flex items-center justify-between ${isDark ? 'border-neutral-800' : 'border-[#0a0a0a]/10'}`}>
                  <span className={`text-xs font-bold ${isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/60'}`}>
                    Appearance
                  </span>
                  <button
                    onClick={toggleThemeMode}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-neutral-900 border-neutral-700 text-amber-400 hover:border-neutral-600'
                        : 'bg-white border-[#0a0a0a]/15 text-[#0a0a0a] hover:border-[#0a0a0a]'
                    }`}
                  >
                    {isDark ? (
                      <>
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                        <span>Light Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-3.5 h-3.5 text-[#0a0a0a]" />
                        <span>Dark Mode</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};
