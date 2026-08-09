'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Calendar,
  Building,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Play,
  RotateCcw,
  UploadCloud,
  X,
} from 'lucide-react';
import { INITIAL_CLIENTS, INITIAL_GST_VAULTS } from '@/lib/db/mockDb';

function GSTR2BContent() {
  const searchParams = useSearchParams();
  const initialClientId = searchParams.get('clientId') || INITIAL_CLIENTS[0]?.id || '';

  const { user, logAuditAction } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState(initialClientId);
  const [selectedPeriod, setSelectedPeriod] = useState('July 2026');
  const [selectedFY, setSelectedFY] = useState('2026-27');

  const [pipelineState, setPipelineState] = useState<'IDLE' | 'STEP_1' | 'STEP_2' | 'STEP_3' | 'COMPLETED' | 'ERROR'>('COMPLETED');
  const [downloadedCount, setDownloadedCount] = useState(0);

  // GSTR-2B Excel Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [preview2BInvoices, setPreview2BInvoices] = useState<any[]>([]);

  const client = INITIAL_CLIENTS.find((c) => c.id === selectedClientId) || INITIAL_CLIENTS[0] || {
    id: 'client-default',
    legalName: 'Practice Client',
    gstin: '24AAAAA0000A1Z5',
  };
  const vault = INITIAL_GST_VAULTS.find((v) => v.clientId === client.id) || {
    id: 'vault-default',
    clientId: client.id,
    integrationStatus: 'CONNECTED',
    syncHistory: [],
  };

  const handleStartPipeline = () => {
    setPipelineState('STEP_1');

    setTimeout(() => {
      setPipelineState('STEP_2');
      setTimeout(() => {
        setPipelineState('STEP_3');
        setTimeout(() => {
          setPipelineState('COMPLETED');
          setDownloadedCount(42);
          logAuditAction('GSTR-2B Sync Executed', 'GST_PIPELINE', client.legalName, `Period: ${selectedPeriod}, Invoices: 42`);
        }, 800);
      }, 700);
    }, 600);
  };

  const handleSimulate2BExcelParse = () => {
    setPreview2BInvoices([
      {
        gstin: '24AAACT1234F1ZP',
        supplierName: 'Tata Steel Processing Ltd',
        invNo: 'TSP/2026/0891',
        invDate: '15-Jul-2026',
        taxable: '₹4,50,000',
        cgst: '₹40,500',
        sgst: '₹40,500',
        igst: '₹0',
        itc: 'Y',
      },
      {
        gstin: '24AAACU9988D1ZQ',
        supplierName: 'UltraTech Cement Distributors',
        invNo: 'UTC-JUL-402',
        invDate: '18-Jul-2026',
        taxable: '₹2,80,000',
        cgst: '₹25,200',
        sgst: '₹25,200',
        igst: '₹0',
        itc: 'Y',
      },
      {
        gstin: '24AABCS5544K1ZR',
        supplierName: 'Sun Pharma Distribution Ltd',
        invNo: 'SUN/2026/774',
        invDate: '21-Jul-2026',
        taxable: '₹1,25,000',
        cgst: '₹0',
        sgst: '₹0',
        igst: '₹22,500',
        itc: 'Y',
      },
    ]);
  };

  const handleConfirm2BImport = () => {
    setDownloadedCount((prev) => prev + preview2BInvoices.length);
    logAuditAction(
      'GSTR-2B Excel File Imported',
      'GST_PIPELINE',
      client.legalName,
      `Imported ${preview2BInvoices.length} inward B2B invoices from official GSTR-2B Excel.`
    );
    setPreview2BInvoices([]);
    setIsImportModalOpen(false);
    alert(`Successfully imported ${preview2BInvoices.length} GSTR-2B invoices for ${client.legalName}!`);
  };

  const automationLogs = [
    {
      id: 'log-1',
      period: 'July 2026',
      status: 'Completed',
      downloaded: '09 Aug 2026, 09:35 AM',
      invoices: 42,
      processed: 'Yes',
      itcAmount: '₹8,45,200',
    },
    {
      id: 'log-2',
      period: 'June 2026',
      status: 'Completed',
      downloaded: '12 Jul 2026, 11:20 AM',
      invoices: 38,
      processed: 'Yes',
      itcAmount: '₹7,12,800',
    },
    {
      id: 'log-3',
      period: 'May 2026',
      status: 'Completed',
      downloaded: '10 Jun 2026, 04:45 PM',
      invoices: 40,
      processed: 'Yes',
      itcAmount: '₹7,98,400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <RefreshCw className="h-6 w-6 text-brand-600" />
            GSTR-2B Automated Inward Pipeline & Excel Import
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official GSP/API automated pipeline and direct GSTR-2B Excel (.xlsx / .csv / .json) spreadsheet import.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Import GSTR-2B Excel Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold hover:bg-purple-100 transition-all"
          >
            <UploadCloud className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span>Import GSTR-2B Excel</span>
          </button>

          <Link
            href={`/reconciliation?clientId=${client.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm"
          >
            <span>Launch AI Reconciliation</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Pipeline Trigger Console */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-subtle space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 flex items-center gap-2">
          <Zap className="h-4 w-4" /> Download GSTR-2B Execution Console
        </h3>

        {/* Input selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Client
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
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
              Financial Year
            </label>
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
            >
              <option value="2026-27">2026-27</option>
              <option value="2025-26">2025-26</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tax Period (Return Month)
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
            >
              <option value="July 2026">July 2026 (Due: 14th Aug)</option>
              <option value="June 2026">June 2026</option>
              <option value="May 2026">May 2026</option>
            </select>
          </div>
        </div>

        {/* Pipeline Visual Progression Stepper */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-850/40 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 dark:text-white">Execution Progression</span>
            <span className="font-mono text-[11px] text-slate-500">Pipeline Status: {pipelineState}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div
              className={`p-3 rounded-xl border ${
                pipelineState !== 'IDLE'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200'
                  : 'border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-brand-600" />
                <span>1. Vault Auth</span>
              </div>
              <p className="text-[10.5px] text-slate-500 mt-1">Check GSP token & active 2FA</p>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                pipelineState === 'STEP_2' || pipelineState === 'STEP_3' || pipelineState === 'COMPLETED'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200'
                  : 'border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <RefreshCw className={`h-4 w-4 ${pipelineState === 'STEP_2' ? 'animate-spin text-brand-600' : ''}`} />
                <span>2. GSP Handshake</span>
              </div>
              <p className="text-[10.5px] text-slate-500 mt-1">Section 8 secure API call</p>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                pipelineState === 'STEP_3' || pipelineState === 'COMPLETED'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200'
                  : 'border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <Download className="h-4 w-4 text-brand-600" />
                <span>3. Secure Fetch</span>
              </div>
              <p className="text-[10.5px] text-slate-500 mt-1">Download B2B JSON payload</p>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                pipelineState === 'COMPLETED'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                  : 'border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>4. Invoices Parsed</span>
              </div>
              <p className="text-[10.5px] text-slate-500 mt-1">{downloadedCount} records ready for recon</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleStartPipeline}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm shadow-brand-500/25"
            >
              <Play className="h-4 w-4" />
              <span>Execute Automated 2B Fetch</span>
            </button>

            <span className="text-[11px] text-slate-400">
              Last Synced: 09 August 2026, 09:35 AM • Verified with GSP
            </span>
          </div>
        </div>
      </div>

      {/* Download History & Automation Snapshots */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-brand-600" />
          GSTR-2B Download Snapshots & Historic Batches
        </h3>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10.5px]">
              <tr>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Download Timestamp</th>
                <th className="py-3 px-4">Invoices Fetched</th>
                <th className="py-3 px-4">Total Eligible ITC</th>
                <th className="py-3 px-4">Pipeline Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {automationLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{log.period}</td>
                  <td className="py-3 px-4 text-slate-500">{log.downloaded}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">{log.invoices} B2B Invoices</td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{log.itcAmount}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/reconciliation?clientId=${client.id}`}
                      className="text-xs font-bold text-brand-600 hover:underline"
                    >
                      Reconcile →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* GSTR-2B Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-modal space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-purple-600" />
                  Import Official GSTR-2B Portal Excel / CSV File
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload GSTR-2B downloaded from the GST Portal for {client.legalName} ({selectedPeriod}).
                </p>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setPreview2BInvoices([]);
                }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drag & Drop Upload Box */}
            <div className="border-2 border-dashed border-purple-300 dark:border-purple-800 rounded-2xl p-6 text-center space-y-3 bg-purple-50/20 dark:bg-purple-950/20">
              <UploadCloud className="h-10 w-10 text-purple-600 mx-auto" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Upload GSTR-2B Spreadsheet</h4>
                <p className="text-[11px] text-slate-500">Supports .xlsx, .csv, and official GST portal .json files (up to 50MB)</p>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleSimulate2BExcelParse}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 shadow-sm"
                >
                  Parse Sample GSTR-2B Excel File
                </button>
              </div>
            </div>

            {/* Parsed Preview Table */}
            {preview2BInvoices.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Parsed GSTR-2B Invoices ({preview2BInvoices.length} Inward Records)
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                    ✓ Ready for Reconciliation
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Supplier Name</th>
                        <th className="p-2.5">Supplier GSTIN</th>
                        <th className="p-2.5">Inv No</th>
                        <th className="p-2.5">Taxable</th>
                        <th className="p-2.5">ITC Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {preview2BInvoices.map((inv, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-bold text-slate-900 dark:text-white">{inv.supplierName}</td>
                          <td className="p-2.5 font-mono text-[11px]">{inv.gstin}</td>
                          <td className="p-2.5">{inv.invNo}</td>
                          <td className="p-2.5 font-mono">{inv.taxable}</td>
                          <td className="p-2.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              ITC: {inv.itc}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setPreview2BInvoices([]);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={preview2BInvoices.length === 0}
                onClick={handleConfirm2BImport}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm disabled:opacity-50"
              >
                Import {preview2BInvoices.length} Invoices to GSTR-2B
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GSTR2BPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading GSTR-2B Pipeline...</div>}>
      <GSTR2BContent />
    </Suspense>
  );
}
