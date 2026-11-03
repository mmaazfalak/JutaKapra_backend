import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Flame,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { CategoryType, Product } from '../types';
import { formatPKR } from '../utils/format';

export const ShopView: React.FC = () => {
  const {
    products,
    stores,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
  } = useStore();

  // Filter States
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [oneOfOneOnly, setOneOfOneOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  const categories: CategoryType[] = [
    'All Vintage',
    'Sneakers & Boots',
    'Vintage Tees & Trousers',
    'Workwear & Jeans',
    'Jackets & Coats',
    'Accessories',
    'Deals',
  ];

  const conditionTiers = ['Mint', 'Good', 'Distressed 1-of-1', 'Deadstock'];
  const sizes = ['S', 'M', 'L', 'XL', 'US 10.0', 'US 10.5', '32x31', 'One Size'];

  // Toggle filter helper
  const toggleCondition = (cond: string) => {
    setSelectedConditions((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
    );
  };

  const toggleSize = (sz: string) => {
    setSelectedSizes((prev) =>
      prev.includes(sz) ? prev.filter((s) => s !== sz) : [...prev, sz]
    );
  };

  const handleClearAllFilters = () => {
    setSelectedCategory('All Vintage');
    setSelectedSubcategory('all');
    setSelectedConditions([]);
    setSelectedSizes([]);
    setMaxPrice(100000);
    setInStockOnly(false);
    setOneOfOneOnly(false);
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedCategory !== 'All Vintage' ||
    selectedSubcategory !== 'all' ||
    selectedConditions.length > 0 ||
    selectedSizes.length > 0 ||
    maxPrice < 100000 ||
    inStockOnly ||
    oneOfOneOnly ||
    searchQuery.trim().length > 0;

  // Filter & Sort computation
  const filteredProducts = useMemo(() => {
    // Collect hidden / suspended store IDs
    const hiddenStoreIds = new Set(
      stores.filter((s) => s.isHidden || s.status === 'suspended').map((s) => s.id)
    );

    return products
      .filter((p) => {
        // Exclude individually hidden or archived products
        if (p.isHidden || p.isArchived) {
          return false;
        }

        // Exclude products belonging to hidden or suspended stores
        if (p.storeId && hiddenStoreIds.has(p.storeId)) {
          return false;
        }

        // Category
        if (selectedCategory === 'Deals') {
          if (!p.isHotDeal && !(p.originalPrice && p.originalPrice > p.price)) {
            return false;
          }
        } else if (selectedCategory !== 'All Vintage' && p.category !== selectedCategory) {
          return false;
        }

        // Subcategory for Accessories
        if (selectedCategory === 'Accessories' && selectedSubcategory !== 'all') {
          const isMatchSub = p.subcategory === selectedSubcategory;
          const isMatchTitle = p.title.toLowerCase().includes(selectedSubcategory);
          const isMatchTags = p.tags.some((t) => t.toLowerCase().includes(selectedSubcategory));
          if (!isMatchSub && !isMatchTitle && !isMatchTags) {
            return false;
          }
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchCategory = p.category.toLowerCase().includes(q);
          const matchEra = p.era.toLowerCase().includes(q);
          const matchTags = p.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchCategory && !matchEra && !matchTags) {
            return false;
          }
        }

        // Condition
        if (selectedConditions.length > 0 && !selectedConditions.includes(p.conditionTier)) {
          return false;
        }

        // Size
        if (selectedSizes.length > 0 && !selectedSizes.includes(p.size)) {
          return false;
        }

        // Max Price
        if (p.price > maxPrice) {
          return false;
        }

        // In Stock
        const isAvailable = p.inStock && (p.stockCount === undefined || p.stockCount > 0);
        if (inStockOnly && !isAvailable) {
          return false;
        }

        // 1 of 1
        if (oneOfOneOnly && !p.is1of1) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // 1. Sort Settings: Sold out products are ALWAYS moved to the very last
        const aAvailable = a.inStock && (a.stockCount === undefined || a.stockCount > 0);
        const bAvailable = b.inStock && (b.stockCount === undefined || b.stockCount > 0);

        if (aAvailable && !bAvailable) return -1;
        if (!aAvailable && bAvailable) return 1;

        // 2. Secondary sort based on user selection
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'newest') return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        return (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0);
      });
  }, [
    products,
    stores,
    selectedCategory,
    selectedSubcategory,
    searchQuery,
    selectedConditions,
    selectedSizes,
    maxPrice,
    inStockOnly,
    oneOfOneOnly,
    sortBy,
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 sm:pt-6 pb-12 font-sans overflow-x-hidden w-full">
      {/* Page Title & Breadcrumb Header (Desktop Only) */}
      <div className="hidden lg:flex flex-col md:flex-row md:items-end justify-between border-b border-[#0a0a0a]/10 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#0a0a0a]/50 uppercase tracking-wider mb-1">
            <span>Catalog</span>
            <span>/</span>
            <span className="text-[#0a0a0a] font-bold">{selectedCategory}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-[-0.04em] text-[#0a0a0a]">
            Archival Inventory
          </h1>
          <p className="text-sm text-[#0a0a0a]/60 mt-1">
            Showing {filteredProducts.length} authentic vintage item{filteredProducts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Desktop Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-10 pl-3 pr-8 rounded-lg border border-[#0a0a0a]/15 bg-white text-xs font-bold text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] appearance-none cursor-pointer shadow-sm"
            >
              <option value="featured">Sort: Featured Vault</option>
              <option value="newest">Sort: Newest Drops</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3.5 pointer-events-none text-[#0a0a0a]/60" />
          </div>
        </div>
      </div>



      {/* Accessories Subcategory Filter Rail */}
      {selectedCategory === 'Accessories' && (
        <div className="flex items-center space-x-2 mb-4 sm:mb-6 p-1.5 rounded-2xl bg-white/80 backdrop-blur-md border border-[#0a0a0a]/10 overflow-x-auto no-scrollbar shadow-xs">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#0a0a0a]/50 px-2.5 shrink-0">
            Inner Category:
          </span>
          {[
            { id: 'all', label: 'All' },
            { id: 'watch', label: 'Watch' },
            { id: 'glasses', label: 'Glasses' },
            { id: 'bags', label: 'Bags' },
            { id: 'wallets', label: 'Wallets' },
          ].map((sub) => {
            const isActive = selectedSubcategory === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubcategory(sub.id as any)}
                className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[34px] ${
                  isActive
                    ? 'bg-[#0a0a0a] text-white shadow-xs'
                    : 'bg-white/60 hover:bg-white text-[#0a0a0a]/80 hover:text-[#0a0a0a]'
                }`}
              >
                {sub.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Active Filter Chips Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-[#0a0a0a]/10">
          <span className="text-[11px] sm:text-xs font-bold text-[#0a0a0a]/50 mr-1">Active:</span>

          {selectedCategory !== 'All Vintage' && (
            <button
              onClick={() => setSelectedCategory('All Vintage')}
              className="bg-[#fafafa] border border-[#0a0a0a]/15 text-[#0a0a0a] text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1 hover:border-[#e5341f]"
            >
              <span>Category: {selectedCategory}</span>
              <X className="w-3 h-3 text-[#0a0a0a]/60" />
            </button>
          )}

          {searchQuery.trim() && (
            <button
              onClick={() => setSearchQuery('')}
              className="bg-[#fafafa] border border-[#0a0a0a]/15 text-[#0a0a0a] text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1 hover:border-[#e5341f]"
            >
              <span>"{searchQuery}"</span>
              <X className="w-3 h-3 text-[#0a0a0a]/60" />
            </button>
          )}

          {selectedConditions.map((cond) => (
            <button
              key={cond}
              onClick={() => toggleCondition(cond)}
              className="bg-[#fafafa] border border-[#0a0a0a]/15 text-[#0a0a0a] text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1 hover:border-[#e5341f]"
            >
              <span>{cond}</span>
              <X className="w-3 h-3 text-[#0a0a0a]/60" />
            </button>
          ))}

          {selectedSizes.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className="bg-[#fafafa] border border-[#0a0a0a]/15 text-[#0a0a0a] text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1 hover:border-[#e5341f]"
            >
              <span>Size: {size}</span>
              <X className="w-3 h-3 text-[#0a0a0a]/60" />
            </button>
          ))}

          {maxPrice < 100000 && (
            <button
              onClick={() => setMaxPrice(100000)}
              className="bg-[#fafafa] border border-[#0a0a0a]/15 text-[#0a0a0a] text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1 hover:border-[#e5341f]"
            >
              <span>&le; {formatPKR(maxPrice)}</span>
              <X className="w-3 h-3 text-[#0a0a0a]/60" />
            </button>
          )}

          {inStockOnly && (
            <button
              onClick={() => setInStockOnly(false)}
              className="bg-[#fafafa] border border-[#0a0a0a]/15 text-[#0a0a0a] text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1 hover:border-[#e5341f]"
            >
              <span>In Stock</span>
              <X className="w-3 h-3 text-[#0a0a0a]/60" />
            </button>
          )}

          <button
            onClick={handleClearAllFilters}
            className="text-[11px] sm:text-xs font-bold text-[#e5341f] hover:underline flex items-center space-x-1 ml-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        </div>
      )}

      {/* Main Layout: Sidebar Filters + 2-Column Mobile Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Desktop Filter Sidebar (Permanent on Desktop, Drawer Modal on Mobile) */}
        <aside
          className={`hidden lg:block lg:col-span-1 space-y-6 bg-transparent p-0 rounded-none border-0 shadow-none`}
        >
          {/* 1. Category Section */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#0a0a0a]">
              Category
            </h4>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#0a0a0a] text-white'
                      : 'text-[#0a0a0a]/70 hover:bg-[#fafafa] hover:text-[#0a0a0a]'
                  }`}
                >
                  <span>{cat}</span>
                  {cat === 'Deals' && (
                    <span className="bg-[#e5341f] text-white text-[9px] font-extrabold uppercase px-1 rounded">
                      HOT
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Condition Grading Section */}
          <div className="space-y-2.5 pt-4 border-t border-[#0a0a0a]/10">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#0a0a0a]">
              Condition Grade
            </h4>
            <div className="space-y-1.5">
              {conditionTiers.map((cond) => {
                const checked = selectedConditions.includes(cond);
                return (
                  <label
                    key={cond}
                    className="flex items-center space-x-2 text-xs font-medium text-[#0a0a0a]/80 hover:text-[#0a0a0a] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCondition(cond)}
                      className="rounded border-[#0a0a0a]/20 text-[#0a0a0a] focus:ring-0 focus:ring-offset-0"
                    />
                    <span>{cond}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 3. Sizes */}
          <div className="space-y-2.5 pt-4 border-t border-[#0a0a0a]/10">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#0a0a0a]">
              Garment &amp; Shoe Size
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {sizes.map((size) => {
                const checked = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`px-2.5 py-1 text-xs font-bold rounded border transition-all cursor-pointer ${
                      checked
                        ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                        : 'bg-[#fafafa] text-[#0a0a0a]/70 border-[#0a0a0a]/10 hover:border-[#0a0a0a]/30 hover:text-[#0a0a0a]'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Price Slider */}
          <div className="space-y-2.5 pt-4 border-t border-[#0a0a0a]/10">
            <div className="flex items-center justify-between text-xs">
              <h4 className="font-black uppercase tracking-wider text-[#0a0a0a]">
                Max Price
              </h4>
              <span className="font-bold text-[#0a0a0a]">{formatPKR(maxPrice)}</span>
            </div>
            <input
              type="range"
              min={5000}
              max={100000}
              step={1000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#e5341f] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#0a0a0a]/50">
              <span>Rs. 5,000</span>
              <span>Rs. 100,000+</span>
            </div>
          </div>

          {/* 5. Toggles: In Stock & 1-of-1 */}
          <div className="space-y-2.5 pt-4 border-t border-[#0a0a0a]/10">
            <label className="flex items-center justify-between text-xs font-semibold text-[#0a0a0a] cursor-pointer">
              <span>In Stock Only</span>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-[#0a0a0a]/20 text-[#e5341f] focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between text-xs font-semibold text-[#0a0a0a] cursor-pointer">
              <span>1-of-1 Vault Only</span>
              <input
                type="checkbox"
                checked={oneOfOneOnly}
                onChange={(e) => setOneOfOneOnly(e.target.checked)}
                className="rounded border-[#0a0a0a]/20 text-[#e5341f] focus:ring-0"
              />
            </label>
          </div>
        </aside>

        {/* Product Grid Area: EXACTLY 2-Columns on Mobile (<768px), 3-Columns on Large Desktop */}
        <main className="lg:col-span-3">
          {/* Mobile Filter & Sort Control Toolbar (Directly at Top of Products) */}
          <div className="lg:hidden mb-3">
            <div className="grid grid-cols-2 gap-2.5">
              {/* Mobile Filter Button */}
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className={`h-9 px-3 rounded-lg border text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-colors shadow-2xs ${
                  hasActiveFilters
                    ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                    : 'bg-white text-[#0a0a0a] border-[#0a0a0a]/15 hover:bg-[#fafafa]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters {hasActiveFilters && '(Active)'}</span>
              </button>

              {/* Mobile Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full h-9 pl-3 pr-7 rounded-lg border border-[#0a0a0a]/15 bg-white text-xs font-bold text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] appearance-none cursor-pointer shadow-2xs"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="newest">Sort: Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 pointer-events-none text-[#0a0a0a]/60" />
              </div>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-[#fafafa] border border-[#0a0a0a]/10 rounded-2xl p-8 sm:p-12 text-center space-y-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white border border-[#0a0a0a]/10 flex items-center justify-center mx-auto text-[#0a0a0a]/40">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-[#0a0a0a]">
                No Archival Grails Match These Filters
              </h3>
              <p className="text-xs text-[#0a0a0a]/60 max-w-sm mx-auto">
                Try widening your price range or clearing category and size filters to view our full collection.
              </p>
              <button
                onClick={handleClearAllFilters}
                className="bg-[#0a0a0a] hover:bg-[#e5341f] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Slide-Over Filter Drawer Modal */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden animate-fade-in font-sans">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileFilterOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden text-[#0a0a0a]">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#0a0a0a]/10 flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-[#e5341f]" />
                <span>Filter Catalog</span>
              </h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-black hover:bg-neutral-100"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar text-xs">
              {/* Category */}
              <div className="space-y-2">
                <h4 className="font-black uppercase tracking-wider text-[11px] text-[#0a0a0a]">
                  Category
                </h4>
                <div className="grid grid-cols-1 gap-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between min-h-[38px] ${
                        selectedCategory === cat
                          ? 'bg-[#0a0a0a] text-white'
                          : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800'
                      }`}
                    >
                      <span>{cat}</span>
                      {cat === 'Deals' && (
                        <span className="bg-[#e5341f] text-white text-[8px] font-black uppercase px-1 rounded">
                          HOT
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition Grade */}
              <div className="space-y-2 pt-4 border-t border-[#0a0a0a]/10">
                <h4 className="font-black uppercase tracking-wider text-[11px] text-[#0a0a0a]">
                  Condition Grade
                </h4>
                <div className="space-y-2">
                  {conditionTiers.map((cond) => {
                    const checked = selectedConditions.includes(cond);
                    return (
                      <label
                        key={cond}
                        className="flex items-center space-x-2.5 text-xs font-medium text-neutral-800 cursor-pointer min-h-[30px]"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCondition(cond)}
                          className="w-4 h-4 rounded border-[#0a0a0a]/20 text-[#e5341f] focus:ring-0"
                        />
                        <span>{cond}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Sizes */}
              <div className="space-y-2 pt-4 border-t border-[#0a0a0a]/10">
                <h4 className="font-black uppercase tracking-wider text-[11px] text-[#0a0a0a]">
                  Size
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {sizes.map((size) => {
                    const checked = selectedSizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border min-h-[36px] min-w-[42px] transition-all cursor-pointer ${
                          checked
                            ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Max Price */}
              <div className="space-y-2 pt-4 border-t border-[#0a0a0a]/10">
                <div className="flex items-center justify-between text-xs">
                  <h4 className="font-black uppercase tracking-wider text-[11px] text-[#0a0a0a]">
                    Max Price
                  </h4>
                  <span className="font-bold text-[#0a0a0a]">{formatPKR(maxPrice)}</span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={100000}
                  step={1000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#e5341f] cursor-pointer h-2"
                />
              </div>

              {/* In Stock & 1-of-1 */}
              <div className="space-y-3 pt-4 border-t border-[#0a0a0a]/10">
                <label className="flex items-center justify-between text-xs font-semibold text-neutral-800 cursor-pointer min-h-[32px]">
                  <span>In Stock Only</span>
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-[#0a0a0a]/20 text-[#e5341f] focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between text-xs font-semibold text-neutral-800 cursor-pointer min-h-[32px]">
                  <span>1-of-1 Vault Only</span>
                  <input
                    type="checkbox"
                    checked={oneOfOneOnly}
                    onChange={(e) => setOneOfOneOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-[#0a0a0a]/20 text-[#e5341f] focus:ring-0"
                  />
                </label>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-[#0a0a0a]/10 flex items-center gap-2.5 bg-neutral-50">
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 font-bold text-xs hover:bg-neutral-100 min-h-[44px]"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#0a0a0a] text-white font-bold text-xs hover:bg-neutral-900 min-h-[44px]"
              >
                View {filteredProducts.length} Pieces
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
