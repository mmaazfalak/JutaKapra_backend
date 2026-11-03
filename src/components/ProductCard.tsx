import React from 'react';
import { ShoppingBag, Eye, Check, AlertCircle, Plus } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { formatPKR } from '../utils/format';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { navigateTo, addToCart, setQuickViewProduct } = useStore();

  const handleCardClick = () => {
    navigateTo('product', product.slug);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.inStock) return;
    addToCart(product);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickViewProduct(product);
  };

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <div
      onClick={handleCardClick}
      className="group flex flex-col bg-white border border-[#0a0a0a]/10 hover:border-[#0a0a0a]/40 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer relative shadow-xs hover:shadow-md select-none"
      id={`product-card-${product.id}`}
    >
      {/* Top Image Container with Consistent 4:5 Portrait Ratio */}
      <div className="relative aspect-[4/5] bg-[#f4f4f4] overflow-hidden w-full">
        <img
          src={product.images[0]}
          alt={product.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex flex-col gap-1 items-start z-10 pointer-events-none">
          {product.is1of1 && product.inStock && (
            <span className="bg-[#0a0a0a] text-white text-[8.5px] sm:text-[10px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider shadow-sm">
              1-OF-1
            </span>
          )}

          {product.isHotDeal && product.inStock && (
            <span className="bg-[#e5341f] text-white text-[8.5px] sm:text-[10px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider shadow-sm">
              SALE
            </span>
          )}
        </div>

        {/* Stock Status Sold Out Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[1.5px] flex items-center justify-center z-20">
            <span className="bg-[#0a0a0a] text-white font-black text-[10px] sm:text-xs uppercase px-2.5 py-1 sm:px-3 sm:py-1.5 rounded tracking-widest shadow-sm">
              SOLD OUT
            </span>
          </div>
        )}

        {/* Desktop Quick-View & Add Overlay (Hidden on Mobile) */}
        <div className="absolute inset-x-2 bottom-2 hidden sm:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            onClick={handleQuickView}
            className="flex-1 bg-white/95 hover:bg-white text-[#0a0a0a] text-xs font-bold py-2 px-3 rounded-lg shadow-md border border-[#0a0a0a]/10 flex items-center justify-center space-x-1 transition-all"
            title="Quick View"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>

          {product.inStock && (
            <button
              onClick={handleAddToCart}
              className="bg-[#0a0a0a] hover:bg-[#e5341f] text-white p-2 rounded-lg shadow-md transition-colors"
              title="Add to Bag"
              aria-label="Add to Bag"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between gap-1.5 sm:gap-2.5">
        <div>
          {/* Era & Category Meta + Size Tag */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11.5px] font-semibold text-[#0a0a0a]/50 uppercase tracking-wider mb-1 gap-1">
            <span className="truncate">
              {product.era} • {product.category.replace('Vintage ', '')}
            </span>
            <span className="bg-[#fafafa] border border-[#0a0a0a]/10 px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] text-[#0a0a0a]/80 font-bold shrink-0">
              {product.size}
            </span>
          </div>

          {/* Title (max 2 lines) */}
          <h3 className="font-bold text-xs sm:text-sm text-[#0a0a0a] line-clamp-2 leading-tight sm:leading-snug group-hover:text-[#e5341f] transition-colors">
            {product.title}
          </h3>

          {/* Vintage Grade tag */}
          <p className="mt-1 text-[9.5px] sm:text-[11px] font-medium text-[#0a0a0a]/60 line-clamp-1">
            Grade: <span className="font-semibold text-[#0a0a0a]/80">{product.conditionGrade}</span>
          </p>
        </div>

        {/* Pricing & Cart Action Row */}
        <div className="pt-1.5 sm:pt-2 border-t border-[#0a0a0a]/8 flex items-center justify-between mt-auto gap-1">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5">
            <span className="font-black text-xs sm:text-base tracking-tight text-[#0a0a0a]">
              {formatPKR(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-[9.5px] sm:text-xs font-semibold text-[#0a0a0a]/40 line-through">
                {formatPKR(product.originalPrice!)}
              </span>
            )}
          </div>

          {/* Mobile Direct Add to Bag Button (Tactile Luxury Redesign) */}
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className={`sm:hidden h-8 px-2.5 rounded-full flex items-center space-x-1.5 transition-all cursor-pointer ${
              product.inStock
                ? 'bg-[#0a0a0a] hover:bg-[#e5341f] active:scale-90 text-white shadow-xs border border-white/10'
                : 'bg-zinc-100 text-zinc-300 border border-zinc-200 cursor-not-allowed'
            }`}
            aria-label={product.inStock ? `Add ${product.title} to bag` : 'Sold out'}
            title={product.inStock ? 'Add to bag' : 'Sold out'}
          >
            <Plus className="w-3 h-3 text-[#e5341f] stroke-[3]" />
            <ShoppingBag className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
