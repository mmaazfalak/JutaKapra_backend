import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { CommandKModal } from './CommandKModal';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { themeMode, isSidebarCollapsed } = useStore();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const surfaceBg =
    themeMode === 'dark'
      ? 'bg-[#0b0e14] text-[#e5e9f0]'
      : 'bg-[#f6f7f9] text-[#0f172a]';

  return (
    <div className={`min-h-screen ${surfaceBg} font-sans flex relative select-none max-w-full overflow-x-hidden`}>
      {/* Isolated Dark Sidebar (Desktop persistent + Mobile slide-out drawer) */}
      <AdminSidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 60px Fixed Enterprise Header (Breadcrumbs, Hamburger toggle, ⌘K search, status pulse) */}
      <AdminHeader onOpenMobileMenu={() => setIsMobileSidebarOpen(true)} />

      {/* Global Command K Search Palette */}
      <CommandKModal />

      {/* Main CRM Workspace Canvas (ml-0 on mobile <768px, md:ml-[260px]/[76px] on desktop) */}
      <main
        className={`flex-1 pt-[80px] sm:pt-[84px] transition-all duration-200 ml-0 ${
          isSidebarCollapsed ? 'md:ml-[76px]' : 'md:ml-[260px]'
        } p-3 sm:p-6 max-w-[1600px] mx-auto min-h-screen w-full overflow-x-hidden`}
      >
        {children}
      </main>
    </div>
  );
};
