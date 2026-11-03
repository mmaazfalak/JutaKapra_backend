import React, { useState } from 'react';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Tag,
  ArrowLeft,
  Clock,
  RotateCcw,
  Check,
  Sparkles,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatPKR } from '../utils/format';

export const CartView: React.FC = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartSubtotal,
    freeShippingThreshold,
    freeShippingRemaining,
    navigateTo,
    addToast,
    currentCustomer,
    setIsCheckoutGateOpen,
    themeMode,
  } = useStore();

  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [promoError, setPromoError] = useState<string>('');

  const isDark = themeMode === 'dark';

  const handleApplyPromo = (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    const code = (customCode || promoCode).trim().toUpperCase();
    setPromoError('');
    if (code === 'JUTA10' || code === 'FORGE10') {
      setDiscountPercent(10);
      setPromoCode(code);
      addToast({
        type: 'success',
        title: 'Promo Applied!',
        message: '10% Collector discount has been applied to your bag.',
      });
    } else if (code === 'FREESHIP') {
      setDiscountPercent(5);
      setPromoCode(code);
      addToast({
        type: 'success',
        title: 'Promo Applied!',
        message: 'Extra $5 shipping subsidy applied.',
      });
    } else {
      setPromoError('Invalid code. Try "JUTA10" for 10% off.');
    }
  };

  const handleCheckoutClick = () => {
    if (!currentCustomer) {
      setIsCheckoutGateOpen(true);
    } else {
      navigateTo('checkout');
    }
  };

  const shippingCost = cartSubtotal >= freeShippingThreshold ? 0 : 9.95;
  const discountAmount = (cartSubtotal * discountPercent) / 100;
  const estimatedTax = cartSubtotal * 0.08875; // NYC sales tax
  const orderTotal = Math.max(0, cartSubtotal - discountAmount + shippingCost + estimatedTax);

  const shippingProgress = Math.min(
    100,
    Math.round((cartSubtotal / freeShippingThreshold) * 100)
  );

  const totalItemsCount = cart.reduce((s, i) => s + i.quantity, 0);

  // Dynamic Theme Styling
  const pageBg = isDark ? 'bg-[#0a0a0a] text-neutral-100' : 'bg-white text-[#0a0a0a]';
  const cardBg = isDark ? 'bg-[#111317] border-neutral-800/90' : 'bg-[#fafafa] border-[#0a0a0a]/15';
  const subCardBg = isDark ? 'bg-[#161922] border-neutral-800' : 'bg-white border-neutral-200/80';
  const textPrimary = isDark ? 'text-white' : 'text-[#0a0a0a]';
  const textMuted = isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/60';

  if (cart.length === 0) {
    return (
      <div className={`max-w-4xl mx-auto px-4 py-20 text-center font-sans ${pageBg}`}>
        <div className={`w-16 h-16 rounded-3xl ${isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-500' : 'bg-[#fafafa] border-[#0a0a0a]/10 text-[#0a0a0a]/40'} border flex items-center justify-center mx-auto mb-4`}>
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className={`text-2xl sm:text-3xl font-black ${textPrimary} tracking-tight`}>
          Your Shopping Bag is Empty
        </h1>
        <p className={`text-xs sm:text-sm ${textMuted} mt-2 max-w-md mx-auto`}>
          Our vintage stock is strictly 1-of-1. Once an archival item is purchased, it cannot be restocked.
        </p>
        <button
          onClick={() => navigateTo('shop')}
          className="mt-6 inline-flex items-center space-x-2 bg-[#e5341f] hover:bg-[#c42912] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Explore Vintage Catalog</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`w-full font-sans ${pageBg}`}>
      {/* =========================================================================
          MOBILE PHONE VIEW ONLY (< lg) - Luxury Native App Redesign
          ========================================================================= */}
      <div className="lg:hidden px-4 py-5 space-y-4 pb-40">
        {/* Mobile Top Navigation Strip */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => navigateTo('shop')}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#e5341f] active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Shop</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className={`text-sm font-black ${textPrimary}`}>Shopping Bag</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#e5341f] text-white font-mono">
              {totalItemsCount}
            </span>
          </div>

          <button
            onClick={clearCart}
            className="text-[11px] font-semibold text-neutral-400 hover:text-[#e5341f] transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Free Shipping Progress Indicator (Mobile) */}
        <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-neutral-900/80 border-neutral-800' : 'bg-neutral-50 border-neutral-200/80'} shadow-2xs space-y-2`}>
          <div className="flex items-center justify-between text-xs font-semibold">
            {freeShippingRemaining > 0 ? (
              <span className="flex items-center gap-1.5 text-xs text-[#e5341f]">
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span>Add <strong>{formatPKR(freeShippingRemaining)}</strong> for FREE Shipping</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>FREE Express Delivery Unlocked!</span>
              </span>
            )}
            <span className="text-[11px] font-mono font-bold text-neutral-400">{shippingProgress}%</span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#e5341f] h-full transition-all duration-300 rounded-full"
              style={{ width: `${shippingProgress}%` }}
            />
          </div>
        </div>

        {/* 15-Minute Reservation Notice */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[11px] font-bold">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 shrink-0 animate-pulse" />
            <span>Vault Hold Active</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider opacity-80">1-of-1 Reserved (15m)</span>
        </div>

        {/* Mobile Item Cards */}
        <div className="space-y-3">
          {cart.map((item) => (
            <div
              key={item.product.id}
              className={`p-3.5 rounded-2xl border ${subCardBg} shadow-xs space-y-3 transition-all`}
            >
              <div className="flex items-start gap-3">
                {/* Product Image */}
                <div
                  onClick={() => navigateTo('product', item.product.slug)}
                  className="w-20 h-24 rounded-xl overflow-hidden shrink-0 border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 cursor-pointer"
                >
                  <img
                    src={item.product.images[0]}
                    alt={item.product.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 truncate">
                      {item.product.era} • {item.product.category}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 text-neutral-400 hover:text-[#e5341f] active:scale-90 transition-all cursor-pointer shrink-0"
                      title="Remove piece"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3
                    onClick={() => navigateTo('product', item.product.slug)}
                    className={`font-bold text-xs sm:text-sm line-clamp-2 ${textPrimary} active:text-[#e5341f] cursor-pointer`}
                  >
                    {item.product.title}
                  </h3>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                      isDark ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-100 text-neutral-700'
                    }`}>
                      Size: {item.selectedSize}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      {item.product.conditionGrade}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#0a0a0a] text-white">
                      1-of-1
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Quantity Controls & Price */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900 overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-7 text-center text-xs font-bold font-mono text-neutral-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[10px] text-neutral-400">1-of-1 Piece</span>
                </div>

                <div className="text-right">
                  <span className="text-base font-black font-mono text-[#e5341f]">
                    {formatPKR(item.product.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Promo Code Card (Mobile) */}
        <div className={`p-4 rounded-2xl border ${subCardBg} shadow-xs space-y-2.5`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${textPrimary}`}>Collector Discount Code</span>
            <button
              onClick={() => handleApplyPromo(undefined, 'JUTA10')}
              className="text-[10px] font-bold text-[#e5341f] underline cursor-pointer"
            >
              Use "JUTA10"
            </button>
          </div>

          <form onSubmit={handleApplyPromo} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter voucher code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-mono uppercase border ${
                isDark
                  ? 'bg-neutral-900 border-neutral-700 text-white placeholder-neutral-500'
                  : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400'
              } focus:outline-none`}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#0a0a0a] dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
            >
              Apply
            </button>
          </form>
          {promoError && <p className="text-[11px] text-[#e5341f] font-medium">{promoError}</p>}
        </div>

        {/* Price Breakdown Card (Mobile) */}
        <div className={`p-4 rounded-2xl border ${subCardBg} shadow-xs space-y-2.5 text-xs`}>
          <div className="flex justify-between text-neutral-400">
            <span>Items Subtotal</span>
            <span className={`font-mono font-bold ${textPrimary}`}>{formatPKR(cartSubtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-500 font-bold">
              <span>Collector Discount ({discountPercent}%)</span>
              <span className="font-mono">-{formatPKR(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-neutral-400">
            <span>Courier Delivery</span>
            <span>
              {shippingCost === 0 ? (
                <strong className="text-emerald-500 font-bold uppercase">FREE</strong>
              ) : (
                <span className={`font-mono ${textPrimary}`}>{formatPKR(shippingCost)}</span>
              )}
            </span>
          </div>

          <div className="flex justify-between text-neutral-400">
            <span>Estimated Sales Tax</span>
            <span className={`font-mono ${textPrimary}`}>{formatPKR(estimatedTax)}</span>
          </div>

          <div className={`pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center text-sm font-black ${textPrimary}`}>
            <span>Total Amount</span>
            <span className="text-base font-black font-mono text-[#e5341f]">
              {formatPKR(orderTotal)}
            </span>
          </div>
        </div>

        {/* Security Badge (Mobile) */}
        <div className="flex items-center justify-center space-x-2 text-[11px] text-neutral-400 text-center pt-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Bank-Grade 256-bit SSL Encrypted Checkout</span>
        </div>

        {/* Mobile Sticky Floating Bottom Action Bar */}
        <div className="fixed bottom-[74px] left-0 right-0 z-30 px-3 pointer-events-none">
          <div className={`pointer-events-auto max-w-md mx-auto p-3.5 rounded-3xl ${
            isDark
              ? 'bg-[#0a0a0a]/95 border-neutral-800 text-white shadow-2xl backdrop-blur-xl'
              : 'bg-white/95 border-neutral-200 text-[#0a0a0a] shadow-2xl backdrop-blur-xl'
          } border flex items-center justify-between gap-3`}>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block leading-none">
                Total Payable
              </span>
              <span className="text-base font-black font-mono text-[#e5341f] leading-tight">
                {formatPKR(orderTotal)}
              </span>
            </div>

            <button
              onClick={handleCheckoutClick}
              className="h-11 px-5 rounded-2xl bg-[#e5341f] hover:bg-[#c42912] text-white text-xs font-black uppercase tracking-wider flex items-center space-x-2 transition-transform active:scale-95 shadow-md cursor-pointer shrink-0"
            >
              <span>Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          DESKTOP VIEW (>= lg) - Exact Original Layout (Preserved Perfectly)
          ========================================================================= */}
      <div className="hidden lg:block max-w-7xl mx-auto px-6 lg:px-8 py-10 space-y-8">
        {/* Title */}
        <div className={`border-b ${isDark ? 'border-neutral-800' : 'border-[#0a0a0a]/10'} pb-4 flex items-center justify-between gap-2`}>
          <div>
            <h1 className={`text-3xl font-black tracking-tight ${textPrimary}`}>
              Shopping Bag ({totalItemsCount})
            </h1>
            <p className={`text-xs ${textMuted} mt-0.5`}>
              Review your 1-of-1 vintage pieces before proceeding to secure checkout.
            </p>
          </div>

          <button
            onClick={() => navigateTo('shop')}
            className={`text-xs font-bold ${textPrimary} hover:text-[#e5341f] flex items-center space-x-1 cursor-pointer`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className={`${cardBg} p-4 rounded-xl border`}>
          <div className={`flex items-center justify-between text-xs font-semibold ${textPrimary} mb-2`}>
            {freeShippingRemaining > 0 ? (
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#e5341f]" />
                Add <strong className="text-[#e5341f]">{formatPKR(freeShippingRemaining)}</strong> more to qualify for <strong>FREE Delivery</strong>!
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
                <Zap className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                You’ve unlocked FREE Delivery on this order!
              </span>
            )}
            <span className={`text-xs font-mono font-bold ${textMuted}`}>{shippingProgress}%</span>
          </div>
          <div className="w-full bg-[#0a0a0a]/10 dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#e5341f] h-full transition-all duration-300 rounded-full"
              style={{ width: `${shippingProgress}%` }}
            />
          </div>
        </div>

        {/* Main Grid: Items Table + Summary */}
        <div className="grid grid-cols-12 gap-12">
          {/* Left: Cart items */}
          <div className="col-span-8 space-y-4">
            <div className={`flex items-center justify-between text-xs font-bold uppercase tracking-wider ${textMuted} pb-2 border-b ${isDark ? 'border-neutral-800' : 'border-[#0a0a0a]/10'}`}>
              <span>Item &amp; Condition</span>
              <span>Subtotal</span>
            </div>

            <div className={`divide-y ${isDark ? 'divide-neutral-800' : 'divide-[#0a0a0a]/10'}`}>
              {cart.map((item) => (
                <div key={item.product.id} className="py-6 flex gap-6 first:pt-2">
                  {/* Image */}
                  <div
                    onClick={() => navigateTo('product', item.product.slug)}
                    className={`w-28 h-36 rounded-xl overflow-hidden shrink-0 border ${isDark ? 'border-neutral-800 bg-neutral-900' : 'border-[#0a0a0a]/10 bg-[#f4f4f4]'} cursor-pointer`}
                  >
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${textMuted}`}>
                            {item.product.era} • {item.product.category}
                          </span>
                          <h3
                            onClick={() => navigateTo('product', item.product.slug)}
                            className={`font-bold text-base ${textPrimary} hover:text-[#e5341f] transition-colors cursor-pointer mt-0.5`}
                          >
                            {item.product.title}
                          </h3>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className={`${textMuted} hover:text-[#e5341f] transition-colors p-1 cursor-pointer`}
                          title="Remove piece"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className={`mt-2 flex flex-wrap items-center gap-3 text-xs ${textMuted}`}>
                        <span>Size: <strong className={textPrimary}>{item.selectedSize}</strong></span>
                        <span>•</span>
                        <span>Grade: <strong className={textPrimary}>{item.product.conditionGrade}</strong></span>
                        <span>•</span>
                        <span className="bg-[#0a0a0a] dark:bg-white text-white dark:text-black text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded">
                          1-of-1 Vault
                        </span>
                      </div>
                    </div>

                    {/* Quantity & Item Total */}
                    <div className={`flex items-center justify-between pt-3 border-t ${isDark ? 'border-neutral-800' : 'border-[#0a0a0a]/5'} mt-3`}>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs ${textMuted}`}>Qty:</span>
                        <div className={`flex items-center border ${isDark ? 'border-neutral-700 bg-neutral-900' : 'border-[#0a0a0a]/15 bg-[#fafafa]'} rounded-md`}>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className={`px-2 py-0.5 text-xs ${textMuted} hover:${textPrimary}`}
                          >
                            -
                          </button>
                          <span className={`px-3 py-0.5 text-xs font-bold ${textPrimary}`}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className={`px-2 py-0.5 text-xs ${textMuted} hover:${textPrimary}`}
                          >
                            +
                          </button>
                        </div>
                        <span className={`text-[11px] ${textMuted} font-mono`}>
                          (Limit 1 per customer)
                        </span>
                      </div>

                      <div className="text-right">
                        <span className={`text-lg font-black ${textPrimary} font-mono`}>
                          {formatPKR(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={`flex justify-between items-center pt-4 border-t ${isDark ? 'border-neutral-800' : 'border-[#0a0a0a]/10'}`}>
              <button
                onClick={clearCart}
                className={`text-xs ${textMuted} hover:text-[#e5341f] underline cursor-pointer`}
              >
                Clear entire bag
              </button>
              <div className={`flex items-center space-x-1.5 text-xs ${textMuted}`}>
                <Clock className="w-3.5 h-3.5 text-[#e5341f]" />
                <span>Items reserved for 15 minutes</span>
              </div>
            </div>
          </div>

          {/* Right: Order Summary Sidebar */}
          <div className="col-span-4">
            <div className={`${cardBg} border rounded-2xl p-6 space-y-6 sticky top-28`}>
              <h2 className={`text-lg font-black tracking-tight ${textPrimary}`}>
                Order Summary
              </h2>

              {/* Price breakdown */}
              <div className={`space-y-3 text-xs divide-y ${isDark ? 'divide-neutral-800' : 'divide-[#0a0a0a]/10'}`}>
                <div className={`flex justify-between font-medium ${textPrimary} pt-1`}>
                  <span>Items Subtotal</span>
                  <span className="font-mono font-bold">{formatPKR(cartSubtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between font-bold text-emerald-500 pt-3">
                    <span>Collector Discount ({discountPercent}%)</span>
                    <span className="font-mono">-{formatPKR(discountAmount)}</span>
                  </div>
                )}

                <div className={`flex justify-between font-medium ${textPrimary} pt-3`}>
                  <span>Courier Delivery</span>
                  <span>
                    {shippingCost === 0 ? (
                      <strong className="text-emerald-500 font-bold uppercase">FREE</strong>
                    ) : (
                      <span className="font-mono">{formatPKR(shippingCost)}</span>
                    )}
                  </span>
                </div>

                <div className={`flex justify-between font-medium ${textPrimary} pt-3`}>
                  <span>Estimated Sales Tax</span>
                  <span className="font-mono">{formatPKR(estimatedTax)}</span>
                </div>

                <div className={`flex justify-between text-base font-black ${textPrimary} pt-4`}>
                  <span>Total Amount</span>
                  <span className="font-mono text-lg text-[#e5341f]">{formatPKR(orderTotal)}</span>
                </div>
              </div>

              {/* Promo Code Input */}
              <form onSubmit={handleApplyPromo} className="pt-2">
                <label className={`block text-xs font-bold ${textPrimary} mb-1.5`}>
                  Promo or Gift Card Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. JUTA10"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className={`border rounded-lg px-3 py-2 text-xs uppercase font-mono w-full focus:outline-none ${
                      isDark
                        ? 'bg-neutral-900 border-neutral-700 text-white focus:border-white'
                        : 'bg-white border-[#0a0a0a]/15 text-[#0a0a0a] focus:border-[#0a0a0a]'
                    }`}
                  />
                  <button
                    type="submit"
                    className="bg-[#e5341f] hover:bg-[#c42912] text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer shadow-xs"
                  >
                    Apply
                  </button>
                </div>
                {promoError && (
                  <p className="text-[11px] text-[#e5341f] mt-1 font-medium">{promoError}</p>
                )}
              </form>

              {/* Checkout Button */}
              <button
                onClick={handleCheckoutClick}
                className="w-full h-12 bg-[#e5341f] hover:bg-[#c42912] text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-lg active:scale-95"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className={`flex items-center justify-center space-x-2 text-[11px] ${textMuted}`}>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Bank-grade 256-bit SSL encrypted checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
