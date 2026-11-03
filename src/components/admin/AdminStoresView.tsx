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
  Truck,
  Download,
  CreditCard,
  Building,
  Check,
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
  const [revealedPasscodes, setRevealedPasscodes] = useState<{ [id: string]: boolean }>({});

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
  const [formDefaultCourier, setFormDefaultCourier] = useState('TCS Express');
  const [formPayoutAccountTitle, setFormPayoutAccountTitle] = useState('');
  const [formPayoutBankName, setFormPayoutBankName] = useState('Meezan Bank');
  const [formPayoutIbanOrPhone, setFormPayoutIbanOrPhone] = useState('');
  const [formBadge, setFormBadge] = useState('Verified Vault');

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
    setFormDescription('Curated vintage footwear and thrift streetwear partner.');
    setFormIsHidden(false);
    setFormDefaultCourier('TCS Express');
    setFormPayoutAccountTitle('');
    setFormPayoutBankName('Meezan Bank');
    setFormPayoutIbanOrPhone('');
    setFormBadge('Verified Vault');
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
    setFormDefaultCourier(store.defaultCourier || 'TCS Express');
    setFormPayoutAccountTitle(store.payoutAccountTitle || '');
    setFormPayoutBankName(store.payoutBankName || 'Meezan Bank');
    setFormPayoutIbanOrPhone(store.payoutIbanOrPhone || '');
    setFormBadge(store.badge || 'Verified Vault');
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

    const payload: Partial<StoreAccount> = {
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
      defaultCourier: formDefaultCourier,
      payoutAccountTitle: formPayoutAccountTitle.trim(),
      payoutBankName: formPayoutBankName.trim(),
      payoutIbanOrPhone: formPayoutIbanOrPhone.trim(),
      badge: formBadge,
    };

    if (editingStoreId) {
      updateStore(editingStoreId, payload);
      addToast({
        type: 'success',
        title: 'Store Updated',
        message: `${formName} configuration successfully updated.`,
      });
    } else {
      addStore(payload as any);
      addToast({
        type: 'success',
        title: 'Store Created',
        message: `New store ${formName} registered with ${formCommissionRate}% commission.`,
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

  const handleTogglePasscodeReveal = (storeId: string) => {
    setRevealedPasscodes((prev) => ({ ...prev, [storeId]: !prev[storeId] }));
  };

  const handleToggleStoreStatus = (store: StoreAccount) => {
    const nextStatus = store.status === 'active' ? 'suspended' : 'active';
    updateStore(store.id, { status: nextStatus });
    addToast({
      type: nextStatus === 'active' ? 'success' : 'info',
      title: `Store ${nextStatus === 'active' ? 'Activated' : 'Suspended'}`,
      message: `${store.name} account is now ${nextStatus}.`,
    });
  };

  const handleExportCsv = () => {
    const headers = [
      'Store ID',
      'Store Name',
      'City',
      'Owner Name',
      'Owner Email',
      'Owner Phone',
      'Passcode',
      'Commission %',
      'Default Courier',
      'Status',
      'Storefront Visibility',
      'Total Products',
      'Inventory Value (PKR)',
    ];

    const rows = stores.map((s) => {
      const stats = getStoreStats(s.id);
      return [
        `"${s.id}"`,
        `"${s.name}"`,
        `"${s.city || 'Islamabad'}"`,
        `"${s.ownerName}"`,
        `"${s.ownerEmail}"`,
        `"${s.ownerPhone || ''}"`,
        `"${s.passcode || 'store123'}"`,
        `"${s.commissionRate || 10}%"`,
        `"${s.defaultCourier || 'TCS Express'}"`,
        `"${s.status}"`,
        `"${s.isHidden ? 'Hidden' : 'Live'}"`,
        `"${stats.totalProducts}"`,
        `"${stats.totalInventoryValue}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `jutakapra_stores_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'Store Directory Exported',
      message: `Downloaded directory for ${stores.length} store accounts as CSV.`,
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
              You have complete unrestricted access across all stores, products, fulfillment, commissions, and passcodes.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
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
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all cursor-pointer shadow-sm"
            >
              Clear Focus (Show All)
            </button>
          )}
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download store directory as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
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
                  <span>{isSupabaseStoresSynced ? 'Supabase Synced' : 'Cloud DB Active'}</span>
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${textMuted}`}>
                Manage independent store accounts saved in Supabase database with isolated vendor logins, products, and courier shipping.
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
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

      {/* STORES TABLE IN ROWS (High-Density Enterprise Row View) */}
      <div className={`rounded-2xl border ${cardBg} overflow-hidden shadow-xl`}>
        {/* Table Header Row (Desktop) */}
        <div className="hidden xl:grid grid-cols-12 gap-3 px-5 py-3.5 bg-black/35 border-b border-inherit text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <div className="col-span-3">Store &amp; Location</div>
          <div className="col-span-3">Owner Contact &amp; Login</div>
          <div className="col-span-2">Products &amp; Value</div>
          <div className="col-span-2">Commission &amp; Shipping</div>
          <div className="col-span-2 text-right">Master Actions</div>
        </div>

        {/* Rows List */}
        <div className="divide-y divide-slate-800/80">
          {filteredStores.map((store) => {
            const stats = getStoreStats(store.id);
            const isCurrentActive = currentStoreId === store.id;
            const isPasscodeRevealed = !!revealedPasscodes[store.id];

            return (
              <div
                key={store.id}
                className={`p-4 sm:p-5 transition-all duration-150 flex flex-col xl:grid xl:grid-cols-12 gap-4 items-start xl:items-center ${
                  isCurrentActive ? 'bg-blue-950/20 border-l-4 border-l-blue-500' : 'hover:bg-white/[0.02]'
                }`}
              >
                {/* 1. Store & Location (Cols 1-3) */}
                <div className="xl:col-span-3 flex items-start space-x-3 w-full">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 text-white flex items-center justify-center text-base font-black shrink-0 shadow-md">
                    {store.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="font-bold text-sm text-white tracking-tight truncate">{store.name}</h4>
                      {store.isHidden ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Hidden
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Live
                        </span>
                      )}
                      {store.status === 'suspended' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                          Suspended
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{store.city || 'Islamabad'}</span>
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="font-mono text-[10px] text-slate-500 truncate">{store.id}</span>
                    </div>
                    {store.badge && (
                      <span className="inline-block mt-1 text-[9px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        ✨ {store.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Owner & Credentials (Cols 4-6) */}
                <div className="xl:col-span-3 text-xs space-y-1 w-full bg-black/20 xl:bg-transparent p-3 xl:p-0 rounded-xl">
                  <div className="flex items-center justify-between xl:justify-start gap-2">
                    <span className="font-semibold text-slate-200 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      <span>{store.ownerName}</span>
                    </span>
                    <button
                      onClick={() => handleCopyCredentials(store)}
                      className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copy store owner login credentials"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Login</span>
                    </button>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 truncate flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{store.ownerEmail}</span>
                  </div>

                  <div className="text-[11px] flex items-center justify-between text-slate-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3 h-3 text-slate-500" />
                      <span>Passcode:</span>
                      <span className="font-semibold text-emerald-400">
                        {isPasscodeRevealed ? store.passcode || 'store123' : '••••••••'}
                      </span>
                    </span>
                    <button
                      onClick={() => handleTogglePasscodeReveal(store.id)}
                      className="text-slate-500 hover:text-slate-300 cursor-pointer ml-1"
                      title={isPasscodeRevealed ? 'Hide passcode' : 'Show passcode'}
                    >
                      {isPasscodeRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* 3. Products & Value (Cols 7-8) */}
                <div className="xl:col-span-2 text-xs w-full">
                  <div className="flex items-center justify-between xl:block">
                    <span className="font-bold text-sm text-white font-mono">
                      {stats.totalProducts} <span className="text-xs font-normal text-slate-400">Products</span>
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold block xl:mt-0.5">
                      {formatPKR(stats.totalInventoryValue)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                    <span>1-of-1: <strong className="text-amber-400">{stats.thrift1of1Count}</strong></span>
                    <span>•</span>
                    <span>Multi: <strong className="text-blue-400">{stats.multiStockCount}</strong></span>
                    <span>•</span>
                    <span>In-Stock: <strong className="text-slate-200">{stats.inStockCount}</strong></span>
                  </div>
                </div>

                {/* 4. Commission & Shipping (Cols 9-10) */}
                <div className="xl:col-span-2 text-xs w-full space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Commission:</span>
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {store.commissionRate || 10}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Truck className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>Courier: <strong className="text-slate-300">{store.defaultCourier || 'TCS Express'}</strong></span>
                  </div>
                  {store.payoutBankName && (
                    <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{store.payoutBankName}</span>
                    </div>
                  )}
                </div>

                {/* 5. Master Actions (Cols 11-12) */}
                <div className="xl:col-span-2 flex flex-wrap xl:flex-nowrap items-center justify-start xl:justify-end gap-1.5 w-full">
                  <button
                    onClick={() => handleSwitchToStoreProducts(store.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                    title="Manage products for this store"
                  >
                    <Package className="w-3 h-3" />
                    <span>Products ({stats.totalProducts})</span>
                  </button>

                  <button
                    onClick={() => handleSwitchToStoreOrders(store.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold border border-slate-700 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                    title="Manage fulfillment and deliveries"
                  >
                    <Truck className="w-3 h-3 text-blue-400" />
                    <span>Orders</span>
                  </button>

                  <button
                    onClick={() => toggleStoreVisibility(store.id)}
                    title={store.isHidden ? 'Make live on storefront' : 'Hide all products from storefront'}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      store.isHidden
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {store.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleOpenEditStore(store)}
                    title="Edit Store Configuration"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setConfirmDeleteStore(store)}
                    title="Delete Store Account"
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredStores.length === 0 && (
            <div className="p-12 text-center space-y-3">
              <Store className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="font-bold text-sm text-white">No store accounts found</h4>
              <p className={`text-xs ${textMuted} max-w-sm mx-auto`}>
                No registered store accounts match your search filters. Try clearing your query or create a new store.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                  setFilterVisibility('all');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREATE OR EDIT STORE ACCOUNT (Includes all missing options) */}
      {isStoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-2xl rounded-2xl shadow-2xl border ${cardBg} p-6 space-y-5 text-white max-h-[92vh] overflow-y-auto custom-scrollbar`}>
            <div className="flex items-center justify-between border-b border-inherit pb-3.5">
              <div>
                <h3 className="font-bold text-base text-white">
                  {editingStoreId ? 'Edit Store & Owner Account' : 'Create New Store Account'}
                </h3>
                <p className={`text-xs mt-0.5 ${textMuted}`}>
                  Configure store credentials, courier logistics, and commission rates.
                </p>
              </div>
              <button
                onClick={() => setIsStoreModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStore} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Store Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Store Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Vintage Vault F-7"
                    className={`w-full px-3 py-2 rounded-xl text-xs ${inputBg} focus:outline-none focus:border-blue-500`}
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. vintage-vault-f7"
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono ${inputBg} focus:outline-none focus:border-blue-500`}
                  />
                </div>

                {/* Owner Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Store Owner / Manager Name
                  </label>
                  <input
                    type="text"
                    value={formOwnerName}
                    onChange={(e) => setFormOwnerName(e.target.value)}
                    placeholder="e.g. Hamza Khan"
                    className={`w-full px-3 py-2 rounded-xl text-xs ${inputBg} focus:outline-none focus:border-blue-500`}
                  />
                </div>

                {/* Owner Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Owner Login Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formOwnerEmail}
                    onChange={(e) => setFormOwnerEmail(e.target.value)}
                    placeholder="e.g. owner@vintagevault.pk"
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono ${inputBg} focus:outline-none focus:border-blue-500`}
                  />
                </div>

                {/* Owner Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Owner WhatsApp / Contact Phone
                  </label>
                  <input
                    type="text"
                    value={formOwnerPhone}
                    onChange={(e) => setFormOwnerPhone(e.target.value)}
                    placeholder="e.g. +92 300 1234567"
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono ${inputBg} focus:outline-none focus:border-blue-500`}
                  />
                </div>

                {/* Store Passcode */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Store Login Passcode
                  </label>
                  <input
                    type="text"
                    required
                    value={formPasscode}
                    onChange={(e) => setFormPasscode(e.target.value)}
                    placeholder="e.g. store123"
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono ${inputBg} focus:outline-none focus:border-blue-500`}
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    City Location
                  </label>
                  <select
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs ${inputBg} focus:outline-none focus:border-blue-500 cursor-pointer`}
                  >
                    <option value="Islamabad">Islamabad</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Peshawar">Peshawar</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Multan">Multan</option>
                    <option value="Quetta">Quetta</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Commission Rate */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Platform Commission Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={formCommissionRate}
                      onChange={(e) => setFormCommissionRate(Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-mono ${inputBg} focus:outline-none focus:border-blue-500`}
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>

                {/* Default Courier Partner */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Default Courier Partner
                  </label>
                  <select
                    value={formDefaultCourier}
                    onChange={(e) => setFormDefaultCourier(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs ${inputBg} focus:outline-none focus:border-blue-500 cursor-pointer`}
                  >
                    <option value="TCS Express">TCS Express</option>
                    <option value="Leopards Courier">Leopards Courier</option>
                    <option value="Trax Logistics">Trax Logistics</option>
                    <option value="Call Courier">Call Courier</option>
                    <option value="PostEx">PostEx</option>
                    <option value="M&P Express">M&P Express</option>
                  </select>
                </div>

                {/* Store Tier / Badge */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Store Badge / Tier
                  </label>
                  <select
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs ${inputBg} focus:outline-none focus:border-blue-500 cursor-pointer`}
                  >
                    <option value="Verified Vault">Verified Vault</option>
                    <option value="Vintage Archive">Vintage Archive</option>
                    <option value="Official Partner">Official Partner</option>
                    <option value="Streetwear Drop">Streetwear Drop</option>
                  </select>
                </div>
              </div>

              {/* Physical Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Physical Store Address / Drop-Off Point
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="e.g. Shop 4B, Beverly Centre, Blue Area, Islamabad"
                  className={`w-full px-3 py-2 rounded-xl text-xs ${inputBg} focus:outline-none focus:border-blue-500`}
                />
              </div>

              {/* Seller Payout Bank Information */}
              <div className="p-3.5 rounded-xl bg-black/25 border border-inherit space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-blue-400">
                  <Building className="w-4 h-4" />
                  <span>Store Owner Payout Bank Account (Optional)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Account Title</label>
                    <input
                      type="text"
                      value={formPayoutAccountTitle}
                      onChange={(e) => setFormPayoutAccountTitle(e.target.value)}
                      placeholder="e.g. Hamza Khan"
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Bank / Wallet Name</label>
                    <input
                      type="text"
                      value={formPayoutBankName}
                      onChange={(e) => setFormPayoutBankName(e.target.value)}
                      placeholder="e.g. Meezan Bank / JazzCash"
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">IBAN / Account #</label>
                    <input
                      type="text"
                      value={formPayoutIbanOrPhone}
                      onChange={(e) => setFormPayoutIbanOrPhone(e.target.value)}
                      placeholder="e.g. PK36MEZN..."
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono ${inputBg}`}
                    />
                  </div>
                </div>
              </div>

              {/* Status & Visibility Switches */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-inherit">
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-inherit">
                  <div>
                    <span className="text-xs font-semibold text-white block">Account Status</span>
                    <span className="text-[10px] text-slate-400 block">
                      {formStatus === 'active' ? 'Active — store owner can login' : 'Suspended — login disabled'}
                    </span>
                  </div>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-lg bg-black/30 border border-slate-700 text-xs font-bold text-white cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-inherit">
                  <div>
                    <span className="text-xs font-semibold text-white block">Storefront Visibility</span>
                    <span className="text-[10px] text-slate-400 block">
                      {formIsHidden ? 'Hidden — products unlisted' : 'Live — visible to buyers'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormIsHidden(!formIsHidden)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      formIsHidden
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {formIsHidden ? 'Hidden' : 'Live on Site'}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setIsStoreModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-inherit text-xs font-semibold hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer active:scale-95"
                >
                  {editingStoreId ? 'Update Store Account' : 'Save & Deploy Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE STORE */}
      {confirmDeleteStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl border ${cardBg} p-6 space-y-4 text-white`}>
            <div className="flex items-center space-x-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base">Delete Store Account?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <strong>{confirmDeleteStore.name}</strong> ({confirmDeleteStore.ownerEmail})?
              All associated inventory items will revert to the central platform store.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-inherit">
              <button
                onClick={() => setConfirmDeleteStore(null)}
                className="px-4 py-2 rounded-xl border border-inherit text-xs font-semibold hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteStore(confirmDeleteStore.id);
                  addToast({
                    type: 'info',
                    title: 'Store Deleted',
                    message: `${confirmDeleteStore.name} account deleted from platform.`,
                  });
                  setConfirmDeleteStore(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: POSTGRESQL SQL SCHEMA */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-2xl rounded-2xl shadow-2xl border ${cardBg} p-6 space-y-4 text-white font-mono text-xs max-h-[85vh] overflow-y-auto custom-scrollbar`}>
            <div className="flex items-center justify-between border-b border-inherit pb-3 font-sans">
              <div>
                <h3 className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span>Supabase PostgreSQL Schema: public.stores</span>
                </h3>
                <span className="text-[11px] text-slate-400">Live schema executed on kbdrlhiishmetsddlstq</span>
              </div>
              <button onClick={() => setIsSqlModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-black/60 border border-slate-800 text-[11px] text-emerald-400 whitespace-pre-wrap overflow-x-auto">
{`CREATE TABLE IF NOT EXISTS public.stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  owner_email TEXT NOT NULL,
  owner_name TEXT,
  owner_phone TEXT,
  passcode TEXT DEFAULT 'store123',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  is_hidden BOOLEAN DEFAULT FALSE,
  city TEXT DEFAULT 'Islamabad',
  address TEXT,
  commission_rate NUMERIC DEFAULT 10,
  logo_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Allow public read access to live stores
CREATE POLICY "Allow public read access on stores"
  ON public.stores FOR SELECT USING (true);

-- Allow full master access for service role and admin
CREATE POLICY "Allow service role full access on stores"
  ON public.stores FOR ALL USING (true);`}
            </pre>

            <div className="flex justify-end pt-2 font-sans">
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs cursor-pointer"
              >
                Close Schema
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
