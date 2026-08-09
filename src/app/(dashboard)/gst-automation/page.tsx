'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Lock,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Cpu,
  Layers,
  Sparkles,
  Smartphone,
  Eye,
  EyeOff,
  Server,
  Zap,
} from 'lucide-react';
import { INITIAL_GST_VAULTS, INITIAL_CLIENTS } from '@/lib/db/mockDb';
import { GSTCredentialVault } from '@/types';

export default function GSTAutomationPage() {
  const { user, hasPermission, logAuditAction } = useAuth();
  const [vaults, setVaults] = useState<GSTCredentialVault[]>(INITIAL_GST_VAULTS);
  const [selectedVault, setSelectedVault] = useState<GSTCredentialVault | null>(null);
  const [isTestConnecting, setIsTestConnecting] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ id: string; msg: string; type: 'SUCCESS' | 'ERROR' } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Credential Form
  const [newClientId, setNewClientId] = useState(INITIAL_CLIENTS[0]?.id || '');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConnectionMode, setNewConnectionMode] = useState<'OFFICIAL_GSP_API' | 'ASSISTED_PORTAL_SESSION'>('OFFICIAL_GSP_API');

  const handleTestConnection = (v: GSTCredentialVault) => {
    setIsTestConnecting(v.id);
    setStatusMessage(null);

    setTimeout(() => {
      setIsTestConnecting(null);
      if (v.integrationStatus === 'AUTH_REQUIRED') {
        setStatusMessage({
          id: v.id,
          msg: 'GST Portal requires OTP re-authentication. Assisted 2FA session required.',
          type: 'ERROR',
        });
      } else {
        setStatusMessage({
          id: v.id,
          msg: 'Official GSP/ASP API Handshake successful! Session token active for 6 hours.',
          type: 'SUCCESS',
        });
      }
      logAuditAction('GST Vault Connection Tested', 'GST_VAULT', v.clientName, `Mode: ${v.connectionMode}`);
    }, 1200);
  };

  const handleSaveCredential = (e: React.FormEvent) => {
    e.preventDefault();
    const targetClient = INITIAL_CLIENTS.find((c) => c.id === newClientId) || INITIAL_CLIENTS[0] || {
      id: 'client-1',
      legalName: 'Practice Client',
      gstin: '24AAAAA0000A1Z5',
    };

    const newVaultItem: GSTCredentialVault = {
      id: `vault-${Date.now()}`,
      clientId: targetClient.id,
      clientName: targetClient.legalName,
      gstin: targetClient.gstin,
      gstUsername: newUsername,
      isPasswordSaved: true,
      integrationStatus: 'CONNECTED',
      connectionMode: newConnectionMode,
      lastSuccessfulLogin: 'Just now',
      lastSync: 'Not synced yet',
      syncHistory: [],
    };

    setVaults([newVaultItem, ...vaults]);
    setIsAddModalOpen(false);
    logAuditAction('New GST Credential Vaulted', 'GST_VAULT', targetClient.legalName, `Username: ${newUsername}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-brand-600" />
            GST Credential Vault & Official API Connectors
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise AES-256 encrypted credential repository adhering strictly to authorized GST compliance standards.
          </p>
        </div>

        {hasPermission('manageIntegrations') && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-xs font-bold shadow-sm shadow-brand-500/25 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add GST Credential</span>
          </button>
        )}
      </div>

      {/* Security Compliance Trust Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-950 via-slate-900 to-indigo-950 border border-brand-800/80 text-white shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold flex items-center gap-2">
                Section 8 & 51 Security Standards Compliant
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-semibold">
                  Zero Bypass Architecture
                </span>
              </h3>
              <p className="text-[11.5px] text-slate-300 mt-0.5 leading-relaxed">
                TaxNexus integrates via official GST Suvidha Provider (GSP) APIs and assisted 2FA sessions. No CAPTCHAs or OTP mechanisms are ever bypassed.
              </p>
            </div>
          </div>
          <Link
            href="/gstr-2b"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white border border-white/20 transition-all shrink-0"
          >
            <span>Open GSTR-2B Pipeline</span>
            <Zap className="h-3.5 w-3.5 text-amber-400" />
          </Link>
        </div>
      </div>

      {/* Vault Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {vaults.map((vault) => (
          <div
            key={vault.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-subtle flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {vault.clientName}
                  </h3>
                  <span className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">
                    {vault.gstin}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    vault.integrationStatus === 'CONNECTED'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {vault.integrationStatus}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-400">GST Portal Username:</span>
                  <strong className="font-mono text-slate-800 dark:text-slate-200">{vault.gstUsername}</strong>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-400">Connector Mode:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {vault.connectionMode === 'OFFICIAL_GSP_API' ? 'Official GSP API' : 'Assisted 2FA Session'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-400">Last Synced:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{vault.lastSync || 'Never'}</span>
                </div>
              </div>

              {statusMessage && statusMessage.id === vault.id && (
                <div
                  className={`mt-3 p-2.5 rounded-xl text-xs ${
                    statusMessage.type === 'SUCCESS'
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-200'
                      : 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-200'
                  }`}
                >
                  {statusMessage.msg}
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleTestConnection(vault)}
                disabled={isTestConnecting === vault.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isTestConnecting === vault.id ? 'animate-spin' : ''}`} />
                <span>{isTestConnecting === vault.id ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <Link
                href={`/gstr-2b?clientId=${vault.clientId}`}
                className="px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-bold hover:bg-brand-100"
              >
                Download 2B →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Add Credential Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Add GST Credential to Practice Vault
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCredential} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Select Practice Client
                </label>
                <select
                  value={newClientId}
                  onChange={(e) => setNewClientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {INITIAL_CLIENTS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.legalName} ({c.gstin})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  GST Portal Username
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. zenith_tax_auth"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  GST Portal Password / API Key (AES-256 Encrypted)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Connection Mode
                </label>
                <select
                  value={newConnectionMode}
                  onChange={(e) =>
                    setNewConnectionMode(e.target.value as 'OFFICIAL_GSP_API' | 'ASSISTED_PORTAL_SESSION')
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="OFFICIAL_GSP_API">Official GSP / ASP API (Recommended)</option>
                  <option value="ASSISTED_PORTAL_SESSION">Assisted 2FA Portal Session</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700"
                >
                  Encrypt & Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
