'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { TopNav } from '@/components/layout/TopNav';
import { Sidebar } from '@/components/layout/Sidebar';
import { GlobalSearchModal } from '@/components/common/GlobalSearchModal';
import { QuickAddModal } from '@/components/common/QuickAddModal';
import { AICopilotDrawer } from '@/components/ai/AICopilotDrawer';
import { Menu } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white font-bold text-xl shadow-lg shadow-brand-500/30 animate-pulse">
          TN
        </div>
        <p className="text-xs text-slate-400 font-medium">Verifying practice session credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top Navigation */}
      <TopNav
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenAICopilot={() => setIsAICopilotOpen(true)}
      />

      <div className="flex flex-1">
        {/* Left Sidebar */}
        <Sidebar
          onOpenAICopilot={() => setIsAICopilotOpen(true)}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 min-h-[calc(100vh-4rem)] flex flex-col">
          {/* Mobile menu trigger bar */}
          <div className="lg:hidden flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <Menu className="h-4 w-4" />
              <span>Menu</span>
            </button>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="text-xs font-medium text-slate-500 p-1.5"
            >
              Search...
            </button>
          </div>

          <div className="p-4 md:p-6 lg:p-8 flex-1 max-w-[1600px] w-full mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <QuickAddModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />
      <AICopilotDrawer isOpen={isAICopilotOpen} onClose={() => setIsAICopilotOpen(false)} />
    </div>
  );
}
