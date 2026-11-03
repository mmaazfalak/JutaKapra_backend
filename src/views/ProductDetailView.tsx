import React, { useState } from 'react';
import {
  ShoppingBag,
  ShieldCheck,
  Zap,
  Ruler,
  ChevronRight,
  Share2,
  Check,
  RotateCcw,
  Tag,
  ArrowLeft,
  Eye,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { formatPKR } from '../utils/format';

export const ProductDetailView: React.FC = () => {
  const {
    productParam,
    getProductBySlugOrId,
    addToCart,
    navigateTo,
    products,
    stores,
    addToast,
    themeMode,
  } = useStore();

  // Find product by slug or id
  const product = productParam ? getProductBySlugOrId(productParam) : products[0];

  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const isDark = themeMode === 'dark';

  if (!product) {
    return (
      <div className={`max-w-7xl mx-auto px-4 py-20 text-center font-sans ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-[#0a0a0a]'}`}>
        <h2 className="text-2xl font-black">Archival Item Not Found</h2>
        <p className={`text-xs mt-2 ${isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/60'}`}>
          This piece may have been acquired by another collector or removed from the archive.
        </p>
        <button
          onClick={() => navigateTo('shop')}
          className="mt-6 inline-flex items-center space-x-2 bg-[#e5341f] text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>
      </div>
    );
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast({
      type: 'info',
      title: 'Link Copied',
      message: 'Product link copied to your clipboard.',
    });
  };

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  // Hidden store filter
  const hiddenStoreIds = new Set(
    stores.filter((s) => s.isHidden || s.status === 'suspended').map((s) => s.id)
  );

  // Related products in same category (sold-out items strictly moved to the last)
  const relatedProducts = products
    .filter(
      (p) =>
        p.id !== product.id &&
        p.category === product.category &&
        !p.isHidden &&
        !p.isArchived &&
        (!p.storeId || !hiddenStoreIds.has(p.storeId))
    )
    .sort((a, b) => {
      const aStock = a.inStock && (a.stockCount === undefined || a.stockCount > 0);
      const bStock = b.inStock && (b.stockCount === undefined || b.stockCount > 0);
      if (aStock && !bStock) return -1;
      if (!aStock && bStock) return 1;
      return 0;
    })
    .slice(0, 3);

  // Dynamic Theme Styling
  const pageBg = isDark ? 'bg-[#0a0a0a] text-neutral-100' : 'bg-white text-[#0a0a0a]';
  const cardBg = isDark ? 'bg-[#111317] border-neutral-800/90' : 'bg-[#fafafa] border-[#0a0a0a]/15';
  const subCardBg = isDark ? 'bg-[#161922] border-neutral-800' : 'bg-[#f7f7f7] border-neutral-200/80';
  const textPrimary = isDark ? 'text-white' : 'text-[#0a0a0a]';
  const textMuted = isDark ? 'text-neutral-400' : 'text-[#0a0a0a]/60';

  return (
    <div className={`w-full font-sans ${pageBg}`}>
      {/* =========================================================================
          MOBILE PHONE VIEW ONLY (< lg) - Compact & Ergonomic Native Redesign
          ========================================================================= */}
      <div className="lg:hidden px-4 py-4 space-y-4 pb-36">
        {/* Mobile Top Action Bar */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => navigateTo('shop')}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#e5341f] active:scale-95 transition-transform cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Catalog</span>
          </button>

          <div className="flex items-center space-x-2 text-[11px] text-neutral-400">
            <span className="font-mono font-bold text-neutral-500 truncate max-w-[120px]">
              {product.id}
            </span>
            <span>•</span>
            <button
              onClick={handleCopyLink}
              className="p-1 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:text-[#e5341f] active:scale-90 transition-all cursor-pointer"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Compact Mobile Image Gallery */}
        <div className="space-y-2.5">
          <div className="relative aspect-[4/5] sm:aspect-square w-full rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <img
              src={product.images[activeImageIdx] || product.images[0]}
              alt={product.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />

            {/* Badges on main image */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
              <span className="bg-[#0a0a0a]/90 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider shadow-xs backdrop-blur-sm">
                1-OF-1 VAULT
              </span>
              {hasDiscount && (
                <span className="bg-[#e5341f] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider shadow-xs">
                  SALE
                </span>
              )}
            </div>

            {/* Sold Out Overlay */}
            {!product.inStock && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                <div className="bg-[#e5341f] text-white font-black text-xs uppercase px-4 py-2 rounded-xl tracking-widest shadow-lg">
                  1-OF-1 SOLD OUT
                </div>
              </div>
            )}
          </div>

          {/* Mini Thumbnail Strip (Mobile) */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-14 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    activeImageIdx === idx
                      ? 'border-[#e5341f] scale-105 shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-800 opacity-60'
                  }`}
                >
                  <img
                    src={img}
                    alt={`View ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Professional Luxury Title & Pricing Section */}
        <div className={`p-4 sm:p-5 rounded-2xl border ${
          isDark
            ? 'bg-[#111317]/90 border-neutral-800 shadow-lg shadow-black/40'
            : 'bg-white border-neutral-200/90 shadow-sm'
        } space-y-3.5`}>
          {/* Top Row: Category, Era & Size */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 overflow-hidden">
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800/90 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700/60 shrink-0">
                <Sparkles className="w-3 h-3 text-[#e5341f]" />
                <span>{product.era}</span>
              </span>
              <span className="text-[11px] font-bold text-neutral-500 truncate">
                {product.category}
              </span>
            </div>

            {/* Size Badge */}
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider bg-[#e5341f] text-white shadow-xs shrink-0">
              SIZE {product.size}
            </span>
          </div>

          {/* Product Title */}
          <h1 className={`text-base sm:text-lg font-black tracking-tight leading-snug ${textPrimary}`}>
            {product.title}
          </h1>

          {/* Condition Grade Banner */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/70 dark:border-neutral-800 text-xs">
            <div className="flex items-center space-x-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="flex items-center space-x-1.5 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Grade:</span>
                <span className={`text-xs font-bold truncate ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                  {product.conditionGrade}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 shrink-0 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>1-of-1 Vault</span>
            </span>
          </div>

          {/* Price & Savings Display */}
          <div className="pt-1 flex items-end justify-between border-t border-neutral-100 dark:border-neutral-800/80">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                Archival Price
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black font-mono text-[#e5341f] tracking-tight">
                  {formatPKR(product.price)}
                </span>
                {hasDiscount && (
                  <span className="text-xs font-bold text-neutral-400 line-through">
                    {formatPKR(product.originalPrice!)}
                  </span>
                )}
              </div>
            </div>

            {hasDiscount && (
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  SAVE {formatPKR(product.originalPrice! - product.price)}
                </span>
                <span className="text-[9px] text-neutral-400 mt-0.5 font-medium">
                  {Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)}% OFF
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Compact Exact Hand Measurements Card */}
        <div className={`p-4 rounded-2xl border ${subCardBg} shadow-xs space-y-2.5`}>
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-xs font-bold text-neutral-400">
              <Ruler className="w-3.5 h-3.5 text-[#e5341f]" />
              <span>Exact Measurements ({product.size})</span>
            </span>
            <button
              onClick={() => navigateTo('condition-guide')}
              className="text-[10px] font-bold text-[#e5341f] underline cursor-pointer"
            >
              Guide
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {product.measurements.chest && (
              <div className={`p-2 rounded-xl ${isDark ? 'bg-black/30' : 'bg-white'} border border-neutral-200/60 dark:border-neutral-800 flex justify-between`}>
                <span className="text-neutral-400 text-[11px]">Chest:</span>
                <span className={`font-bold font-mono ${textPrimary}`}>{product.measurements.chest}</span>
              </div>
            )}
            {product.measurements.length && (
              <div className={`p-2 rounded-xl ${isDark ? 'bg-black/30' : 'bg-white'} border border-neutral-200/60 dark:border-neutral-800 flex justify-between`}>
                <span className="text-neutral-400 text-[11px]">Length:</span>
                <span className={`font-bold font-mono ${textPrimary}`}>{product.measurements.length}</span>
              </div>
            )}
            {product.measurements.shoulders && (
              <div className={`p-2 rounded-xl ${isDark ? 'bg-black/30' : 'bg-white'} border border-neutral-200/60 dark:border-neutral-800 flex justify-between`}>
                <span className="text-neutral-400 text-[11px]">Shoulders:</span>
                <span className={`font-bold font-mono ${textPrimary}`}>{product.measurements.shoulders}</span>
              </div>
            )}
            {product.measurements.inseam && (
              <div className={`p-2 rounded-xl ${isDark ? 'bg-black/30' : 'bg-white'} border border-neutral-200/60 dark:border-neutral-800 flex justify-between`}>
                <span className="text-neutral-400 text-[11px]">Inseam:</span>
                <span className={`font-bold font-mono ${textPrimary}`}>{product.measurements.inseam}</span>
              </div>
            )}
            {product.measurements.waist && (
              <div className={`p-2 rounded-xl ${isDark ? 'bg-black/30' : 'bg-white'} border border-neutral-200/60 dark:border-neutral-800 flex justify-between`}>
                <span className="text-neutral-400 text-[11px]">Waist:</span>
                <span className={`font-bold font-mono ${textPrimary}`}>{product.measurements.waist}</span>
              </div>
            )}
            {product.measurements.shoeSize && (
              <div className={`p-2 rounded-xl ${isDark ? 'bg-black/30' : 'bg-white'} border border-neutral-200/60 dark:border-neutral-800 flex justify-between`}>
                <span className="text-neutral-400 text-[11px]">Shoe Size:</span>
                <span className={`font-bold font-mono ${textPrimary}`}>{product.measurements.shoeSize}</span>
              </div>
            )}
          </div>
        </div>

        {/* Condition & Authentication Checkpoints */}
        <div className={`p-4 rounded-2xl border ${subCardBg} shadow-xs space-y-2.5`}>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className={`text-xs font-bold ${textPrimary}`}>
              Authenticity &amp; Provenance
            </span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {product.description}
          </p>
          <div className="space-y-1.5 pt-1">
            {product.details.map((detail, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-xs text-neutral-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Related Products (Mobile) */}
        {relatedProducts.length > 0 && (
          <div className="pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-black tracking-tight ${textPrimary}`}>
                More from {product.category}
              </h3>
              <button
                onClick={() => navigateTo('shop')}
                className="text-xs font-bold text-[#e5341f]"
              >
                View all &rarr;
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {relatedProducts.slice(0, 2).map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}

        {/* Floating Mobile Sticky Action Bar */}
        <div className="fixed bottom-[74px] left-0 right-0 z-30 px-3 pointer-events-none">
          <div className={`pointer-events-auto max-w-md mx-auto p-3 rounded-3xl ${
            isDark
              ? 'bg-[#0a0a0a]/95 border-neutral-800 text-white shadow-2xl backdrop-blur-xl'
              : 'bg-white/95 border-neutral-200 text-[#0a0a0a] shadow-2xl backdrop-blur-xl'
          } border flex items-center justify-between gap-3`}>
            <div className="min-w-0 pl-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block leading-none truncate">
                Size {product.size} • 1-of-1
              </span>
              <span className="text-base font-black font-mono text-[#e5341f] leading-tight">
                {formatPKR(product.price)}
              </span>
            </div>

            <button
              onClick={() => addToCart(product)}
              disabled={!product.inStock}
              className={`h-11 px-5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-transform active:scale-95 shadow-md cursor-pointer shrink-0 ${
                product.inStock
                  ? 'bg-[#e5341f] hover:bg-[#c42912] text-white'
                  : 'bg-neutral-800 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{product.inStock ? 'Claim Piece' : 'Sold Out'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          DESKTOP VIEW (>= lg) - Exact Original Layout (Preserved Perfectly)
          ========================================================================= */}
      <div className="hidden lg:block max-w-7xl mx-auto px-6 lg:px-8 py-10 space-y-12">
        {/* Top Breadcrumb navigation */}
        <div className={`flex items-center justify-between border-b ${isDark ? 'border-neutral-800' : 'border-[#0a0a0a]/10'} pb-4`}>
          <button
            onClick={() => navigateTo('shop')}
            className={`inline-flex items-center space-x-1.5 text-xs font-bold ${textMuted} hover:${textPrimary} transition-colors cursor-pointer`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Archive</span>
          </button>

          <div className={`flex items-center space-x-3 text-xs ${textMuted}`}>
            <span>Item SKU: <strong className={`${textPrimary} font-mono`}>{product.id}</strong></span>
            <span>•</span>
            <button
              onClick={handleCopyLink}
              className={`flex items-center space-x-1 hover:${textPrimary} cursor-pointer`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Main PDP Grid */}
        <div className="grid grid-cols-12 gap-14">
          {/* Left Column: High-Res Multi-Image Gallery */}
          <div className="col-span-7 space-y-4">
            {/* Main High-Res Image with Zoom on Hover */}
            <div
              className={`relative aspect-[4/5] rounded-2xl overflow-hidden ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-[#f4f4f4] border-[#0a0a0a]/15'} border shadow-sm cursor-crosshair`}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <img
                src={product.images[activeImageIdx] || product.images[0]}
                alt={product.title}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover transition-transform duration-200 ${
                  isZoomed ? 'scale-150' : 'scale-100'
                }`}
                style={
                  isZoomed
                    ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
                    : undefined
                }
              />

              {/* Badges on main image */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                <span className="bg-[#0a0a0a] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider">
                  1-OF-1 PIECE
                </span>
                {hasDiscount && (
                  <span className="bg-[#e5341f] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider">
                    SALE ARCHIVE
                  </span>
                )}
              </div>

              {/* Sold Out Overlay */}
              {!product.inStock && (
                <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center">
                  <div className="bg-[#0a0a0a] text-white font-black text-sm uppercase px-5 py-2.5 rounded-lg tracking-widest">
                    ITEM SOLD TO COLLECTOR
                  </div>
                </div>
              )}

              {/* Hover hint */}
              <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded pointer-events-none flex items-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>Hover to Magnify 150%</span>
              </div>
            </div>

            {/* Thumbnail Rail */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-24 h-28 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activeImageIdx === idx
                        ? 'border-[#e5341f] shadow-md'
                        : isDark ? 'border-neutral-800 opacity-60 hover:opacity-100' : 'border-[#0a0a0a]/15 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`View ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Vintage Disclaimers Box */}
            <div className={`${cardBg} rounded-xl p-5 space-y-2 text-xs ${textMuted} border`}>
              <div className={`flex items-center space-x-2 font-bold ${textPrimary}`}>
                <AlertCircle className="w-4 h-4 text-[#e5341f]" />
                <span>1-of-1 Vintage Item Disclaimer</span>
              </div>
              <p className="leading-relaxed">
                This is an authentic pre-owned vintage garment from {product.era}. Due to age and natural patina, vintage sizing often differs from modern tagged sizing. Please refer strictly to our hand-measured specifications on the right before ordering.
              </p>
            </div>
          </div>

          {/* Right Column: Garment Specs, Condition, and Checkout */}
          <div className="col-span-5 space-y-6">
            <div>
              {/* Era & Category */}
              <div className={`flex items-center space-x-2 text-xs font-bold uppercase tracking-wider ${textMuted} mb-2`}>
                <span>{product.era}</span>
                <span>•</span>
                <span>{product.category}</span>
                <span>•</span>
                <span className="text-[#e5341f]">Drop {product.dropBatch || 'Vault Batch'}</span>
              </div>

              {/* Title */}
              <h1 className={`text-3xl font-black tracking-tight ${textPrimary} leading-tight`}>
                {product.title}
              </h1>

              {/* Price & Tag */}
              <div className="flex items-baseline space-x-3 mt-4">
                <span className="text-3xl font-black tracking-tight text-[#e5341f] font-mono">
                  {formatPKR(product.price)}
                </span>
                {hasDiscount && (
                  <span className={`text-lg font-bold ${textMuted} line-through`}>
                    {formatPKR(product.originalPrice!)}
                  </span>
                )}
                {hasDiscount && (
                  <span className="bg-[#e5341f]/10 text-[#e5341f] text-xs font-black uppercase px-2.5 py-1 rounded">
                    SAVE {formatPKR(product.originalPrice! - product.price)}
                  </span>
                )}
              </div>
            </div>

            {/* Condition Grade Chip */}
            <div className={`p-4 rounded-xl ${cardBg} border flex items-start space-x-3`}>
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className={`text-xs font-black uppercase tracking-wider ${textPrimary}`}>
                  Verified Condition Grade:
                </div>
                <div className={`text-sm font-bold ${textPrimary}`}>
                  {product.conditionGrade}
                </div>
                <p className={`text-xs ${textMuted} leading-relaxed`}>
                  Inspected under ultraviolet light for repairs, odor-free, sanitized, and stored in archival cotton bags.
                </p>
              </div>
            </div>

            {/* Measurements Table */}
            <div className="space-y-3">
              <div className={`flex items-center justify-between text-xs font-bold ${textPrimary}`}>
                <span className="flex items-center space-x-1.5">
                  <Ruler className="w-4 h-4" />
                  <span>Exact Hand Measurements ({product.size})</span>
                </span>
                <button
                  onClick={() => navigateTo('condition-guide')}
                  className="text-[#e5341f] hover:underline cursor-pointer"
                >
                  Measurement Guide
                </button>
              </div>

              <div className={`${cardBg} border rounded-xl p-4 divide-y ${isDark ? 'divide-neutral-800' : 'divide-[#0a0a0a]/10'} text-xs`}>
                {product.measurements.chest && (
                  <div className="py-2 flex justify-between first:pt-0">
                    <span className={textMuted}>Pit to Pit (Chest):</span>
                    <span className={`font-bold ${textPrimary}`}>{product.measurements.chest}</span>
                  </div>
                )}
                {product.measurements.length && (
                  <div className="py-2 flex justify-between">
                    <span className={textMuted}>Collar to Hem (Length):</span>
                    <span className={`font-bold ${textPrimary}`}>{product.measurements.length}</span>
                  </div>
                )}
                {product.measurements.shoulders && (
                  <div className="py-2 flex justify-between">
                    <span className={textMuted}>Shoulder Width:</span>
                    <span className={`font-bold ${textPrimary}`}>{product.measurements.shoulders}</span>
                  </div>
                )}
                {product.measurements.inseam && (
                  <div className="py-2 flex justify-between">
                    <span className={textMuted}>Inseam:</span>
                    <span className={`font-bold ${textPrimary}`}>{product.measurements.inseam}</span>
                  </div>
                )}
                {product.measurements.waist && (
                  <div className="py-2 flex justify-between">
                    <span className={textMuted}>Waist:</span>
                    <span className={`font-bold ${textPrimary}`}>{product.measurements.waist}</span>
                  </div>
                )}
                {product.measurements.shoeSize && (
                  <div className="py-2 flex justify-between last:pb-0">
                    <span className={textMuted}>Footwear Specs:</span>
                    <span className={`font-bold ${textPrimary}`}>{product.measurements.shoeSize}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Add to Cart Actions (Desktop) */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => addToCart(product)}
                disabled={!product.inStock}
                className={`w-full h-14 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center space-x-2 transition-all duration-200 cursor-pointer shadow-lg active:scale-95 ${
                  product.inStock
                    ? 'bg-[#e5341f] hover:bg-[#c42912] text-white'
                    : 'bg-neutral-800 text-neutral-400 cursor-not-allowed'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                <span>
                  {product.inStock
                    ? `Claim 1-of-1 Item • ${formatPKR(product.price)}`
                    : 'Sold Out (1-of-1 Claimed)'}
                </span>
              </button>

              <div className={`flex items-center justify-between text-[11px] ${textMuted} px-1`}>
                <span className="flex items-center space-x-1">
                  <Zap className="w-3.5 h-3.5 text-[#e5341f]" />
                  <span>Free Insured Delivery (Over Rs. 5,000)</span>
                </span>
                <span>15-Day Authenticity Guarantee</span>
              </div>
            </div>

            {/* Description & Detailed Checklist */}
            <div className={`pt-4 border-t ${isDark ? 'border-neutral-800' : 'border-[#0a0a0a]/10'} space-y-4`}>
              <div>
                <h3 className={`text-xs font-black uppercase tracking-wider ${textPrimary} mb-2`}>
                  Curator Notes &amp; Provenance
                </h3>
                <p className={`text-xs sm:text-sm ${textMuted} leading-relaxed`}>
                  {product.description}
                </p>
              </div>

              {/* Checklist details */}
              <div>
                <h4 className={`text-xs font-black uppercase tracking-wider ${textPrimary} mb-2.5`}>
                  Authentication Checkpoints
                </h4>
                <ul className={`space-y-2 text-xs ${textMuted}`}>
                  {product.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Rail (Desktop) */}
        {relatedProducts.length > 0 && (
          <div className={`pt-12 border-t ${isDark ? 'border-neutral-800' : 'border-[#0a0a0a]/10'} space-y-6`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-xl font-black tracking-tight ${textPrimary}`}>
                More from {product.category}
              </h3>
              <button
                onClick={() => navigateTo('shop')}
                className="text-xs font-bold text-[#e5341f] hover:underline cursor-pointer"
              >
                View Full Collection &rarr;
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
