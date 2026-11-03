import React from 'react';
import { X, Trash2, ArrowRight, ShoppingBag, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { formatPKR } from '../utils/format';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    freeShippingThreshold,
    freeShippingRemaining,
    navigateTo,
    currentCustomer,
    setIsCheckoutGateOpen,
  } = useStore();

  if (!isCartOpen) return null;

  const shippingProgress = Math.min(
    100,
    Math.round((cartSubtotal / freeShippingThreshold) * 100)
  );

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    if (!currentCustomer) {
      setIsCheckoutGateOpen(true);
    } else {
      navigateTo('checkout');
    }
  };

  const handleViewCartPage = () => {
    setIsCartOpen(false);
    navigateTo('cart');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden font-sans">
        {/* Backdrop blur overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCartOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        />

        {/* Sliding Panel */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-[#0a0a0a]/10 sm:rounded-none"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#0a0a0a]/10 flex items-center justify-between bg-white">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-[#0a0a0a]" />
                <h2 className="text-lg font-black tracking-tight text-[#0a0a0a]">
                  Shopping Bag ({cart.reduce((s, i) => s + i.quantity, 0)})
                </h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-md text-[#0a0a0a]/60 hover:text-[#0a0a0a] hover:bg-[#fafafa] transition-colors cursor-pointer"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Progress Bar */}
            <div className="bg-[#fafafa] p-3.5 border-b border-[#0a0a0a]/10">
              <div className="flex items-center justify-between text-xs font-semibold text-[#0a0a0a] mb-1.5">
                {freeShippingRemaining > 0 ? (
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#e5341f]" />
                    Add <strong className="text-[#e5341f] font-bold">{formatPKR(freeShippingRemaining)}</strong> more for FREE Shipping!
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                    Unlocked! Free Standard Shipping on this order.
                  </span>
                )}
                <span className="text-[11px] text-[#0a0a0a]/50 font-mono">{shippingProgress}%</span>
              </div>
              <div className="w-full bg-[#0a0a0a]/10 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#e5341f] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${shippingProgress}%` }}
                />
              </div>
            </div>

            {/* Items List / Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-[#0a0a0a]/10">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#fafafa] border border-[#0a0a0a]/10 flex items-center justify-center text-[#0a0a0a]/30">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#0a0a0a]">Your bag is empty</h3>
                    <p className="text-xs text-[#0a0a0a]/60 mt-1 max-w-xs">
                      Curated 1-of-1 vintage pieces go fast. Explore our latest drops and archival workwear.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      navigateTo('shop');
                    }}
                    className="bg-[#0a0a0a] hover:bg-[#e5341f] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Explore Vintage Drops
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="py-4 flex gap-3.5 first:pt-0 last:pb-0">
                    {/* Thumbnail */}
                    <div
                      onClick={() => {
                        setIsCartOpen(false);
                        navigateTo('product', item.product.slug);
                      }}
                      className="w-20 h-24 bg-[#f4f4f4] rounded-lg overflow-hidden shrink-0 border border-[#0a0a0a]/10 cursor-pointer"
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
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            onClick={() => {
                              setIsCartOpen(false);
                              navigateTo('product', item.product.slug);
                            }}
                            className="font-bold text-xs sm:text-sm text-[#0a0a0a] hover:text-[#e5341f] transition-colors line-clamp-2 cursor-pointer"
                          >
                            {item.product.title}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-[#0a0a0a]/40 hover:text-[#e5341f] transition-colors p-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="mt-1 flex items-center space-x-2 text-[11px] text-[#0a0a0a]/60">
                          <span>Size: <strong className="text-[#0a0a0a]">{item.selectedSize}</strong></span>
                          <span>•</span>
                          <span className="text-[#e5341f] font-semibold">1-of-1 Grail</span>
                        </div>
                      </div>

                      {/* Quantity and Price */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#0a0a0a]/5">
                        <div className="flex items-center border border-[#0a0a0a]/15 rounded-md bg-[#fafafa]">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="px-2 py-0.5 text-xs text-[#0a0a0a]/70 hover:text-[#0a0a0a] hover:bg-white"
                          >
                            -
                          </button>
                          <span className="px-2.5 py-0.5 text-xs font-bold text-[#0a0a0a]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="px-2 py-0.5 text-xs text-[#0a0a0a]/70 hover:text-[#0a0a0a] hover:bg-white"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-black text-sm text-[#0a0a0a]">
                          {formatPKR(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary & Triggers */}
            {cart.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-[#0a0a0a]/10 bg-[#fafafa] space-y-3">
                {/* 1-of-1 Disclaimer */}
                <div className="flex items-center space-x-2 text-[11px] text-[#0a0a0a]/70 bg-white p-2.5 rounded-lg border border-[#0a0a0a]/10">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Items held in bag for 15 minutes due to high collector demand.</span>
                </div>

                {/* Subtotal */}
                <div className="flex items-center justify-between text-sm font-semibold text-[#0a0a0a]">
                  <span>Subtotal</span>
                  <span className="text-base font-black">{formatPKR(cartSubtotal)}</span>
                </div>

                <p className="text-[11px] text-[#0a0a0a]/50">
                  Taxes and calculated shipping computed at next step.
                </p>

                {/* Main Checkout Trigger */}
                <button
                  onClick={handleCheckoutClick}
                  className="w-full h-12 bg-[#0a0a0a] hover:bg-[#e5341f] text-white font-bold text-sm tracking-tight rounded-lg flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-md"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Secondary View Full Cart Page Button */}
                <button
                  onClick={handleViewCartPage}
                  className="w-full text-center text-xs font-semibold text-[#0a0a0a]/70 hover:text-[#0a0a0a] py-1 cursor-pointer"
                >
                  View Full Cart &amp; Breakdown
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
