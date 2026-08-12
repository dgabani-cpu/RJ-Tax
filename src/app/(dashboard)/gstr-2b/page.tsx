'use client';

import React, { useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  FileText,
  Check,
} from 'lucide-react';
import { INITIAL_GST_VAULTS } from '@/lib/db/mockDb';
import { Client, GSTR2BRecord } from '@/types';
import { clientService } from '@/services/clientService';
import { reconciliationService } from '@/services/reconciliationService';

function GSTR2BContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logAuditAction } = useAuth();
  const [clients, setClients] = useState<Client[]>(() => clientService.getClients());
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    const fromQuery = searchParams.get('clientId');
    if (fromQuery) return fromQuery;
    const all = clientService.getClients();
    return all[0]?.id || '';
  });

  React.useEffect(() => {
    const allClients = clientService.getClients();
    setClients(allClients);
    if (!selectedClientId && allClients.length > 0) {
      setSelectedClientId(allClients[0].id);
    }
    const handleUpdate = () => {
      const updated = clientService.getClients();
      setClients(updated);
      if (!selectedClientId && updated.length > 0) {
        setSelectedClientId(updated[0].id);
      }
    };
    window.addEventListener('taxnexus:clients-updated' as any, handleUpdate);
    return () => window.removeEventListener('taxnexus:clients-updated' as any, handleUpdate);
  }, [selectedClientId]);

  const [selectedPeriod, setSelectedPeriod] = useState('July 2026');
  const [selectedFY, setSelectedFY] = useState('2026-27');

  const [pipelineState, setPipelineState] = useState<'IDLE' | 'STEP_1' | 'STEP_2' | 'STEP_3' | 'COMPLETED' | 'ERROR'>('COMPLETED');
  const [downloadedCount, setDownloadedCount] = useState(0);

  // GSTR-2B Excel Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewRecords, setPreviewRecords] = useState<GSTR2BRecord[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parseSummary, setParseSummary] = useState<{ totalTaxable: number; totalTax: number; totalAmount: number } | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const client = clients.find((c) => c.id === selectedClientId) || clients[0] || {
    id: 'client-default',
    legalName: 'Practice Client',
    gstin: '24AAAAA0000A1Z5',
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

  // Real File Upload Handler
  const handleFileSelect = async (file: File) => {
    if (!file) return;
    setUploadedFile(file);
    setIsParsing(true);
    setParseErrors([]);
    setImportSuccessMessage(null);

    try {
      const result = await reconciliationService.parseGSTR2BFile(
        file,
        selectedClientId || client.id,
        selectedPeriod,
        selectedFY
      );

      if (result.success && result.records.length > 0) {
        setPreviewRecords(result.records);
        setParseSummary(result.summary);
      } else {
        setPreviewRecords([]);
        setParseErrors(result.errors.length > 0 ? result.errors : ['Could not extract valid invoices from file.']);
      }
    } catch (err: any) {
      setParseErrors([`Failed to process file: ${err.message}`]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleLoadDemoGSTR2B = () => {
    const demoRecords: GSTR2BRecord[] = [
      {
        id: `gstr2b-demo-1`,
        clientId: client.id,
        financialYear: selectedFY,
        taxPeriod: selectedPeriod,
        supplierName: 'Tata Steel Processing Ltd',
        supplierGstin: '24AAACT1234F1ZP',
        invoiceNumber: 'TSP/2026/0891',
        invoiceType: 'B2B',
        invoiceDate: '15-Jul-2026',
        taxableValue: 450000,
        igst: 0,
        cgst: 40500,
        sgst: 40500,
        cess: 0,
        totalAmount: 531000,
        itcAvailability: 'Y',
        filingDate: '10-Aug-2026',
      },
      {
        id: `gstr2b-demo-2`,
        clientId: client.id,
        financialYear: selectedFY,
        taxPeriod: selectedPeriod,
        supplierName: 'UltraTech Cement Distributors',
        supplierGstin: '24AAACU9988D1ZQ',
        invoiceNumber: 'UTC-JUL-402',
        invoiceType: 'B2B',
        invoiceDate: '18-Jul-2026',
        taxableValue: 280000,
        igst: 0,
        cgst: 25200,
        sgst: 25200,
        cess: 0,
        totalAmount: 330400,
        itcAvailability: 'Y',
        filingDate: '11-Aug-2026',
      },
      {
        id: `gstr2b-demo-3`,
        clientId: client.id,
        financialYear: selectedFY,
        taxPeriod: selectedPeriod,
        supplierName: 'Sun Pharma Distribution Ltd',
        supplierGstin: '27AABCS5544K1ZR',
        invoiceNumber: 'SUN/2026/774',
        invoiceType: 'B2B',
        invoiceDate: '21-Jul-2026',
        taxableValue: 125000,
        igst: 22500,
        cgst: 0,
        sgst: 0,
        cess: 0,
        totalAmount: 147500,
        itcAvailability: 'Y',
        filingDate: '09-Aug-2026',
      },
    ];

    setPreviewRecords(demoRecords);
    setParseSummary({
      totalTaxable: 855000,
      totalTax: 153900,
      totalAmount: 1008900,
    });
    setParseErrors([]);
  };

  const handleConfirm2BImport = () => {
    if (previewRecords.length === 0) return;

    // Save to persistent GSTR-2B store
    reconciliationService.saveGSTR2BRecords(previewRecords);

    // Auto trigger reconciliation matching with existing purchase records
    const purchaseRecords = reconciliationService.getPurchaseRecords(client.id, selectedPeriod);
    if (purchaseRecords.length > 0) {
      const reconItems = reconciliationService.matchInvoices(
        previewRecords,
        purchaseRecords,
        client.id,
        selectedPeriod,
        selectedFY
      );
      reconciliationService.saveReconciliationData(reconItems);
    }

    setDownloadedCount((prev) => prev + previewRecords.length);
    logAuditAction(
      'GSTR-2B Excel File Imported',
      'GST_PIPELINE',
      client.legalName,
      `Imported ${previewRecords.length} inward B2B invoices from ${uploadedFile?.name || 'GSTR-2B Spreadsheet'}.`
    );

    setImportSuccessMessage(`Successfully imported ${previewRecords.length} invoices for ${client.legalName}!`);
  };

  const handleCloseModal = () => {
    setIsImportModalOpen(false);
    setPreviewRecords([]);
    setUploadedFile(null);
    setParseErrors([]);
    setParseSummary(null);
    setImportSuccessMessage(null);
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold hover:bg-purple-100 transition-all shadow-sm"
          >
            <UploadCloud className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span>Upload GSTR-2B Excel</span>
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
              {clients.map((c) => (
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
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-modal space-y-4"
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
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drag & Drop Real Upload Box */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-2xl p-6 text-center space-y-3 transition-colors cursor-pointer ${
                isDragging
                  ? 'border-purple-500 bg-purple-100/50 dark:bg-purple-900/30'
                  : 'border-purple-300 dark:border-purple-800 bg-purple-50/20 dark:bg-purple-950/20 hover:border-purple-400'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              <UploadCloud className="h-10 w-10 text-purple-600 mx-auto animate-bounce" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {uploadedFile ? uploadedFile.name : 'Click to Upload or Drag & Drop GSTR-2B Spreadsheet'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Supports Official GST Portal .xlsx, .csv, and .json files (up to 50MB)
                </p>
                {uploadedFile && (
                  <p className="text-[10px] text-purple-600 font-bold mt-1">
                    File Size: {(uploadedFile.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 shadow-sm flex items-center gap-1.5"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Browse Excel / JSON File</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadDemoGSTR2B}
                  className="px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-50 dark:hover:bg-purple-900/30"
                >
                  Load Sample GSTR-2B Demo
                </button>

                <button
                  type="button"
                  onClick={() => reconciliationService.downloadSampleGSTR2BTemplate()}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Template (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Parsing State */}
            {isParsing && (
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-800 dark:text-purple-200 text-xs flex items-center justify-center gap-2 border border-purple-200">
                <RefreshCw className="h-4 w-4 animate-spin text-purple-600" />
                <span>Parsing official GSTR-2B worksheets and verifying invoice tax breakdown...</span>
              </div>
            )}

            {/* Parse Errors */}
            {parseErrors.length > 0 && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span>File Parsing Errors:</span>
                </div>
                {parseErrors.map((err, i) => (
                  <p key={i} className="text-[11px] pl-5">• {err}</p>
                ))}
              </div>
            )}

            {/* Success message */}
            {importSuccessMessage && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="font-bold">{importSuccessMessage}</span>
                </div>
                <Link
                  href={`/reconciliation?clientId=${client.id}`}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shrink-0"
                >
                  <span>Go to Reconciliation</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {/* Summary Metrics */}
            {parseSummary && previewRecords.length > 0 && (
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Invoices Found</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{previewRecords.length} B2B Records</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Total Taxable</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">₹{parseSummary.totalTaxable.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Total Eligible ITC</span>
                  <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">₹{parseSummary.totalTax.toLocaleString('en-IN')}</p>
                </div>
              </div>
            )}

            {/* Parsed Preview Table */}
            {previewRecords.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Parsed GSTR-2B Invoices ({previewRecords.length} Inward Records)
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                    ✓ Ready for Reconciliation
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto max-h-56">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="p-2.5">Supplier Name</th>
                        <th className="p-2.5">Supplier GSTIN</th>
                        <th className="p-2.5">Inv No</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5 text-right">Taxable (₹)</th>
                        <th className="p-2.5 text-right">Tax (₹)</th>
                        <th className="p-2.5">ITC Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {previewRecords.map((inv, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 font-bold text-slate-900 dark:text-white max-w-[150px] truncate">{inv.supplierName}</td>
                          <td className="p-2.5 font-mono text-[11px]">{inv.supplierGstin}</td>
                          <td className="p-2.5 font-mono">{inv.invoiceNumber}</td>
                          <td className="p-2.5 text-slate-500">{inv.invoiceDate}</td>
                          <td className="p-2.5 font-mono font-semibold text-right">₹{inv.taxableValue.toLocaleString('en-IN')}</td>
                          <td className="p-2.5 font-mono text-emerald-600 dark:text-emerald-400 text-right">₹{(inv.igst + inv.cgst + inv.sgst).toLocaleString('en-IN')}</td>
                          <td className="p-2.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              ITC: {inv.itcAvailability}
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
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={previewRecords.length === 0 || !!importSuccessMessage}
                onClick={handleConfirm2BImport}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>Import {previewRecords.length} Invoices to GSTR-2B</span>
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
