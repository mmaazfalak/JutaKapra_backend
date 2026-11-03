import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Users, Package, ArrowRight, X, Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatPKR } from '../utils/format';

export const CommandKModal: React.FC = () => {
  const {
    isCommandKOpen,
    setIsCommandKOpen,
    products,
    orders,
    customers,
    setActiveAdminModule,
    themeMode,
  } = useStore();

  const [query, setQuery] = useState('');

  // Reset query on open
  useEffect(() => {
    if (isCommandKOpen) {
      setQuery('');
    }
  }, [isCommandKOpen]);

  if (!isCommandKOpen) return null;

  const cleanQ = query.trim().toLowerCase();

  const matchingProducts = (cleanQ
    ? products.filter(
        (p) =>
          !p.isHidden &&
          !p.isArchived &&
          (p.title.toLowerCase().includes(cleanQ) ||
            p.id.toLowerCase().includes(cleanQ) ||
            p.slug.toLowerCase().includes(cleanQ) ||
            p.category.toLowerCase().includes(cleanQ))
      )
    : products.filter((p) => !p.isHidden && !p.isArchived)
  )
    .sort((a, b) => {
      const aStock = a.inStock && (a.stockCount === undefined || a.stockCount > 0);
      const bStock = b.inStock && (b.stockCount === undefined || b.stockCount > 0);
      if (aStock && !bStock) return -1;
      if (!aStock && bStock) return 1;
      return 0;
    })
    .slice(0, 4);

  const matchingOrders = cleanQ
    ? orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(cleanQ) ||
          o.customer.fullName.toLowerCase().includes(cleanQ) ||
          o.customer.email.toLowerCase().includes(cleanQ) ||
          o.id.toLowerCase().includes(cleanQ)
      )
    : orders.slice(0, 3);

  const matchingCustomers = cleanQ
    ? customers.filter(
        (c) =>
          c.fullName.toLowerCase().includes(cleanQ) ||
          c.email.toLowerCase().includes(cleanQ) ||
          c.phone.toLowerCase().includes(cleanQ) ||
          c.id.toLowerCase().includes(cleanQ)
      )
    : customers.slice(0, 3);

  const handleSelectProduct = () => {
    setActiveAdminModule('products');
    setIsCommandKOpen(false);
  };

  const handleSelectOrder = () => {
    setActiveAdminModule('orders');
    setIsCommandKOpen(false);
  };

  const handleSelectCustomer = () => {
    setActiveAdminModule('customers');
    setIsCommandKOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border ${
          themeMode === 'dark' ? 'bg-[#12151c] border-[#232833] text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Input Header */}
        <div className="p-4 border-b border-inherit flex items-center space-x-3">
          <Search className="w-5 h-5 text-blue-500 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a product SKU, order #, or customer email..."
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder-slate-400"
          />
          <button
            onClick={() => setIsCommandKOpen(false)}
            className="p-1 rounded-md hover:bg-slate-500/10 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6 custom-scrollbar text-xs">
          {/* Orders Section */}
          {matchingOrders.length > 0 && (
            <div>
              <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
                <span>Orders Pipeline</span>
              </h6>
              <div className="space-y-1">
                {matchingOrders.map((o) => (
                  <button
                    key={o.id}
                    onClick={handleSelectOrder}
                    className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                      themeMode === 'dark'
                        ? 'border-[#232833] hover:bg-[#1e2430]'
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="font-mono text-xs font-bold text-blue-500">{o.orderNumber}</div>
                      <div>
                        <div className="font-semibold text-slate-200 dark:text-slate-100">{o.customer.fullName}</div>
                        <div className="text-[11px] text-slate-400">{o.customer.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-200 dark:text-slate-100">{formatPKR(o.total)}</div>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400">
                        {o.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customers Section */}
          {matchingCustomers.length > 0 && (
            <div>
              <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <span>CRM Customer Accounts</span>
              </h6>
              <div className="space-y-1">
                {matchingCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={handleSelectCustomer}
                    className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                      themeMode === 'dark'
                        ? 'border-[#232833] hover:bg-[#1e2430]'
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">
                        {c.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200 dark:text-slate-100">{c.fullName}</div>
                        <div className="text-[11px] text-slate-400">{c.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.accountType === 'AUTO_GUEST'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {c.accountType}
                      </span>
                      <div className="text-[11px] font-bold text-slate-400 mt-0.5">
                        LTV: {formatPKR(c.lifetimeValue)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products Section */}
          {matchingProducts.length > 0 && (
            <div>
              <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Package className="w-3.5 h-3.5 text-amber-500" />
                <span>Thrift Inventory Products</span>
              </h6>
              <div className="space-y-1">
                {matchingProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={handleSelectProduct}
                    className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                      themeMode === 'dark'
                        ? 'border-[#232833] hover:bg-[#1e2430]'
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="w-9 h-9 rounded-lg object-cover bg-slate-800"
                      />
                      <div>
                        <div className="font-semibold text-slate-200 dark:text-slate-100 truncate max-w-[320px]">
                          {p.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Size: {p.size} • Grade: {p.conditionGrade}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-200 dark:text-slate-100">{formatPKR(p.price)}</div>
                      <span className="text-[10px] font-mono text-slate-400">{p.id}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-black/10 dark:bg-white/5 border-t border-inherit text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Forge.Supply Operations Command Palette</span>
          </div>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
