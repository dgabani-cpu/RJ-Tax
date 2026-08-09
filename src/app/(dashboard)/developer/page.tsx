'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  Code2,
  Activity,
  Layers,
  ShieldCheck,
  Server,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Terminal,
  Cpu,
  Zap,
} from 'lucide-react';
import {
  INITIAL_DEVELOPER_RELEASES,
  INITIAL_SYSTEM_HEALTH,
  INITIAL_AUDIT_LOGS,
} from '@/lib/db/mockDb';
import { DeveloperRelease } from '@/types';

export default function DeveloperPage() {
  const { user, logAuditAction } = useAuth();
  const [releases, setReleases] = useState<DeveloperRelease[]>(INITIAL_DEVELOPER_RELEASES);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);

  // New release note state
  const [newVersion, setNewVersion] = useState('v2.5.0');
  const [newFeatureText, setNewFeatureText] = useState('');

  const handleToggleMaintenance = () => {
    const nextState = !maintenanceMode;
    setMaintenanceMode(nextState);
    logAuditAction(
      `Maintenance Mode ${nextState ? 'Activated' : 'Deactivated'}`,
      'SYSTEM',
      undefined,
      `Super Admin triggered maintenance state change.`
    );
  };

  const handleAddRelease = (e: React.FormEvent) => {
    e.preventDefault();
    const created: DeveloperRelease = {
      version: newVersion,
      releaseDate: 'August 2026',
      status: 'STABLE',
      features: [newFeatureText || 'Automated GSTR-3B liability challan calculation'],
      improvements: ['Enhanced query latency for 100k+ reconciliation records'],
      bugFixes: ['Fixed POS head matching edge case'],
    };

    setReleases([created, ...releases]);
    setIsReleaseModalOpen(false);
    logAuditAction('New Release Note Published', 'DEVELOPER', undefined, `Version: ${newVersion}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Code2 className="h-6 w-6 text-brand-600" />
            Internal Developer & System Operations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            System release logs, worker queue monitors, latency health checks, and maintenance control.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleMaintenance}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              maintenanceMode
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Maintenance Mode: {maintenanceMode ? 'ACTIVE' : 'OFF'}
          </button>

          <button
            onClick={() => setIsReleaseModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Publish Release Note</span>
          </button>
        </div>
      </div>

      {/* System Health Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {INITIAL_SYSTEM_HEALTH.map((metric, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle text-xs"
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> {metric.status}
              </span>
              <span className="font-mono">{metric.latencyMs}ms</span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mt-2 leading-tight text-xs truncate">
              {metric.service}
            </h3>
            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
              <span>Uptime: {metric.uptime}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Release Notes History */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          TaxNexus Production Releases & Changelog
        </h3>

        <div className="space-y-4">
          {releases.map((rel, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-subtle space-y-3 text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-slate-900 dark:text-white">{rel.version}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {rel.status}
                  </span>
                </div>
                <span className="text-slate-400 font-medium">Released {rel.releaseDate}</span>
              </div>

              <div>
                <h4 className="font-bold text-brand-600 dark:text-brand-400 text-xs mb-1.5">New Features:</h4>
                <ul className="space-y-1 text-slate-700 dark:text-slate-300 list-disc list-inside">
                  {rel.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-600 dark:text-slate-400 text-xs mb-1.5">Performance & Polish:</h4>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400 list-disc list-inside">
                  {rel.improvements.map((imp, i) => (
                    <li key={i}>{imp}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Publish Release Modal */}
      {isReleaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Publish Release Notes</h3>
              <button onClick={() => setIsReleaseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRelease} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Version String</label>
                <input
                  type="text"
                  required
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  placeholder="e.g. v2.5.0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Key Feature Details</label>
                <textarea
                  rows={3}
                  required
                  value={newFeatureText}
                  onChange={(e) => setNewFeatureText(e.target.value)}
                  placeholder="Describe the new feature or optimization..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReleaseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700"
                >
                  Publish Changelog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
