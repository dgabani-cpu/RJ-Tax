'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTheme, AccentColor, ThemeMode } from '@/lib/theme/ThemeContext';
import {
  Settings,
  Building,
  Palette,
  Shield,
  KeyRound,
  Sparkles,
  Database,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  LogOut,
  Save,
  Lock,
} from 'lucide-react';

type SettingsTab =
  | 'organization'
  | 'appearance'
  | 'roles'
  | 'security'
  | 'integrations'
  | 'ai'
  | 'backup'
  | 'audit-logs';

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as SettingsTab) || 'organization';

  const { user, auditLogs, logoutAllDevices, logAuditAction } = useAuth();
  const { theme, setTheme, accent, setAccent, resolvedTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Organization settings form state
  const [orgName, setOrgName] = useState('TaxNexus & Associates Chartered Accountants');
  const [orgTradeName, setOrgTradeName] = useState('TaxNexus Practice Management');
  const [orgPAN, setOrgPAN] = useState('AABFR1234E');
  const [orgEmail, setOrgEmail] = useState('contact@taxnexus.io');
  const [orgPhone, setOrgPhone] = useState('+91 79 4001 5555');

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'organization', label: 'Practice Organization', icon: Building },
    { id: 'appearance', label: 'Appearance & Themes', icon: Palette },
    { id: 'roles', label: 'Roles & Permissions (RBAC)', icon: Shield },
    { id: 'security', label: 'Security & Sessions', icon: Lock },
    { id: 'integrations', label: 'API Connectors & Vault', icon: KeyRound },
    { id: 'ai', label: 'AI & OCR Settings', icon: Sparkles },
    { id: 'backup', label: 'Backup & Recovery', icon: Database },
    { id: 'audit-logs', label: 'Audit Trail Logs', icon: Clock },
  ];

  const accentColors: { name: AccentColor; label: string; bgClass: string }[] = [
    { name: 'indigo', label: 'Royal Indigo (Default)', bgClass: 'bg-indigo-600' },
    { name: 'blue', label: 'Classic Blue', bgClass: 'bg-blue-600' },
    { name: 'green', label: 'Emerald Green', bgClass: 'bg-emerald-600' },
    { name: 'purple', label: 'Imperial Purple', bgClass: 'bg-purple-600' },
    { name: 'teal', label: 'Ocean Teal', bgClass: 'bg-teal-600' },
    { name: 'orange', label: 'Warm Orange', bgClass: 'bg-orange-600' },
  ];

  const handleSaveSettings = () => {
    setSaveSuccess(true);
    logAuditAction('Practice Settings Updated', 'SETTINGS', undefined, `Updated tab: ${activeTab}`);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-brand-600" />
            Practice Settings & Enterprise Configuration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure multi-tenant organization profile, appearance themes, security policies, and audit logs.
          </p>
        </div>

        {saveSuccess && (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-4 w-4" /> Preferences Saved!
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side Navigation */}
        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Tab Content Panel */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle">
          {/* TAB: ORGANIZATION PROFILE */}
          {activeTab === 'organization' && (
            <div className="space-y-4 text-xs">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Organization & CA Firm Identity</h3>
                <p className="text-slate-400 text-[11px]">Primary practice details reflected on invoices and summary reports</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Firm Legal Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Brand / Platform Title</label>
                  <input
                    type="text"
                    value={orgTradeName}
                    onChange={(e) => setOrgTradeName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Firm PAN</label>
                  <input
                    type="text"
                    value={orgPAN}
                    onChange={(e) => setOrgPAN(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Official Practice Email</label>
                  <input
                    type="email"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-sm"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Organization Profile</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: APPEARANCE & THEMES */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 text-xs">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Theme & Appearance Engine</h3>
                <p className="text-slate-400 text-[11px]">Customize UI mode and system-wide accent palette</p>
              </div>

              {/* Light / Dark Mode Toggle */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">Theme Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setTheme(mode)}
                      className={`p-3.5 rounded-xl border text-center font-bold capitalize transition-all ${
                        theme === mode
                          ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {mode === 'light' && <Sun className="h-4 w-4 mx-auto mb-1 text-amber-500" />}
                      {mode === 'dark' && <Moon className="h-4 w-4 mx-auto mb-1 text-brand-400" />}
                      {mode === 'system' && <Settings className="h-4 w-4 mx-auto mb-1 text-slate-400" />}
                      <span>{mode} Mode</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color Palette */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">
                  System Accent Color (Active: <strong className="capitalize">{accent}</strong>)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {accentColors.map((col) => (
                    <button
                      key={col.name}
                      onClick={() => setAccent(col.name)}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                        accent === col.name
                          ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-950/50 text-brand-900 dark:text-brand-100 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`h-4 w-4 rounded-full ${col.bgClass}`} />
                      <span>{col.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: SECURITY & SESSIONS */}
          {activeTab === 'security' && (
            <div className="space-y-4 text-xs">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Practice Security Policies</h3>
                <p className="text-slate-400 text-[11px]">Manage MFA, session timeouts, and device authorizations</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Enforce 2-Factor OTP for All Staff</h4>
                  <p className="text-slate-400 text-[11px]">Require OTP verification on every login attempt</p>
                </div>
                <span className="font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 rounded-full">
                  Enforced
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Active Practice Sessions</h4>
                  <p className="text-slate-400 text-[11px]">Current session: Chrome on Windows 11 (IP: 103.24.120.45)</p>
                </div>
                <button
                  onClick={logoutAllDevices}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout from All Devices</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: AUDIT LOGS */}
          {activeTab === 'audit-logs' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tamper-Resistant Audit Trail</h3>
                  <p className="text-slate-400 text-[11px]">Immutable record of all login events, GST syncs, and client actions</p>
                </div>
                <span className="text-slate-400 font-mono">{auditLogs.length} Events</span>
              </div>

              <div className="max-h-[500px] overflow-y-auto space-y-2">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/40 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">{log.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">{log.details}</p>
                    <div className="text-[10px] text-slate-400 flex items-center gap-3 pt-1">
                      <span>User: <strong className="text-slate-700 dark:text-slate-300">{log.userName}</strong> ({log.userRole})</span>
                      <span>IP: {log.ipAddress}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: BACKUP & RECOVERY */}
          {activeTab === 'backup' && (
            <div className="space-y-4 text-xs">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Automated Database Backups</h3>
                <p className="text-slate-400 text-[11px]">Continuous point-in-time recovery and snapshot archives</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Last Automated Snapshot</span>
                  <span className="text-emerald-600 font-bold">09 Aug 2026, 04:00 AM (Completed)</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Backup Cadence: Hourly WAL + Daily Full Snapshot</span>
                  <span>Storage: Encrypted S3 Archive (AES-256)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Practice Settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

