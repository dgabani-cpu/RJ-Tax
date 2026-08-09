'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTheme, AccentColor } from '@/lib/theme/ThemeContext';
import { RoleType } from '@/types';
import {
  Search,
  Bell,
  Plus,
  Moon,
  Sun,
  Palette,
  Shield,
  LogOut,
  User,
  Sliders,
  CheckCircle,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { INITIAL_NOTIFICATIONS } from '@/lib/db/mockDb';

interface TopNavProps {
  onOpenSearch: () => void;
  onOpenQuickAdd: () => void;
  onOpenAICopilot: () => void;
}

export function TopNav({ onOpenSearch, onOpenQuickAdd, onOpenAICopilot }: TopNavProps) {
  const { user, logout, switchDemoRole, auditLogs } = useAuth();
  const { theme, setTheme, accent, setAccent, resolvedTheme } = useTheme();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const accentOptions: { name: AccentColor; label: string; bgClass: string }[] = [
    { name: 'indigo', label: 'Royal Indigo', bgClass: 'bg-indigo-600' },
    { name: 'blue', label: 'Classic Blue', bgClass: 'bg-blue-600' },
    { name: 'green', label: 'Emerald Green', bgClass: 'bg-emerald-600' },
    { name: 'purple', label: 'Imperial Purple', bgClass: 'bg-purple-600' },
    { name: 'teal', label: 'Ocean Teal', bgClass: 'bg-teal-600' },
    { name: 'orange', label: 'Warm Orange', bgClass: 'bg-orange-600' },
  ];

  const demoRoles: { role: RoleType; label: string }[] = [
    { role: 'SUPER_ADMIN', label: 'Super Admin (CA Partner)' },
    { role: 'MANAGER', label: 'Manager (Sneha Patel)' },
    { role: 'STAFF', label: 'Senior Staff (Amit Verma)' },
    { role: 'ACCOUNTANT', label: 'Accountant (Pooja Shah)' },
    { role: 'DATA_ENTRY', label: 'Data Entry (Karan Mehra)' },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 md:px-6 backdrop-blur-md transition-colors">
      {/* Left: Brand Identity / Mobile menu toggle indicator */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-700 via-brand-600 to-brand-500 text-white font-bold text-lg shadow-sm shadow-brand-500/20 group-hover:scale-105 transition-transform">
            TN
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              TaxNexus
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                PRACTICE SaaS
              </span>
            </span>
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
              Tax & Accounting Practice Management
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Global Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <button
          onClick={onOpenSearch}
          type="button"
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-500 dark:text-slate-400 hover:border-brand-500 dark:hover:border-brand-400 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-subtle"
        >
          <span className="flex items-center gap-2.5">
            <Search className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              Search Client, GSTIN, PAN, Invoices, Tasks...
            </span>
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right Controls: AI Assistant, Quick Add, Theme/Accent, Notif, Role Switcher & User Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Ask AI Copilot Button */}
        <button
          onClick={onOpenAICopilot}
          className="hidden lg:flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500/10 to-purple-500/10 dark:from-brand-950/60 dark:to-purple-950/60 border border-brand-200 dark:border-brand-800/80 px-3 py-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300 hover:shadow-sm hover:border-brand-400 transition-all"
        >
          <Sparkles className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400 animate-pulse" />
          <span>Ask TaxNexus Copilot</span>
        </button>

        {/* Quick Add Button */}
        <button
          onClick={onOpenQuickAdd}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm shadow-brand-500/20 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Quick Action</span>
        </button>

        {/* Theme & Accent Palette Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
            title="Appearance & Accent Theme"
          >
            <Palette className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          </button>

          {isThemeMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-modal z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Appearance & Theme</span>
                <button
                  onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  {resolvedTheme === 'dark' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
                  {resolvedTheme === 'dark' ? 'Light' : 'Dark'}
                </button>
              </div>

              <div className="pt-2.5">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Accent Color</span>
                <div className="grid grid-cols-3 gap-1.5 mt-2">
                  {accentOptions.map((opt) => (
                    <button
                      key={opt.name}
                      onClick={() => {
                        setAccent(opt.name);
                        setIsThemeMenuOpen(false);
                      }}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border text-left transition-all ${
                        accent === opt.name
                          ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${opt.bgClass}`} />
                      <span className="truncate text-[11px]">{opt.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Center */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-modal z-50 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-850">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-brand-100 dark:bg-brand-950 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:text-brand-300">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors ${
                      !notif.read ? 'bg-brand-50/30 dark:bg-brand-950/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        {notif.type === 'SUCCESS' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                        {notif.type === 'WARNING' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                        {notif.type === 'ERROR' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        {notif.type === 'INFO' && <Clock className="h-4 w-4 text-blue-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{notif.title}</p>
                        <p className="text-[11.5px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{notif.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dev-Only RBAC Scope Tester Pill */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="hidden xl:flex items-center">
            <select
              value={user?.role || 'SUPER_ADMIN'}
              onChange={(e) => switchDemoRole(e.target.value as RoleType)}
              className="text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 rounded-lg px-2.5 py-1.5 text-amber-900 dark:text-amber-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              title="Dev Mode RBAC Scope Tester (Disabled in Production)"
            >
              {demoRoles.map((dr) => (
                <option key={dr.role} value={dr.role}>
                  [Dev Scope] {dr.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1.5 sm:px-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold text-xs">
              {user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'CA'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {user?.name || 'Neel Gabani'}
              </span>
              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-medium">
                {user?.roleTitle || 'Managing Partner'}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-modal z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 mb-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                  MFA Verified • Active
                </span>
              </div>

              <Link
                href="/settings"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60"
              >
                <Sliders className="h-3.5 w-3.5 text-slate-400" />
                Practice Settings
              </Link>
              <Link
                href="/settings?tab=audit-logs"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60"
              >
                <Shield className="h-3.5 w-3.5 text-slate-400" />
                Security & Audit Trail
              </Link>
              <Link
                href="/developer"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60"
              >
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                System & Developer Health
              </Link>

              <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                <LogOut className="h-3.5 w-3.5 text-red-500" />
                Sign Out Session
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
