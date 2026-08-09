'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Cpu,
  RefreshCw,
  GitCompare,
  FolderLock,
  CheckSquare,
  MessageSquareShare,
  Calendar,
  BarChart3,
  UserCheck,
  Code2,
  Settings,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  onOpenAICopilot: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | null;
  permission?: string | null;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Sidebar({ onOpenAICopilot, isOpenMobile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();

  const navigationSections: NavSection[] = [
    {
      title: 'PRACTICE',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: null },
        { label: 'Clients 360°', href: '/clients', icon: Users, badge: '5 Active', permission: 'viewClients' },
        { label: 'My Work', href: '/my-work', icon: Briefcase, badge: 'Action', permission: null },
      ],
    },
    {
      title: 'GST & COMPLIANCE',
      items: [
        { label: 'GST Automation', href: '/gst-automation', icon: Cpu, badge: 'Vault', permission: 'viewGstData' },
        { label: 'GSTR-2B Pipeline', href: '/gstr-2b', icon: RefreshCw, badge: 'July 26', permission: 'viewGstData' },
        { label: 'AI Reconciliation', href: '/reconciliation', icon: GitCompare, badge: '13 Rules', permission: 'runReconciliation' },
      ],
    },
    {
      title: 'DOCUMENTS & WORKFLOW',
      items: [
        { label: 'Document Vault', href: '/documents', icon: FolderLock, permission: 'viewDocuments' },
        { label: 'Tasks & Kanban', href: '/tasks', icon: CheckSquare, badge: '3 Due', permission: null },
        { label: 'WhatsApp & Email', href: '/communication', icon: MessageSquareShare, badge: 'Bulk', permission: 'sendWhatsApp' },
        { label: 'Compliance Calendar', href: '/calendar', icon: Calendar, permission: null },
      ],
    },
    {
      title: 'REPORTING',
      items: [
        { label: 'Summary Reports', href: '/reports', icon: BarChart3, badge: 'PDF/XLS', permission: 'viewReports' },
      ],
    },
    {
      title: 'TEAM',
      items: [
        { label: 'Staff & Scopes', href: '/staff', icon: UserCheck, badge: '5 Staff', permission: 'manageStaff' },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { label: 'Developer & Operations', href: '/developer', icon: Code2, badge: 'v2.4', permission: 'developerAccess' },
        { label: 'Practice Settings', href: '/settings', icon: Settings, permission: null },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-transform lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation Links Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {navigationSections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {sec.title}
              </div>

              {sec.items.map((item) => {
                if (item.permission && !hasPermission(item.permission as any)) {
                  return null;
                }

                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));

                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 shadow-sm border border-brand-200/80 dark:border-brand-800/80'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                          isActive
                            ? 'text-brand-600 dark:text-brand-400'
                            : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isActive
                            ? 'bg-brand-600 text-white dark:bg-brand-400 dark:text-slate-950'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom AI Assistant Card & Compliance Trust */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="rounded-xl border border-brand-200 dark:border-brand-800/60 bg-gradient-to-br from-brand-50/80 to-purple-50/50 dark:from-brand-950/40 dark:to-purple-950/20 p-3 shadow-subtle">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">TaxNexus Copilot</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              AI-powered reconciliation explainer & GST notice assistance.
            </p>
            <button
              onClick={onOpenAICopilot}
              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 border border-brand-200 dark:border-brand-700/80 py-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
            >
              <span>Launch Copilot</span>
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500" /> Sec 16(2)(aa) 2B
            </span>
            <span>v2.4.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
