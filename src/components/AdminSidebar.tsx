import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Calendar,
  Users,
  Star,
  LifeBuoy,
  ShieldCheck,
  FileText,
  UserCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Flame,
  X,
  Store,
  ExternalLink,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface AdminSidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const {
    activeAdminModule,
    setActiveAdminModule,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    orders,
    supportTickets,
    stores,
    adminRole,
    currentStoreId,
    themeMode,
  } = useStore();

  const isDark = themeMode === 'dark';
  const isStoreOwner = adminRole === 'store_owner';

  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'Processing' || o.status === 'Pending'
  ).length;

  const openTicketsCount = supportTickets.filter((t) => t.status === 'Open').length;

  const navGroups: NavGroup[] = isStoreOwner
    ? [
        {
          title: 'STORE COMMERCE',
          items: [
            { id: 'products', label: 'My Store Products', icon: Package },
            {
              id: 'orders',
              label: 'Store Orders',
              icon: ShoppingBag,
              badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
              badgeColor: 'bg-[#fef2f2] text-[#dc2626]',
            },
            { id: 'dashboard', label: 'Store Overview', icon: LayoutDashboard },
          ],
        },
      ]
    : [
        {
          title: 'COMMERCE & STORES',
          items: [
            { id: 'stores', label: 'Store Management', icon: Store, badge: stores.length, badgeColor: 'bg-blue-500/20 text-blue-400' },
            { id: 'products', label: 'Products & Inventory', icon: Package },
            {
              id: 'orders',
              label: 'Orders & Deliveries',
              icon: ShoppingBag,
              badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
              badgeColor: 'bg-[#fef2f2] text-[#dc2626]',
            },
            { id: 'dashboard', label: 'Analytics Dashboard', icon: LayoutDashboard },
            { id: 'drops', label: 'Drop Calendar', icon: Calendar },
          ],
        },
        {
          title: 'CRM & USERS',
          items: [
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'reviews', label: 'Reviews', icon: Star },
            {
              id: 'support',
              label: 'Support Tickets',
              icon: LifeBuoy,
              badge: openTicketsCount > 0 ? openTicketsCount : undefined,
              badgeColor: 'bg-[#fef3c7] text-[#b45309]',
            },
          ],
        },
        {
          title: 'SETTINGS & SECURITY',
          items: [
            { id: 'payments', label: 'Payment Gateways', icon: ShieldCheck },
            { id: 'audit_logs', label: 'Audit Logs', icon: FileText },
            { id: 'team_rbac', label: 'Team RBAC', icon: UserCheck },
            { id: 'store_config', label: 'Store Config', icon: Settings },
          ],
        },
      ];

  const handleSelectModule = (id: string) => {
    setActiveAdminModule(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderContent = (isMobileView: boolean) => (
    <>
      {/* Brand Header */}
      <div className={`h-[60px] px-4 flex items-center justify-between border-b ${isDark ? 'border-[#232833]' : 'border-slate-200'}`}>
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Flame className="w-5 h-5 fill-white" />
          </div>
          {(!isSidebarCollapsed || isMobileView) && (
            <div className="leading-none whitespace-nowrap">
              <span className={`font-bold text-sm tracking-tight block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Forge Operations
              </span>
              <span className={`text-[10px] font-mono uppercase tracking-wider block mt-0.5 ${isDark ? 'text-[#9aa4b2]' : 'text-slate-500'}`}>
                v2.6 Enterprise
              </span>
            </div>
          )}
        </div>

        {isMobileView && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className={`p-1.5 rounded-lg ${isDark ? 'bg-[#1c222e] text-[#9aa4b2] hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Menu Groups */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1.5">
            {!isSidebarCollapsed || isMobileView ? (
              <h5 className={`px-3 text-[10.5px] font-bold tracking-wider uppercase ${isDark ? 'text-[#9aa4b2]' : 'text-slate-400'}`}>
                {group.title}
              </h5>
            ) : (
              <div className={`h-px my-2 ${isDark ? 'bg-[#232833]' : 'bg-slate-200'}`} />
            )}
            <nav className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeAdminModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectModule(item.id)}
                    title={isSidebarCollapsed && !isMobileView ? item.label : undefined}
                    className={`w-full flex items-center ${
                      isSidebarCollapsed && !isMobileView ? 'justify-center px-0' : 'px-3'
                    } py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? isDark
                          ? 'bg-[#1e2a44] text-white font-semibold'
                          : 'bg-slate-900 text-white font-semibold shadow-xs'
                        : isDark
                        ? 'text-[#9aa4b2] hover:bg-[#1a202c] hover:text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    {(!isSidebarCollapsed || isMobileView) && (
                      <span className="ml-3 truncate flex-1 text-left">{item.label}</span>
                    )}
                    {(!isSidebarCollapsed || isMobileView) && item.badge !== undefined && (
                      <span
                        className={`rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold shrink-0 ${
                          item.badgeColor || (isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800')
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Live Storefront Link */}
      {(!isSidebarCollapsed || isMobileView) && (
        <div className="px-3 py-1.5 border-t border-dashed border-neutral-700/50">
          <a
            href={(import.meta as any).env?.VITE_FRONTEND_URL || 'https://jutakaprafrontend.vercel.app'}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center space-x-2 text-xs py-2 px-2.5 rounded-lg transition-colors ${isDark ? 'text-neutral-400 hover:text-white hover:bg-[#1a202c]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#e5341f]" />
            <span className="font-medium truncate">View Live Storefront</span>
          </a>
        </div>
      )}

      {/* Footer / User Profile */}
      <div className={`p-3 border-t flex items-center justify-between ${isDark ? 'border-[#232833] bg-[#0b0e14]' : 'border-slate-200 bg-slate-50'}`}>
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            FA
          </div>
          {(!isSidebarCollapsed || isMobileView) && (
            <div className="leading-tight overflow-hidden whitespace-nowrap">
              <span className={`text-xs font-semibold block truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Principal Admin
              </span>
              <span className={`text-[10px] block truncate ${isDark ? 'text-[#9aa4b2]' : 'text-slate-500'}`}>architect@forge.supply</span>
            </div>
          )}
        </div>
        {!isMobileView && (
          <button
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isDark ? 'bg-[#1c222e] hover:bg-[#283244] text-[#9aa4b2] hover:text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-900'}`}
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* 1. DESKTOP PERSISTENT SIDEBAR (Hidden on mobile < 768px, flex on md+) */}
      <aside
        className={`hidden md:flex fixed top-0 left-0 bottom-0 z-40 ${
          isDark
            ? 'bg-[#12151c] text-[#e5e9f0] border-r border-[#232833]'
            : 'bg-white text-slate-800 border-r border-slate-200'
        } flex-col transition-all duration-200 ease-in-out select-none ${
          isSidebarCollapsed ? 'w-[76px]' : 'w-[260px]'
        }`}
      >
        {renderContent(false)}
      </aside>

      {/* 2. MOBILE SLIDE-OUT OVERLAY DRAWER (< 768px) */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs md:hidden animate-fade-in"
        />
      )}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-[280px] ${
          isDark
            ? 'bg-[#12151c] text-[#e5e9f0] border-r border-[#232833]'
            : 'bg-white text-slate-800 border-r border-slate-200 shadow-2xl'
        } flex flex-col md:hidden transition-transform duration-300 ease-in-out select-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderContent(true)}
      </aside>
    </>
  );
};
