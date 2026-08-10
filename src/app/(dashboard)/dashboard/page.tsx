'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  Users,
  CheckSquare,
  RefreshCw,
  GitCompare,
  AlertTriangle,
  MessageSquare,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  ShieldAlert,
  Clock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Filter,
  Download,
  Building,
  AlertCircle,
  Cpu,
  FileText,
  Plus,
  UploadCloud,
} from 'lucide-react';
import {
  INITIAL_TASKS,
  INITIAL_RECON_DATA,
  INITIAL_USERS,
  INITIAL_SCHEDULED_MESSAGES,
} from '@/lib/db/mockDb';
import { clientService } from '@/services/clientService';
import { Client } from '@/types';

export default function DashboardPage() {
  const { user, auditLogs, logAuditAction } = useAuth();

  const [selectedFY, setSelectedFY] = useState('2026-27');
  const [selectedMonth, setSelectedMonth] = useState('July 2026');
  const [clients, setClients] = useState<Client[]>(() => clientService.getClients());

  React.useEffect(() => {
    setClients(clientService.getClients());
    const handleUpdate = () => setClients(clientService.getClients());
    window.addEventListener('taxnexus:clients-updated' as any, handleUpdate);
    return () => window.removeEventListener('taxnexus:clients-updated' as any, handleUpdate);
  }, []);

  // Aggregated Practice Metrics
  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === 'ACTIVE').length;
  const pendingTasks = INITIAL_TASKS.filter((t) => t.status !== 'COMPLETED').length;
  const missingIn2BCount = INITIAL_RECON_DATA.filter((r) => r.matchCategory === 'MISSING_IN_GSTR2B').length;
  const missingIn2BValue = 0;
  const matchedCount = INITIAL_RECON_DATA.filter((r) => r.matchCategory === 'MATCHED' || r.matchCategory === 'PARTIALLY_MATCHED').length;
  const mismatchCount = INITIAL_RECON_DATA.filter(
    (r) =>
      r.matchCategory === 'VALUE_MISMATCH' ||
      r.matchCategory === 'TAX_MISMATCH' ||
      r.matchCategory === 'INVOICE_NUM_MISMATCH' ||
      r.matchCategory === 'DUPLICATE_INVOICE'
  ).length;

  const dueDates = [
    { name: 'GSTR-1 (Monthly Filers)', date: '11th August 2026', daysLeft: '2 Days Left', status: 'URGENT', tag: 'Outward Supplies' },
    { name: 'IFF (Invoice Furnishing QRMP)', date: '13th August 2026', daysLeft: '4 Days Left', status: 'HIGH', tag: 'QRMP B2B' },
    { name: 'GSTR-2B ITC Cutoff & Recon', date: '14th August 2026', daysLeft: '5 Days Left', status: 'HIGH', tag: 'Auto 2B Match' },
    { name: 'GSTR-3B (Monthly Regular)', date: '20th August 2026', daysLeft: '11 Days Left', status: 'NORMAL', tag: 'Tax Payment' },
    { name: 'PMT-06 Challan (QRMP M1)', date: '25th August 2026', daysLeft: '16 Days Left', status: 'NORMAL', tag: 'Challan Deposit' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: CA Practice Greeting & Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Practice Command Center
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Live Production Workspace
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Logged in as <strong className="text-slate-800 dark:text-slate-200">{user?.name}</strong> ({user?.roleTitle}) • TaxNexus Practice Cloud
          </p>
        </div>

        {/* Global FY and Tax Period Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="text-[10px] text-slate-400 uppercase">FY:</span>
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer text-xs font-bold"
            >
              <option value="2026-27">2026-27</option>
              <option value="2025-26">2025-26</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="text-[10px] text-slate-400 uppercase">Period:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer text-xs font-bold"
            >
              <option value="July 2026">July 2026</option>
              <option value="June 2026">June 2026</option>
              <option value="May 2026">May 2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clients Card */}
        <Link
          href="/clients"
          className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-subtle hover:border-brand-500 dark:hover:border-brand-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Practice Clients</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{totalClients}</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
              <TrendingUp className="h-3 w-3 mr-0.5" /> Ready
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Click to manage & onboard</p>
        </Link>

        {/* Pending Practice Tasks */}
        <Link
          href="/tasks"
          className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-subtle hover:border-brand-500 dark:hover:border-brand-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Tasks / SLAs</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{pendingTasks}</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center">
              Active SLA
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Track filing deadlines</p>
        </Link>

        {/* AI Reconciliation Health */}
        <Link
          href="/reconciliation"
          className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-subtle hover:border-brand-500 dark:hover:border-brand-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">GSTR-2B Match Engine</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
              <GitCompare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight">13 Rules</span>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center">
              Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Dual Excel Auto-Match</p>
        </Link>

        {/* Missing Invoices in 2B */}
        <Link
          href="/reconciliation"
          className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-subtle hover:border-brand-500 dark:hover:border-brand-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">ITC at Risk</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              ₹0.00
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Clean
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Section 16(2)(aa) compliant</p>
        </Link>
      </div>

      {/* Two Column Layout: Compliance Due Dates & AI Live Reconciliation Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live GSTR-2B AI Reconciliation Status & Discrepancies */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-subtle">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-brand-600" />
                  Automated GSTR-2B & Purchase Matching Hub
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Automated 13-Rule Match Engine across client purchase bills & 2B downloads
                </p>
              </div>
              <Link
                href="/reconciliation"
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <span>Launch Hub</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Reconciliation Discrepancy Stream / Empty State */}
            {INITIAL_RECON_DATA.length > 0 ? (
              <div className="mt-4 space-y-3">
                {INITIAL_RECON_DATA.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-brand-300 dark:hover:border-brand-700 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.purchaseInvoice?.supplierName || item.gstr2bRecord?.supplierName}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          Inv: {item.purchaseInvoice?.invoiceNumber || item.gstr2bRecord?.invoiceNumber}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {item.categoryLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                <GitCompare className="h-10 w-10 text-purple-600 mx-auto" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">No Reconciliation Records Loaded</h4>
                <p className="text-[11.5px] text-slate-500 max-w-sm mx-auto">
                  Upload GSTR-2B portal downloads and client purchase registers to run the automated 13-rule match engine.
                </p>
                <div className="pt-2">
                  <Link
                    href="/reconciliation"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm"
                  >
                    <UploadCloud className="h-4 w-4" />
                    <span>Upload Excel & Reconcile</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Statutory GST Calendar Due Dates */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-600" />
                Statutory Compliance Timeline
              </h3>
              <Link href="/calendar" className="text-xs font-bold text-brand-600 hover:underline">
                View Full
              </Link>
            </div>

            <div className="space-y-2.5">
              {dueDates.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs hover:border-slate-200 transition-all"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                    <span className="text-[11px] text-slate-400">{item.date}</span>
                  </div>
                  <div className="text-right space-y-1">
                    <span
                      className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full inline-block ${
                        item.status === 'URGENT'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                          : item.status === 'HIGH'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {item.daysLeft}
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono">{item.tag}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
