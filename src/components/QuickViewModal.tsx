import React, { useState } from 'react';
import { X, ShoppingBag, Eye, ShieldCheck, ArrowRight, Ruler } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatPKR } from '../utils/format';

export const QuickViewModal: React.FC = () => {
  const { quickViewProduct, setQuickViewProduct, addToCart, navigateTo } = useStore();
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  if (!quickViewProduct) return null;

  const hasDiscount =
    quickViewProduct.originalPrice &&
    quickViewProduct.originalPrice > quickViewProduct.price;

  const handleClose = () => {
    setQuickViewProduct(null);
    setSelectedImageIdx(0);
  };

  const handleAddToCart = () => {
    addToCart(quickViewProduct);
    handleClose();
  };

  const handleGoToPDP = () => {
    const slug = quickViewProduct.slug;
    handleClose();
    navigateTo('product', slug);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10 border border-[#0a0a0a]/15 flex flex-col md:flex-row max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#0a0a0a] flex items-center justify-center shadow-md border border-[#0a0a0a]/10 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Side: Images */}
        <div className="w-full md:w-1/2 bg-[#f4f4f4] p-4 flex flex-col justify-between shrink-0">
          <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-[#0a0a0a]/10 bg-white">
            <img
              src={quickViewProduct.images[selectedImageIdx] || quickViewProduct.images[0]}
              alt={quickViewProduct.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {quickViewProduct.is1of1 && (
              <span className="absolute top-3 left-3 bg-[#0a0a0a] text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider">
                1-OF-1 GRAIL
              </span>
            )}
          </div>

          {/* Image Thumbnails */}
          {quickViewProduct.images.length > 1 && (
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
              {quickViewProduct.images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-14 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    selectedImageIdx === idx
                      ? 'border-[#e5341f] scale-105 shadow-sm'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Thumbnail ${idx}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Product Meta & Triggers */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Header info */}
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0a0a0a]/50 uppercase tracking-wider mb-1.5">
              <span>{quickViewProduct.era}</span>
              <span>•</span>
              <span>{quickViewProduct.category}</span>
              <span>•</span>
              <span className="text-[#e5341f] font-bold">1-of-1 Item</span>
            </div>

            {/* Title */}
            <h2 className="text-lg font-black tracking-tight text-[#0a0a0a] leading-snug">
              {quickViewProduct.title}
            </h2>

            {/* Pricing */}
            <div className="flex items-baseline space-x-3 mt-2.5">
              <span className="text-2xl font-black text-[#0a0a0a] tracking-tight">
                {formatPKR(quickViewProduct.price)}
              </span>
              {hasDiscount && (
                <span className="text-sm font-bold text-[#0a0a0a]/40 line-through">
                  {formatPKR(quickViewProduct.originalPrice!)}
                </span>
              )}
              {hasDiscount && (
                <span className="bg-[#e5341f]/10 text-[#e5341f] text-[11px] font-extrabold px-2 py-0.5 rounded">
                  SAVE {formatPKR(quickViewProduct.originalPrice! - quickViewProduct.price)}
                </span>
              )}
            </div>

            {/* Condition Grade Chip */}
            <div className="mt-3.5 p-2.5 rounded-lg bg-[#fafafa] border border-[#0a0a0a]/10 flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-[#0a0a0a]">
                  Condition: {quickViewProduct.conditionGrade}
                </div>
                <div className="text-[#0a0a0a]/60 text-[11px] mt-0.5">
                  Professionally steam-cleaned &amp; inspected by Juta Kapra curators.
                </div>
              </div>
            </div>

            {/* Measurements */}
            <div className="mt-3.5">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#0a0a0a] mb-1.5">
                <Ruler className="w-3.5 h-3.5 text-[#0a0a0a]/70" />
                <span>Garment Specs ({quickViewProduct.size}):</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-[#0a0a0a]/80 bg-[#fafafa] p-2.5 rounded-lg border border-[#0a0a0a]/10">
                {quickViewProduct.measurements.chest && (
                  <div>Chest: <strong className="font-semibold text-[#0a0a0a]">{quickViewProduct.measurements.chest}</strong></div>
                )}
                {quickViewProduct.measurements.length && (
                  <div>Length: <strong className="font-semibold text-[#0a0a0a]">{quickViewProduct.measurements.length}</strong></div>
                )}
                {quickViewProduct.measurements.shoulders && (
                  <div>Shoulders: <strong className="font-semibold text-[#0a0a0a]">{quickViewProduct.measurements.shoulders}</strong></div>
                )}
                {quickViewProduct.measurements.inseam && (
                  <div>Inseam: <strong className="font-semibold text-[#0a0a0a]">{quickViewProduct.measurements.inseam}</strong></div>
                )}
                {quickViewProduct.measurements.shoeSize && (
                  <div>Shoe: <strong className="font-semibold text-[#0a0a0a]">{quickViewProduct.measurements.shoeSize}</strong></div>
                )}
              </div>
            </div>

            <p className="mt-3 text-xs text-[#0a0a0a]/70 line-clamp-2">
              {quickViewProduct.description}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-3 border-t border-[#0a0a0a]/10">
            <button
              onClick={handleAddToCart}
              disabled={!quickViewProduct.inStock}
              className={`w-full h-11 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors cursor-pointer ${
                quickViewProduct.inStock
                  ? 'bg-[#0a0a0a] hover:bg-[#e5341f] text-white shadow-md'
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{quickViewProduct.inStock ? 'Add to Bag (1-of-1)' : 'Sold Out'}</span>
            </button>

            <button
              onClick={handleGoToPDP}
              className="w-full text-center py-2 text-xs font-bold text-[#0a0a0a] hover:text-[#e5341f] flex items-center justify-center space-x-1 transition-colors cursor-pointer"
            >
              <span>View Full Inspection &amp; Story</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
