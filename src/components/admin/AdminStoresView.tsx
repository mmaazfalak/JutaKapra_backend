import React, { useState } from 'react';
import {
  Store,
  Plus,
  Search,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  User,
  KeyRound,
  Phone,
  Mail,
  MapPin,
  Percent,
  Copy,
  Package,
  Layers,
  Sparkles,
  Lock,
  X,
  Database,
  RefreshCw,
  Cloud,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { StoreAccount } from '../../types';
import { formatPKR } from '../../utils/format';

export const AdminStoresView: React.FC = () => {
  const {
    stores,
    addStore,
    updateStore,
    deleteStore,
    toggleStoreVisibility,
    refreshStoresList,
    isSupabaseStoresSynced,
    products,
    themeMode,
    adminRole,
    currentStoreId,
    setCurrentStoreId,
    setActiveAdminModule,
    addToast,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'visible' | 'hidden'>('all');

  // Modal States
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [confirmDeleteStore, setConfirmDeleteStore] = useState<StoreAccount | null>(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formOwnerName, setFormOwnerName] = useState('');
  const [formOwnerEmail, setFormOwnerEmail] = useState('');
  const [formOwnerPhone, setFormOwnerPhone] = useState('');
  const [formPasscode, setFormPasscode] = useState('store123');
  const [formCity, setFormCity] = useState('Islamabad');
  const [formAddress, setFormAddress] = useState('');
  const [formCommissionRate, setFormCommissionRate] = useState<number>(10);
  const [formStatus, setFormStatus] = useState<'active' | 'suspended'>('active');
  const [formDescription, setFormDescription] = useState('');
  const [formIsHidden, setFormIsHidden] = useState(false);

  const isDark = themeMode === 'dark';
  const cardBg = isDark ? 'bg-[#12151c] border-[#232833]' : 'bg-white border-slate-200';
  const inputBg = isDark ? 'bg-[#181c24] border-[#232833] text-white' : 'bg-white border-slate-200 text-slate-900';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-[#9aa4b2]' : 'text-slate-500';

  // Compute metrics per store
  const getStoreStats = (storeId: string) => {
    const storeProducts = products.filter((p) => (p.storeId || 'store-main') === storeId);
    const inStockCount = storeProducts.filter((p) => p.inStock && !p.isArchived).length;
    const totalInventoryValue = storeProducts.reduce((sum, p) => sum + p.price * (p.stockCount || (p.inStock ? 1 : 0)), 0);
    const thrift1of1Count = storeProducts.filter((p) => p.inventoryType === 'thrift_1of1' || (p.is1of1 && p.inventoryType !== 'multi_stock')).length;
    const multiStockCount = storeProducts.filter((p) => p.inventoryType === 'multi_stock' || (!p.is1of1 && p.inventoryType !== 'thrift_1of1')).length;
    return {
      totalProducts: storeProducts.length,
      inStockCount,
      totalInventoryValue,
      thrift1of1Count,
      multiStockCount,
    };
  };

  const filteredStores = stores.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(q) ||
      s.slug.toLowerCase().includes(q) ||
      s.ownerName.toLowerCase().includes(q) ||
      s.ownerEmail.toLowerCase().includes(q) ||
      (s.city && s.city.toLowerCase().includes(q));

    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchesVis =
      filterVisibility === 'all' ||
      (filterVisibility === 'visible' && !s.isHidden) ||
      (filterVisibility === 'hidden' && s.isHidden);

    return matchesSearch && matchesStatus && matchesVis;
  });

  const handleOpenAddStore = () => {
    setEditingStoreId(null);
    setFormName('');
    setFormSlug('');
    setFormOwnerName('');
    setFormOwnerEmail('');
    setFormOwnerPhone('');
    setFormPasscode('store123');
    setFormCity('Islamabad');
    setFormAddress('');
    setFormCommissionRate(10);
    setFormStatus('active');
    setFormDescription('Archival streetwear & curated vintage supplier boutique.');
    setFormIsHidden(false);
    setIsStoreModalOpen(true);
  };

  const handleOpenEditStore = (store: StoreAccount) => {
    setEditingStoreId(store.id);
    setFormName(store.name);
    setFormSlug(store.slug);
    setFormOwnerName(store.ownerName);
    setFormOwnerEmail(store.ownerEmail);
    setFormOwnerPhone(store.ownerPhone || '');
    setFormPasscode(store.passcode || 'store123');
    setFormCity(store.city || 'Islamabad');
    setFormAddress(store.address || '');
    setFormCommissionRate(store.commissionRate !== undefined ? store.commissionRate : 10);
    setFormStatus(store.status);
    setFormDescription(store.description || '');
    setFormIsHidden(Boolean(store.isHidden));
    setIsStoreModalOpen(true);
  };

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formOwnerEmail.trim()) {
      addToast({
        type: 'error',
        title: 'Missing Required Fields',
        message: 'Please provide both Store Name and Owner Email.',
      });
      return;
    }

    const cleanSlug =
      formSlug.trim() ||
      formName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    if (editingStoreId) {
      updateStore(editingStoreId, {
        name: formName.trim(),
        slug: cleanSlug,
        ownerName: formOwnerName.trim() || 'Store Manager',
        ownerEmail: formOwnerEmail.trim().toLowerCase(),
        ownerPhone: formOwnerPhone.trim(),
        passcode: formPasscode.trim(),
        city: formCity.trim(),
        address: formAddress.trim(),
        commissionRate: Number(formCommissionRate),
        status: formStatus,
        description: formDescription.trim(),
        isHidden: formIsHidden,
      });
    } else {
      addStore({
        name: formName.trim(),
        slug: cleanSlug,
        ownerName: formOwnerName.trim() || 'Store Manager',
        ownerEmail: formOwnerEmail.trim().toLowerCase(),
        ownerPhone: formOwnerPhone.trim(),
        passcode: formPasscode.trim(),
        city: formCity.trim(),
        address: formAddress.trim(),
        commissionRate: Number(formCommissionRate),
        status: formStatus,
        description: formDescription.trim(),
        isHidden: formIsHidden,
      });
    }

    setIsStoreModalOpen(false);
  };

  const handleCopyCredentials = (store: StoreAccount) => {
    const text = `Juta.Kapra Store Owner Login:\nEmail: ${store.ownerEmail}\nPasscode: ${store.passcode || 'store123'}\nPortal: ${window.location.origin}/AdminPanel`;
    navigator.clipboard.writeText(text);
    addToast({
      type: 'success',
      title: 'Credentials Copied',
      message: `Login details for ${store.ownerName} (${store.name}) copied to clipboard.`,
    });
  };

  const handleSwitchToStoreProducts = (storeId: string) => {
    setCurrentStoreId(storeId);
    setActiveAdminModule('products');
    addToast({
      type: 'info',
      title: 'Store Filter Activated',
      message: `Now viewing products for ${stores.find((s) => s.id === storeId)?.name || 'selected store'}.`,
    });
  };

  const handleSwitchToStoreOrders = (storeId: string) => {
    setCurrentStoreId(storeId);
    setActiveAdminModule('orders');
    addToast({
      type: 'info',
      title: 'Store Orders & Deliveries',
      message: `Now managing fulfillment and deliveries for ${stores.find((s) => s.id === storeId)?.name || 'selected store'}.`,
    });
  };

  const handleSyncSupabase = async () => {
    setIsSyncing(true);
    try {
      const res = await refreshStoresList();
      addToast({
        type: res.success ? 'success' : 'error',
        title: res.success ? 'Supabase Sync Complete' : 'Supabase Sync Notice',
        message: res.message || `${res.count} stores synced.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Sync Error',
        message: err?.message || 'Failed to sync stores with Supabase database.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 w-full font-sans text-white">
      {/* Master Admin Notice Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
            👑
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-sm text-white tracking-wide">
                Master Admin Portal (mmaazfalak@icloud.com)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Full Authority
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              You have complete unrestricted access to all stores, products, inventory, deliveries, and settings.
            </p>
          </div>
        </div>
        {currentStoreId && (
          <button
            onClick={() => {
              setCurrentStoreId(null);
              addToast({
                type: 'info',
                title: 'Global Master View Restored',
                message: 'Viewing all stores across the entire platform.',
              });
            }}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/10 transition-colors self-start sm:self-auto cursor-pointer"
          >
            Clear Store Focus
          </button>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold tracking-tight text-white">
                  Stores &amp; Vendor Accounts
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                  {stores.length} Store{stores.length !== 1 ? 's' : ''}
                </span>
                <span
                  className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                    isSupabaseStoresSynced
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}
                >
                  <Cloud className="w-3 h-3" />
                  <span>{isSupabaseStoresSynced ? 'Supabase DB Synced' : 'Cloud DB Active'}</span>
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${textMuted}`}>
                Manage independent store accounts saved in Supabase database with isolated vendor logins and company commission tracking.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSqlModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="View Supabase PostgreSQL Schema"
          >
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>SQL Schema</span>
          </button>

          <button
            onClick={handleSyncSupabase}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Sync stores table with Supabase Database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Supabase'}</span>
          </button>

          <button
            onClick={handleOpenAddStore}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Store</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-4 rounded-xl border ${cardBg}`}>
          <span className={`text-[11px] font-semibold ${textMuted} block`}>Registered Stores</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">{stores.length}</span>
          <span className="text-[10px] text-slate-400 mt-1 block">Active vendor hub locations</span>
        </div>
        <div className={`p-4 rounded-xl border ${cardBg}`}>
          <span className={`text-[11px] font-semibold ${textMuted} block`}>Live on Storefront</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
            {stores.filter((s) => !s.isHidden && s.status === 'active').length}
          </span>
          <span className="text-[10px] text-emerald-400/80 mt-1 block">Visible to public buyers</span>
        </div>
        <div className={`p-4 rounded-xl border ${cardBg}`}>
          <span className={`text-[11px] font-semibold ${textMuted} block`}>Hidden Stores</span>
          <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
            {stores.filter((s) => s.isHidden).length}
          </span>
          <span className="text-[10px] text-amber-400/80 mt-1 block">All products hidden</span>
        </div>
        <div className={`p-4 rounded-xl border ${cardBg}`}>
          <span className={`text-[11px] font-semibold ${textMuted} block`}>Total Store Inventory</span>
          <span className="text-2xl font-bold font-mono text-blue-400 mt-1 block font-mono">
            {products.length} Items
          </span>
          <span className="text-[10px] text-blue-400/80 mt-1 block">Managed across all stores</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className={`p-4 rounded-xl border ${cardBg} space-y-3`}>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search store name, city, owner email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-black/20 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <div className="sm:col-span-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-2.5 py-2 rounded-lg bg-black/20 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Account Status</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={filterVisibility}
              onChange={(e) => setFilterVisibility(e.target.value as any)}
              className="w-full px-2.5 py-2 rounded-lg bg-black/20 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Visibility</option>
              <option value="visible">Live on Storefront</option>
              <option value="hidden">Hidden from Storefront</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stores List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredStores.map((store) => {
          const stats = getStoreStats(store.id);
          const isCurrentActive = currentStoreId === store.id;

          return (
            <div
              key={store.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isCurrentActive ? 'border-blue-500 ring-1 ring-blue-500/50' : cardBg
              } p-5 space-y-4 shadow-sm hover:shadow-md`}
            >
              {/* Top Banner & Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 text-white flex items-center justify-center text-lg font-black shrink-0 shadow-md">
                    {store.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-base text-white tracking-tight">{store.name}</h4>
                      {store.isHidden ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Products Hidden
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Live
                        </span>
                      )}
                    </div>
                    <p className={`text-xs flex items-center gap-1.5 mt-0.5 ${textMuted}`}>
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{store.city || 'Pakistan'}</span>
                      <span className="text-slate-600">•</span>
                      <span className="font-mono text-[11px]">ID: {store.id}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenEditStore(store)}
                    title="Edit Store"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteStore(store)}
                    title="Delete Store"
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Store Owner Contact & Access Box */}
              <div className="p-3.5 rounded-xl bg-black/25 border border-inherit text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="font-semibold text-white">{store.ownerName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      Store Owner
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyCredentials(store)}
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Copy className="w-3 h-3" /> Copy Login
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="font-mono text-slate-300 truncate">{store.ownerEmail}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <KeyRound className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>Passcode: <span className="font-mono text-emerald-400 font-semibold">{store.passcode || 'store123'}</span></span>
                  </div>
                </div>
              </div>

              {/* Inventory Breakdown Metrics */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-black/20 border border-inherit text-center">
                  <span className={`text-[10px] font-semibold ${textMuted} block`}>Total Products</span>
                  <span className="text-base font-bold font-mono text-white mt-0.5 block">{stats.totalProducts}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-inherit text-center">
                  <span className={`text-[10px] font-semibold ${textMuted} block`}>1-of-1 Thrift</span>
                  <span className="text-base font-bold font-mono text-amber-400 mt-0.5 block">{stats.thrift1of1Count}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-inherit text-center">
                  <span className={`text-[10px] font-semibold ${textMuted} block`}>Multi-Stock</span>
                  <span className="text-base font-bold font-mono text-blue-400 mt-0.5 block">{stats.multiStockCount}</span>
                </div>
              </div>

              {/* Store Action Bar: Hide all products toggle + Manage products */}
              <div className="pt-2 border-t border-inherit flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <button
                  onClick={() => toggleStoreVisibility(store.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                    store.isHidden
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {store.isHidden ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Make Products Live</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide All Products</span>
                    </>
                  )}
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleSwitchToStoreProducts(store.id)}
                    className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-md shadow-blue-600/20"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Products ({stats.totalProducts})</span>
                  </button>

                  <button
                    onClick={() => handleSwitchToStoreOrders(store.id)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Store className="w-3.5 h-3.5 text-blue-400" />
                    <span>Orders &amp; Deliveries</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: CREATE OR EDIT STORE ACCOUNT */}
      {isStoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-xl rounded-2xl shadow-2xl border ${cardBg} p-6 space-y-5 text-white max-h-[92vh] overflow-y-auto custom-scrollbar`}>
            <div className="flex items-center justify-between border-b border-inherit pb-3.5">
              <div>
                <h3 className="font-bold text-base text-white">
                  {editingStoreId ? 'Edit Store & Owner Account' : 'Create New Store Account'}
                </h3>
                <p className={`text-xs mt-0.5 ${textMuted}`}>
                  Configure store credentials and owner login permissions.
                </p>
              </div>
              <button
                onClick={() => setIsStoreModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStore} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>
                    Store Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. F-7 Archival & Denim Hub"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-blue-500 ${inputBg}`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>
                    Store Slug / Identifier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. f7-archival"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-blue-500 ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>
                    Store Owner Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hamza Tariq"
                    value={formOwnerName}
                    onChange={(e) => setFormOwnerName(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-blue-500 ${inputBg}`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>
                    Store Owner Login Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. f7vault@jutakapra.com"
                    value={formOwnerEmail}
                    onChange={(e) => setFormOwnerEmail(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-blue-500 ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>
                    Owner Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+92 321 4441234"
                    value={formOwnerPhone}
                    onChange={(e) => setFormOwnerPhone(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-blue-500 ${inputBg}`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>
                    Store Owner Passcode / Password
                  </label>
                  <input
                    type="text"
                    placeholder="store123"
                    value={formPasscode}
                    onChange={(e) => setFormPasscode(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-blue-500 ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>City</label>
                  <input
                    type="text"
                    placeholder="Islamabad, Lahore, Karachi"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-blue-500 ${inputBg}`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>Commission %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formCommissionRate}
                    onChange={(e) => setFormCommissionRate(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-blue-500 ${inputBg}`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-blue-500 ${inputBg} cursor-pointer`}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>
                  Physical Address / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gol Market, F-7/3, Islamabad"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-blue-500 ${inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>
                  Store Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of store specialty..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-blue-500 ${inputBg}`}
                />
              </div>

              {/* Hide All Products Option */}
              <div className="p-3.5 rounded-xl bg-black/30 border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Hide all products from this store</span>
                  <span className="text-[11px] text-slate-400 block">
                    When enabled, products assigned to this store will be instantly hidden on the storefront.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formIsHidden}
                  onChange={(e) => setFormIsHidden(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-700 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setIsStoreModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer shadow-lg shadow-blue-600/30"
                >
                  {editingStoreId ? 'Save Changes' : 'Create Store Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDeleteStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl border ${cardBg} p-6 space-y-4 text-white`}>
            <div className="flex items-center space-x-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-white">Delete Store Account?</h3>
            </div>
            <p className={`text-xs leading-relaxed ${textMuted}`}>
              Are you sure you want to delete <strong className="text-white">"{confirmDeleteStore.name}"</strong>?
              This store owner ({confirmDeleteStore.ownerEmail}) will lose access to their portal.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmDeleteStore(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteStore(confirmDeleteStore.id);
                  setConfirmDeleteStore(null);
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPABASE SQL SCHEMA SETUP MODAL */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-2xl rounded-2xl shadow-2xl border ${cardBg} p-6 space-y-4 text-white max-h-[90vh] flex flex-col`}>
            <div className="flex items-center justify-between border-b border-inherit pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Supabase PostgreSQL Stores DDL</h3>
                  <p className="text-[11px] text-slate-400">Stores Table Schema, RLS Security Policies &amp; Triggers</p>
                </div>
              </div>
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-xs ${textMuted} leading-relaxed`}>
              Every store is stored as an independent entity in Supabase. Run this SQL query in your{' '}
              <strong className="text-white">Supabase Project &rarr; SQL Editor</strong> to create the table and enable automatic real-time sync.
            </p>

            <div className="relative flex-1 min-h-0 bg-black/60 rounded-xl border border-slate-800 p-3.5 overflow-y-auto">
              <button
                onClick={() => {
                  const sqlCode = `-- 1. Create public.stores table
CREATE TABLE IF NOT EXISTS public.stores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    owner_name TEXT,
    owner_phone TEXT,
    passcode TEXT DEFAULT 'store123',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    city TEXT DEFAULT 'Islamabad',
    address TEXT,
    commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    logo_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes & RLS Policies
CREATE INDEX IF NOT EXISTS idx_stores_owner_email ON public.stores (LOWER(owner_email));
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Admin manage stores" ON public.stores FOR ALL USING (true);`;
                  navigator.clipboard.writeText(sqlCode);
                  addToast({
                    type: 'success',
                    title: 'SQL Copied',
                    message: 'Supabase Stores DDL script copied to clipboard.',
                  });
                }}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] font-mono font-bold text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Copy className="w-3 h-3" /> Copy SQL
              </button>

              <pre className="text-[11px] text-emerald-400 font-mono whitespace-pre overflow-x-auto leading-relaxed pt-2">
{`CREATE TABLE IF NOT EXISTS public.stores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    owner_name TEXT,
    owner_phone TEXT,
    passcode TEXT DEFAULT 'store123',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    city TEXT DEFAULT 'Islamabad',
    address TEXT,
    commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    logo_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Admin manage stores" ON public.stores FOR ALL USING (true);`}
              </pre>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-inherit">
              <span className="text-[10px] text-slate-400">File location: <code className="text-blue-400 font-mono">/supabase/schema_stores.sql</code></span>
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
