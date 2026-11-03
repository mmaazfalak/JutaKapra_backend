import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  RotateCcw,
  Edit,
  Trash2,
  Copy,
  Archive,
  ArchiveRestore,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Star,
  Link,
  Upload,
  X,
  Eye,
  EyeOff,
  Store,
  Layers,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductMeasurements } from '../../types';
import { formatPKR } from '../../utils/format';

export const AdminProductsView: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    archiveProduct,
    unarchiveProduct,
    toggleStock,
    resetInventory,
    stores,
    adminRole,
    currentStoreId,
    setCurrentStoreId,
    themeMode,
    navigateTo,
    addToast,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState<'All' | 'Available' | 'Sold' | 'Archived'>('All');
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState<'all' | 'thrift_1of1' | 'multi_stock'>('all');
  const [storeFilter, setStoreFilter] = useState<string>(currentStoreId || 'all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_desc' | 'price_asc' | 'era' | 'stock'>('newest');

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState<Product | null>(null);

  // Form Fields for Products
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState<'Sneakers & Boots' | 'Vintage Tees & Trousers' | 'Workwear & Jeans' | 'Jackets & Coats' | 'Accessories'>('Vintage Tees & Trousers');
  const [formSubcategory, setFormSubcategory] = useState<'watch' | 'glasses' | 'bags' | 'wallets'>('watch');
  const [formEra, setFormEra] = useState('1990s');
  const [formPrice, setFormPrice] = useState<number>(18500);
  const [formOriginalPrice, setFormOriginalPrice] = useState<string>('');
  const [formConditionGrade, setFormConditionGrade] = useState('Vintage 9/10 - Single Stitch');
  const [formConditionTier, setFormConditionTier] = useState<'Mint' | 'Good' | 'Distressed 1-of-1' | 'Deadstock'>('Good');
  const [formSize, setFormSize] = useState('L');
  const [formDescription, setFormDescription] = useState('');
  const [formMeasurements, setFormMeasurements] = useState<ProductMeasurements>({ chest: '23.0 in', length: '29.0 in', shoulders: '20.5 in' });
  const [formImages, setFormImages] = useState<string[]>(['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80']);
  const [formNewImageUrl, setFormNewImageUrl] = useState('');
  const [formTags, setFormTags] = useState('Vintage, Single Stitch, Rare');
  const [formInventoryType, setFormInventoryType] = useState<'thrift_1of1' | 'multi_stock'>('thrift_1of1');
  const [formStockCount, setFormStockCount] = useState<number>(1);
  const [formStoreId, setFormStoreId] = useState<string>(currentStoreId || 'store-main');
  const [formIsHidden, setFormIsHidden] = useState<boolean>(false);

  const isDark = themeMode === 'dark';
  const cardBg = isDark ? 'bg-[#12151c] border-[#232833]' : 'bg-white border-slate-200';
  const inputBg = isDark ? 'bg-[#181c24] border-[#232833] text-white' : 'bg-white border-slate-200 text-slate-900';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-[#9aa4b2]' : 'text-slate-500';

  // Store Isolation: Store Owners are strictly restricted to their store's products only!
  const isStoreOwner = adminRole === 'store_owner' && !!currentStoreId;
  const activeStoreAccount = stores.find((s) => s.id === (isStoreOwner ? currentStoreId : storeFilter));

  // Base list of products scoped by store access
  const scopedProducts = products.filter((p) => {
    if (isStoreOwner) {
      return (p.storeId || 'store-main') === currentStoreId;
    }
    if (storeFilter !== 'all') {
      return (p.storeId || 'store-main') === storeFilter;
    }
    return true;
  });

  // Counts
  const totalCount = scopedProducts.length;
  const thriftCount = scopedProducts.filter((p) => p.inventoryType === 'thrift_1of1' || (p.is1of1 && p.inventoryType !== 'multi_stock')).length;
  const multiStockCount = scopedProducts.filter((p) => p.inventoryType === 'multi_stock' || (!p.is1of1 && p.inventoryType !== 'thrift_1of1')).length;
  const availableCount = scopedProducts.filter((p) => p.inStock && !p.isArchived).length;
  const soldCount = scopedProducts.filter((p) => (!p.inStock || (p.stockCount !== undefined && p.stockCount === 0)) && !p.isArchived).length;
  const archivedCount = scopedProducts.filter((p) => p.isArchived).length;

  // Filter & Sort computation
  const filteredProducts = scopedProducts
    .filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.conditionGrade.toLowerCase().includes(q) ||
        p.era.toLowerCase().includes(q) ||
        (p.storeName && p.storeName.toLowerCase().includes(q)) ||
        p.tags.some((t) => t.toLowerCase().includes(q));

      const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;

      let matchesStock = true;
      if (stockFilter === 'Available') matchesStock = p.inStock && !p.isArchived;
      else if (stockFilter === 'Sold') matchesStock = (!p.inStock || (p.stockCount !== undefined && p.stockCount === 0)) && !p.isArchived;
      else if (stockFilter === 'Archived') matchesStock = !!p.isArchived;

      let matchesInventoryType = true;
      if (inventoryTypeFilter === 'thrift_1of1') {
        matchesInventoryType = p.inventoryType === 'thrift_1of1' || (p.is1of1 && p.inventoryType !== 'multi_stock');
      } else if (inventoryTypeFilter === 'multi_stock') {
        matchesInventoryType = p.inventoryType === 'multi_stock' || (!p.is1of1 && p.inventoryType !== 'thrift_1of1');
      }

      return matchesSearch && matchesCat && matchesStock && matchesInventoryType;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'era') return a.era.localeCompare(b.era);
      if (sortBy === 'stock') return (b.stockCount || (b.inStock ? 1 : 0)) - (a.stockCount || (a.inStock ? 1 : 0));
      return 0;
    });

  const handleOpenAddProduct = (presetType: 'thrift_1of1' | 'multi_stock' = 'thrift_1of1') => {
    setEditingProductId(null);
    setFormTitle('');
    setFormSlug('');
    setFormCategory('Vintage Tees & Trousers');
    setFormSubcategory('watch');
    setFormEra('1990s');
    setFormPrice(presetType === 'thrift_1of1' ? 18500 : 7500);
    setFormOriginalPrice('');
    setFormConditionGrade(presetType === 'thrift_1of1' ? 'Vintage 9/10 - Single Stitch' : 'Deadstock Brand New');
    setFormConditionTier(presetType === 'thrift_1of1' ? 'Good' : 'Deadstock');
    setFormSize('XL');
    setFormDescription(
      presetType === 'thrift_1of1'
        ? 'Archival vintage 1-of-1 piece curated by Juta.Kapra staff. Authentic period distress with pristine stitch integrity.'
        : 'Brand new multi-quantity retail vintage stock item. Quality verified.'
    );
    setFormMeasurements({ chest: '23.5 in', length: '29.5 in', shoulders: '21.0 in' });
    setFormImages(['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80']);
    setFormTags(presetType === 'thrift_1of1' ? 'Vintage, Single Stitch, Rare, 90s' : 'Retail, Multi-Stock, Curated');
    setFormInventoryType(presetType);
    setFormStockCount(presetType === 'thrift_1of1' ? 1 : 10);
    setFormStoreId(isStoreOwner ? (currentStoreId || 'store-main') : (storeFilter !== 'all' ? storeFilter : 'store-main'));
    setFormIsHidden(false);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setFormTitle(p.title);
    setFormSlug(p.slug);
    setFormCategory(p.category);
    setFormSubcategory((p.subcategory as any) || 'watch');
    setFormEra(p.era);
    setFormPrice(p.price);
    setFormOriginalPrice(p.originalPrice ? String(p.originalPrice) : '');
    setFormConditionGrade(p.conditionGrade);
    setFormConditionTier(p.conditionTier);
    setFormSize(p.size);
    setFormDescription(p.description);
    setFormMeasurements({ ...p.measurements });
    setFormImages([...p.images]);
    setFormTags(p.tags.join(', '));
    setFormInventoryType(p.inventoryType || (p.is1of1 ? 'thrift_1of1' : 'multi_stock'));
    setFormStockCount(typeof p.stockCount === 'number' ? p.stockCount : (p.inStock ? 1 : 0));
    setFormStoreId(p.storeId || currentStoreId || 'store-main');
    setFormIsHidden(Boolean(p.isHidden));
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const slug =
      formSlug.trim() ||
      formTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const tagsArray = formTags.split(',').map((t) => t.trim()).filter(Boolean);
    const origPriceNum = formOriginalPrice ? Number(formOriginalPrice) : undefined;
    const is1of1 = formInventoryType === 'thrift_1of1';
    const finalStockCount = is1of1 ? (formStockCount > 0 ? 1 : 0) : Math.max(0, formStockCount);
    const targetStore = stores.find((s) => s.id === formStoreId) || stores[0];

    if (editingProductId) {
      updateProduct(editingProductId, {
        title: formTitle.trim(),
        slug,
        category: formCategory,
        subcategory: formCategory === 'Accessories' ? formSubcategory : undefined,
        era: formEra.trim(),
        price: Number(formPrice),
        originalPrice: origPriceNum,
        conditionGrade: formConditionGrade.trim(),
        conditionTier: formConditionTier,
        size: formSize.trim(),
        description: formDescription.trim(),
        measurements: formMeasurements,
        images: formImages.length > 0 ? formImages : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80'],
        tags: tagsArray,
        inventoryType: formInventoryType,
        is1of1,
        stockCount: finalStockCount,
        inStock: finalStockCount > 0,
        storeId: targetStore?.id || 'store-main',
        storeName: targetStore?.name || 'Juta.Kapra Flagship Vault',
        isHidden: formIsHidden,
      });
    } else {
      addProduct({
        title: formTitle.trim(),
        slug,
        category: formCategory,
        subcategory: formCategory === 'Accessories' ? formSubcategory : undefined,
        era: formEra.trim(),
        price: Number(formPrice),
        originalPrice: origPriceNum,
        conditionGrade: formConditionGrade.trim(),
        conditionTier: formConditionTier,
        size: formSize.trim(),
        measurements: formMeasurements,
        description: formDescription.trim(),
        details: is1of1
          ? ['Sourced from private collector archive', 'Verified 100% Cotton / Vintage Knit', 'Archival verified']
          : ['Brand new condition', 'Multiple stock units available', 'Quality checked'],
        images: formImages.length > 0 ? formImages : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80'],
        inStock: finalStockCount > 0,
        is1of1,
        inventoryType: formInventoryType,
        stockCount: finalStockCount,
        storeId: targetStore?.id || 'store-main',
        storeName: targetStore?.name || 'Juta.Kapra Flagship Vault',
        isHidden: formIsHidden,
        tags: tagsArray,
      });
    }
    setIsProductModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setFormImages((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageUrl = () => {
    if (!formNewImageUrl.trim()) return;
    setFormImages((prev) => [...prev, formNewImageUrl.trim()]);
    setFormNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMakePrimaryImage = (index: number) => {
    setFormImages((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      return [moved, ...copy];
    });
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans text-white">
      {/* STORE OWNER SCOPE BANNER */}
      {isStoreOwner && activeStoreAccount && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-blue-900/40 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-white">{activeStoreAccount.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Store Owner Account
                </span>
              </div>
              <p className="text-xs text-blue-200/70 mt-0.5">
                Logged in as <strong>{activeStoreAccount.ownerName}</strong> ({activeStoreAccount.ownerEmail}). You have isolated access to manage products belonging to your store only.
              </p>
            </div>
          </div>
          <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-black/40 border border-blue-500/20 text-blue-300 self-start sm:self-auto">
            {scopedProducts.length} Products in Store
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" />
              <span>Products &amp; Inventory Management</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              {availableCount} Available
            </span>
          </div>
          <p className={`text-xs mt-1 ${textMuted}`}>
            Manage 1-of-1 thrift pieces and multi-quantity inventory separately, assign store accounts, and track stock.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isStoreOwner && (
            <button
              onClick={resetInventory}
              className="px-3 py-2 rounded-xl border border-inherit text-xs font-semibold hover:bg-white/5 transition-colors cursor-pointer flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Catalog</span>
            </button>
          )}

          <button
            onClick={() => handleOpenAddProduct('thrift_1of1')}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-amber-600/25 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Add 1-of-1 Thrift</span>
          </button>

          <button
            onClick={() => handleOpenAddProduct('multi_stock')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-blue-600/25 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Multi-Stock</span>
          </button>
        </div>
      </div>

      {/* INVENTORY TYPE TABS: Separate Management for Thrift vs Multi-Quantity */}
      <div className="flex items-center gap-2 border-b border-inherit pb-2 overflow-x-auto">
        <button
          onClick={() => setInventoryTypeFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            inventoryTypeFilter === 'all'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-black/20 text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All Items ({totalCount})</span>
        </button>

        <button
          onClick={() => setInventoryTypeFilter('thrift_1of1')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            inventoryTypeFilter === 'thrift_1of1'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-black/20 text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>1-of-1 Thrift Vault ({thriftCount})</span>
        </button>

        <button
          onClick={() => setInventoryTypeFilter('multi_stock')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            inventoryTypeFilter === 'multi_stock'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-black/20 text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-emerald-300" />
          <span>Multi-Quantity Retail ({multiStockCount})</span>
        </button>
      </div>

      {/* Stock Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className={`p-4 rounded-xl border shadow-sm ${cardBg}`}>
          <span className={`text-xs font-medium ${textMuted}`}>Total Listed Pieces</span>
          <div className="mt-1 flex items-baseline justify-between">
            <h4 className="text-2xl font-bold font-mono text-white">{totalCount}</h4>
            <span className="text-[10px] font-bold text-slate-400">Total Items</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${cardBg} border-emerald-500/20`}>
          <span className={`text-xs font-medium ${textMuted}`}>In-Stock &amp; Ready</span>
          <div className="mt-1 flex items-baseline justify-between">
            <h4 className="text-2xl font-bold font-mono text-emerald-400">{availableCount}</h4>
            <span className="text-[10px] font-bold text-emerald-400">Live for Buyers</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${cardBg} border-red-500/20`}>
          <span className={`text-xs font-medium ${textMuted}`}>Sold Out</span>
          <div className="mt-1 flex items-baseline justify-between">
            <h4 className="text-2xl font-bold font-mono text-red-400">{soldCount}</h4>
            <span className="text-[10px] font-bold text-red-400">Moved to Last</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${cardBg} border-amber-500/20`}>
          <span className={`text-xs font-medium ${textMuted}`}>Archived / Hidden</span>
          <div className="mt-1 flex items-baseline justify-between">
            <h4 className="text-2xl font-bold font-mono text-amber-400">{archivedCount}</h4>
            <span className="text-[10px] font-bold text-amber-400">Hidden from Catalog</span>
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Store Filter, Categories & Sorting */}
      <div className={`p-3.5 rounded-xl border shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3 ${cardBg}`}>
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, era, grade, store..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-inherit bg-transparent text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
          {/* Store Selector (for Super Admin) */}
          {!isStoreOwner && (
            <div className="flex items-center space-x-1.5">
              <Store className="w-3.5 h-3.5 text-blue-400" />
              <select
                value={storeFilter}
                onChange={(e) => {
                  setStoreFilter(e.target.value);
                  setCurrentStoreId(e.target.value === 'all' ? null : e.target.value);
                }}
                className={`${inputBg} rounded-lg px-2.5 py-1.5 text-xs outline-none cursor-pointer`}
              >
                <option value="all">All Stores ({products.length})</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({products.filter((p) => (p.storeId || 'store-main') === s.id).length})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Stock Filter */}
          <div className="flex items-center space-x-1 overflow-x-auto">
            {(['All', 'Available', 'Sold', 'Archived'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStockFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  stockFilter === st
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'bg-black/20 dark:bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`${inputBg} rounded-lg px-2.5 py-1.5 text-xs outline-none cursor-pointer`}
          >
            <option value="All">All Categories</option>
            <option value="Sneakers & Boots">Sneakers & Boots</option>
            <option value="Vintage Tees & Trousers">Vintage Tees & Trousers</option>
            <option value="Workwear & Jeans">Workwear & Jeans</option>
            <option value="Jackets & Coats">Jackets & Coats</option>
            <option value="Accessories">Accessories</option>
          </select>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`${inputBg} rounded-lg px-2.5 py-1.5 text-xs outline-none cursor-pointer`}
            >
              <option value="newest">Newest Added</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="stock">Quantity Available</option>
              <option value="era">Vintage Era</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className={`rounded-xl border shadow-sm overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[900px]">
            <thead className="bg-black/10 dark:bg-white/5 border-b border-inherit font-bold uppercase tracking-wider text-[10px] text-slate-400">
              <tr>
                <th className="p-3.5">Thumbnail</th>
                <th className="p-3.5">Piece Title &amp; SKU</th>
                <th className="p-3.5">Type &amp; Category</th>
                <th className="p-3.5">Store Account</th>
                <th className="p-3.5">Size / Era</th>
                <th className="p-3.5">Price</th>
                <th className="p-3.5">Stock &amp; State</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inherit font-sans">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    No products found matching the current search &amp; filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const is1of1 = p.inventoryType === 'thrift_1of1' || (p.is1of1 && p.inventoryType !== 'multi_stock');
                  const isAvailable = p.inStock && !p.isArchived && (p.stockCount === undefined || p.stockCount > 0);
                  const isSold = (!p.inStock || (p.stockCount !== undefined && p.stockCount === 0)) && !p.isArchived;
                  const isArchived = !!p.isArchived;
                  const isHidden = Boolean(p.isHidden);

                  return (
                    <tr key={p.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="p-3.5">
                        <div className="relative w-10 h-10">
                          <img
                            src={p.images[0]}
                            alt={p.title}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-800"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80';
                            }}
                          />
                          {isHidden && (
                            <span className="absolute -top-1 -right-1 p-0.5 rounded-full bg-amber-500 text-black text-[9px]" title="Hidden from storefront">
                              <EyeOff className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 max-w-[200px]">
                        <div className="font-bold text-white truncate text-xs sm:text-sm">{p.title}</div>
                        <div className="text-[10px] font-mono text-slate-400">SKU: {p.id}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center space-x-1.5">
                          {is1of1 ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              1-of-1 Thrift
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Multi ({p.stockCount || 1} units)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-300 mt-0.5">{p.category}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-200 block truncate max-w-[140px]">
                          {p.storeName || 'Main Flagship'}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 block">ID: {p.storeId || 'store-main'}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-blue-400">{p.size}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{p.era}</span>
                      </td>
                      <td className="p-3.5 font-bold font-mono text-white text-xs sm:text-sm">
                        {formatPKR(p.price)}
                      </td>
                      <td className="p-3.5">
                        {isAvailable && (
                          <button
                            onClick={() => toggleStock(p.id)}
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 cursor-pointer hover:bg-emerald-500/25 transition-colors"
                            title="Click to toggle Stock Status"
                          >
                            ● {is1of1 ? '1 in Stock' : `${p.stockCount || 1} in Stock`}
                          </button>
                        )}
                        {isSold && (
                          <button
                            onClick={() => toggleStock(p.id)}
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 cursor-pointer hover:bg-red-500/25 transition-colors"
                            title="Click to restock piece"
                          >
                            ✕ Sold Out (Moved to Last)
                          </button>
                        )}
                        {isArchived && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            📦 Archived
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        {/* Preview */}
                        <button
                          onClick={() => navigateTo('product', p.slug || p.id)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Preview on Storefront"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle Hide */}
                        <button
                          onClick={() => {
                            updateProduct(p.id, { isHidden: !p.isHidden });
                            addToast({
                              type: !p.isHidden ? 'info' : 'success',
                              title: !p.isHidden ? 'Product Hidden' : 'Product Visible',
                              message: `"${p.title}" is now ${!p.isHidden ? 'hidden from storefront' : 'live on storefront'}.`,
                            });
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            p.isHidden
                              ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                              : 'bg-white/5 text-slate-400 hover:text-white'
                          }`}
                          title={p.isHidden ? 'Make Product Visible' : 'Hide Product from Storefront'}
                        >
                          {p.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => duplicateProduct(p.id)}
                          className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition-colors cursor-pointer"
                          title="Duplicate Piece as Draft"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors cursor-pointer"
                          title="Edit Details & Photos"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Archive / Restore */}
                        {!p.isArchived ? (
                          <button
                            onClick={() => archiveProduct(p.id)}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors cursor-pointer"
                            title="Archive Piece"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => unarchiveProduct(p.id)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors cursor-pointer"
                            title="Restore from Archive"
                          >
                            <ArchiveRestore className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => setConfirmDeleteProduct(p)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                          title="Delete Piece"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog for Delete */}
      {confirmDeleteProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl border ${cardBg} p-6 space-y-4 text-white text-center`}>
            <div className="w-12 h-12 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold">Delete "{confirmDeleteProduct.title}"?</h3>
              <p className="text-xs text-slate-400">
                This will permanently delete this piece from your store database. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-3 border-t border-inherit">
              <button
                type="button"
                onClick={() => setConfirmDeleteProduct(null)}
                className="px-4 py-2 rounded-lg border border-inherit font-semibold text-slate-300 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProduct(confirmDeleteProduct.id);
                  setConfirmDeleteProduct(null);
                }}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Edit / Create Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-3xl rounded-2xl shadow-2xl border ${cardBg} max-h-[92vh] overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar text-white`}>
            <div className="flex items-center justify-between border-b border-inherit pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {editingProductId
                    ? 'Edit Product Asset'
                    : formInventoryType === 'thrift_1of1'
                    ? 'Add New 1-of-1 Thrift Grail'
                    : 'Add Multi-Quantity Retail Inventory'}
                </h3>
                <p className={`text-xs mt-0.5 ${textMuted}`}>
                  Configure piece specifications, assigned store account, condition tier, and inventory quantity.
                </p>
              </div>
              <button onClick={() => setIsProductModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Type & Store Account Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-xl bg-black/30 border border-slate-700">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                    Inventory Type
                  </label>
                  <select
                    value={formInventoryType}
                    onChange={(e) => {
                      const newType = e.target.value as any;
                      setFormInventoryType(newType);
                      if (newType === 'thrift_1of1') setFormStockCount(1);
                    }}
                    className={`w-full p-2 rounded-lg border focus:outline-none focus:border-blue-500 ${inputBg} cursor-pointer`}
                  >
                    <option value="thrift_1of1">1-of-1 Archival Thrift Grail (Unique piece)</option>
                    <option value="multi_stock">Multi-Quantity Retail Inventory (Bulk stock)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-1">
                    Assigned Store Account
                  </label>
                  <select
                    value={formStoreId}
                    disabled={isStoreOwner}
                    onChange={(e) => setFormStoreId(e.target.value)}
                    className={`w-full p-2 rounded-lg border focus:outline-none focus:border-blue-500 ${inputBg} ${
                      isStoreOwner ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.city || 'Pakistan'})
                      </option>
                    ))}
                  </select>
                  {isStoreOwner && (
                    <span className="text-[10px] text-blue-300 mt-1 block">Locked to your store account</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className={`block font-semibold mb-1 ${textMuted}`}>Product Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. 1993 Nirvana 'In Utero' Tour Tee"
                    className={`w-full p-2 rounded-lg border ${inputBg} outline-none focus:border-blue-500`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${textMuted}`}>Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className={`w-full p-2 rounded-lg border ${inputBg} outline-none focus:border-blue-500 cursor-pointer`}
                  >
                    <option value="Vintage Tees & Trousers">Vintage Tees & Trousers</option>
                    <option value="Workwear & Jeans">Workwear & Jeans</option>
                    <option value="Jackets & Coats">Jackets & Coats</option>
                    <option value="Sneakers & Boots">Sneakers & Boots</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className={`block font-semibold mb-1 ${textMuted}`}>Price (PKR) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className={`w-full p-2 rounded-lg border ${inputBg} outline-none focus:border-blue-500`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${textMuted}`}>Original Price (PKR)</label>
                  <input
                    type="number"
                    placeholder="Discount comparison"
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(e.target.value)}
                    className={`w-full p-2 rounded-lg border ${inputBg} outline-none focus:border-blue-500`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${textMuted}`}>Size *</label>
                  <input
                    type="text"
                    required
                    placeholder="L, XL, US 10.5"
                    value={formSize}
                    onChange={(e) => setFormSize(e.target.value)}
                    className={`w-full p-2 rounded-lg border ${inputBg} outline-none focus:border-blue-500`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${textMuted}`}>
                    {formInventoryType === 'thrift_1of1' ? 'Stock Quantity (Fixed)' : 'Stock Units Available *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={formInventoryType === 'thrift_1of1'}
                    value={formStockCount}
                    onChange={(e) => setFormStockCount(Number(e.target.value))}
                    className={`w-full p-2 rounded-lg border ${inputBg} outline-none focus:border-blue-500 ${
                      formInventoryType === 'thrift_1of1' ? 'opacity-70 bg-black/40' : ''
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className={`block font-semibold mb-1 ${textMuted}`}>Vintage Era</label>
                  <input
                    type="text"
                    required
                    placeholder="1990s, 1980s, Y2K"
                    value={formEra}
                    onChange={(e) => setFormEra(e.target.value)}
                    className={`w-full p-2 rounded-lg border ${inputBg} outline-none focus:border-blue-500`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${textMuted}`}>Condition Grade</label>
                  <input
                    type="text"
                    required
                    placeholder="Vintage 9/10 - Single Stitch"
                    value={formConditionGrade}
                    onChange={(e) => setFormConditionGrade(e.target.value)}
                    className={`w-full p-2 rounded-lg border ${inputBg} outline-none focus:border-blue-500`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${textMuted}`}>Condition Tier</label>
                  <select
                    value={formConditionTier}
                    onChange={(e) => setFormConditionTier(e.target.value as any)}
                    className={`w-full p-2 rounded-lg border ${inputBg} outline-none focus:border-blue-500 cursor-pointer`}
                  >
                    <option value="Good">Good</option>
                    <option value="Mint">Mint</option>
                    <option value="Distressed 1-of-1">Distressed 1-of-1</option>
                    <option value="Deadstock">Deadstock</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${textMuted}`}>Description</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border ${inputBg} outline-none focus:border-blue-500 resize-none`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${textMuted}`}>Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="Vintage, Single Stitch, Rare, 90s"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className={`w-full p-2 rounded-lg border ${inputBg} outline-none focus:border-blue-500`}
                />
              </div>

              {/* Hide Individual Product Toggle */}
              <div className="p-3.5 rounded-xl bg-black/30 border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Hide this product from storefront</span>
                  <span className="text-[11px] text-slate-400 block">
                    Product will stay saved in inventory but won't show on catalog pages.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formIsHidden}
                  onChange={(e) => setFormIsHidden(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-700 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Product Photos Section */}
              <div className="space-y-3 pt-3 border-t border-inherit">
                <div className="flex items-center justify-between">
                  <label className={`block font-bold text-xs uppercase tracking-wider ${textMuted}`}>
                    Product Photos &amp; Assets ({formImages.length})
                  </label>
                  <span className={`text-[11px] ${textMuted}`}>First image is primary</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 bg-black/20 hover:border-blue-500 rounded-xl cursor-pointer transition-colors text-center">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-white">Upload Image File</span>
                    <span className="text-[10px] text-slate-400">PNG, JPG, WEBP</span>
                    <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                  </label>

                  <div className="p-3.5 border border-slate-700 bg-black/20 rounded-xl flex flex-col justify-between space-y-2">
                    <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <Link className="w-3.5 h-3.5 text-slate-400" />
                      <span>Or Add Image via URL</span>
                    </span>
                    <div className="flex space-x-2">
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={formNewImageUrl}
                        onChange={(e) => setFormNewImageUrl(e.target.value)}
                        className={`flex-1 px-3 py-1.5 rounded-lg border ${inputBg} text-xs outline-none focus:border-blue-500`}
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 cursor-pointer"
                      >
                        Add URL
                      </button>
                    </div>
                  </div>
                </div>

                {formImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {formImages.map((imgUrl, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-900 aspect-square">
                        <img src={imgUrl} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                        {idx === 0 ? (
                          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold text-[9px] uppercase tracking-wider flex items-center space-x-1 shadow">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            <span>Primary</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleMakePrimaryImage(idx)}
                            className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 px-2 py-0.5 rounded-md bg-black/70 hover:bg-blue-600 text-white text-[9px] transition-all cursor-pointer"
                          >
                            Set Primary
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-red-600 text-white cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-inherit font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer shadow-lg shadow-blue-600/30">
                  Save Product Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
