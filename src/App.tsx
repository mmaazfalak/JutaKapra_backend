import React, { useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboardView } from './views/AdminDashboardView';
import { AdminLoginView } from './views/AdminLoginView';
import { CommandKModal } from './components/CommandKModal';
import { ToastContainer } from './components/ToastContainer';
import { ExternalLink, ShieldCheck } from 'lucide-react';

const FRONTEND_URL = (import.meta as any).env?.VITE_FRONTEND_URL || 'https://jutakaprafrontend.vercel.app';

const AdminPortalShell: React.FC = () => {
  const { currentView, navigateTo, themeMode, isAdminAuthenticated, currentAdminUser } = useStore();

  const isAuthed = isAdminAuthenticated || Boolean(currentAdminUser);

  useEffect(() => {
    // If not authenticated, ensure routed to admin-login
    if (!isAuthed && currentView !== 'admin-login') {
      navigateTo('admin-login');
    } else if (isAuthed && currentView !== 'admin') {
      navigateTo('admin');
    }
  }, [isAuthed, currentView, navigateTo]);

  if (!isAuthed) {
    return (
      <div className={`min-h-screen ${themeMode === 'dark' ? 'bg-[#0b0e14] text-white' : 'bg-neutral-100 text-[#0a0a0a]'} flex flex-col items-center justify-center font-sans p-4`}>
        <div className="w-full max-w-md mb-4 flex items-center justify-between px-2 text-xs text-neutral-400">
          <div className="flex items-center space-x-1.5 font-semibold text-neutral-300">
            <ShieldCheck className="w-4 h-4 text-[#e5341f]" />
            <span>Juta Kapra — Management Backend</span>
          </div>
          <a
            href={FRONTEND_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 hover:text-[#e5341f] transition-colors"
          >
            <span>Customer Storefront</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <AdminLoginView />
        <ToastContainer />
      </div>
    );
  }

  return (
    <>
      <AdminLayout>
        <AdminDashboardView />
      </AdminLayout>
      <CommandKModal />
      <ToastContainer />
    </>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AdminPortalShell />
    </StoreProvider>
  );
}
