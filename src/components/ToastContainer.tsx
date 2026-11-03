import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, ShoppingBag, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-[#e5341f] shrink-0" />;
      case 'cart':
        return <ShoppingBag className="w-4 h-4 text-[#e5341f] shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-[#0a0a0a] shrink-0" />;
    }
  };

  const getBarColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500';
      case 'error':
        return 'bg-[#e5341f]';
      case 'cart':
        return 'bg-[#e5341f]';
      default:
        return 'bg-slate-900';
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none font-sans px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="pointer-events-auto bg-white border border-[#0a0a0a]/15 shadow-xl rounded-xl p-3.5 flex flex-col relative overflow-hidden text-xs"
          >
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">{getIcon(toast.type)}</div>
              <div className="flex-1">
                <p className="font-bold text-[#0a0a0a]">{toast.title}</p>
                {toast.message && (
                  <p className="text-[#0a0a0a]/70 mt-0.5 leading-relaxed">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-[#0a0a0a]/40 hover:text-[#0a0a0a] p-1 rounded transition-colors cursor-pointer"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Temporary Progress Bar to visualize non-permanent view */}
            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2.5">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: (toast.duration || 3500) / 1000, ease: 'linear' }}
                className={`h-full ${getBarColor(toast.type)}`}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
