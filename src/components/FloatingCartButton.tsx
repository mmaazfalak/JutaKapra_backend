import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const FloatingCartButton: React.FC = () => {
  const { cartCount, setIsCartOpen, isCartOpen } = useStore();

  // If cart drawer is already open, hide floating button to avoid overlap
  if (isCartOpen) return null;

  return (
    <div className="hidden md:block fixed bottom-6 right-6 z-40 sm:bottom-8 sm:right-8">
      <motion.button
        type="button"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsCartOpen(true)}
        className="relative group flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#0a0a0a] text-white shadow-2xl border-2 border-white/20 hover:border-[#e5341f] hover:bg-[#e5341f] transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#e5341f]/30"
        aria-label={`Open shopping bag with ${cartCount} items`}
        title={`Shopping Bag (${cartCount} ${cartCount === 1 ? 'item' : 'items'})`}
      >
        <ShoppingBag className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-200" />

        {/* Live Cart Item Count Badge */}
        <AnimatePresence>
          {cartCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1.5 -right-1.5 bg-[#e5341f] group-hover:bg-white group-hover:text-[#e5341f] text-white font-black text-xs min-w-[24px] h-6 px-1.5 rounded-full flex items-center justify-center border-2 border-white shadow-md transition-colors"
            >
              {cartCount > 99 ? '99+' : cartCount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Hover Pulse Ring */}
        <span className="absolute inset-0 rounded-full border border-white/10 group-hover:border-[#e5341f]/50 pointer-events-none" />
      </motion.button>
    </div>
  );
};
