'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  GitCompare,
  UploadCloud,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Search,
  FileSpreadsheet,
  Download,
  Check,
  X,
  MessageSquare,
  ArrowRight,
  ChevronDown,
  Layers,
  BarChart3,
  Building,
  RefreshCw,
  Sliders,
  DollarSign,
  FileText,
  Zap,
} from 'lucide-react';
import { MatchCategory, ReconciliationItem, Client, GSTR2BRecord, PurchaseInvoiceRecord } from '@/types';
import { clientService } from '@/services/clientService';
import { reconciliationService } from '@/services/reconciliationService';

function ReconciliationContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') as MatchCategory | null;
  const autoUpload = searchParams.get('upload') === 'true';

  const { user, logAuditAction } = useAuth();
  const [clients, setClients] = useState<Client[]>(() => clientService.getClients());
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    const fromQuery = searchParams.get('clientId');
    if (fromQuery) return fromQuery;
    const all = clientService.getClients();
    return all[0]?.id || '';
  });

  const [selectedPeriod, setSelectedPeriod] = useState('July 2026');
  const [selectedFY, setSelectedFY] = useState('2026-27');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [reconData, setReconData] = useState<ReconciliationItem[]>(() =>
    reconciliationService.getReconciliationData(selectedClientId || undefined, selectedPeriod)
  );
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(autoUpload);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [lastAutoMatchSummary, setLastAutoMatchSummary] = useState<{
    matchedCount: number;
    discrepancyCount: number;
    totalITC: number;
    timestamp: string;
  } | null>(null);

  // Dual File Upload States
  const [gstr2bFile, setGstr2bFile] = useState<File | null>(null);
  const [purchaseFile, setPurchaseFile] = useState<File | null>(null);
  const [gstr2bParsed, setGstr2bParsed] = useState<GSTR2BRecord[]>([]);
  const [purchaseParsed, setPurchaseParsed] = useState<PurchaseInvoiceRecord[]>([]);
  const [isParsing2B, setIsParsing2B] = useState(false);
  const [isParsingPurchase, setIsParsingPurchase] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const gstr2bInputRef = useRef<HTMLInputElement>(null);
  const purchaseInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const allClients = clientService.getClients();
    setClients(allClients);
    if (!selectedClientId && allClients.length > 0) {
      setSelectedClientId(allClients[0].id);
    }
    const handleClientsUpdate = () => {
      const updated = clientService.getClients();
      setClients(updated);
      if (!selectedClientId && updated.length > 0) {
        setSelectedClientId(updated[0].id);
      }
    };
    window.addEventListener('taxnexus:clients-updated' as any, handleClientsUpdate);
    return () => window.removeEventListener('taxnexus:clients-updated' as any, handleClientsUpdate);
  }, [selectedClientId]);

  // Sync Reconciliation Data on changes
  useEffect(() => {
    const items = reconciliationService.getReconciliationData(selectedClientId || undefined, selectedPeriod);
    setReconData(items);

    const handleReconUpdate = (e: any) => {
      const items = reconciliationService.getReconciliationData(selectedClientId || undefined, selectedPeriod);
      setReconData(items);
    };
    window.addEventListener('taxnexus:recon-updated' as any, handleReconUpdate);
    return () => window.removeEventListener('taxnexus:recon-updated' as any, handleReconUpdate);
  }, [selectedClientId, selectedPeriod]);

  const client = clients.find((c) => c.id === selectedClientId) || clients[0] || {
    id: 'client-default',
    legalName: 'Practice Client',
    gstin: '24AAAAA0000A1Z5',
  };

  // Handle GSTR-2B File Selection
  const handleGstr2bFileChange = async (file: File) => {
    if (!file) return;
    setGstr2bFile(file);
    setIsParsing2B(true);
    setUploadErrors([]);
    try {
      const res = await reconciliationService.parseGSTR2BFile(
        file,
        selectedClientId || client.id,
        selectedPeriod,
        selectedFY
      );
      if (res.success && res.records.length > 0) {
        setGstr2bParsed(res.records);
      } else {
        setGstr2bParsed([]);
        setUploadErrors((prev) => [...prev, ...res.errors]);
      }
    } catch (e: any) {
      setUploadErrors((prev) => [...prev, `GSTR-2B Error: ${e.message}`]);
    } finally {
      setIsParsing2B(false);
    }
  };

  // Handle Purchase Register File Selection
  const handlePurchaseFileChange = async (file: File) => {
    if (!file) return;
    setPurchaseFile(file);
    setIsParsingPurchase(true);
    setUploadErrors([]);
    try {
      const res = await reconciliationService.parsePurchaseRegisterFile(
        file,
        selectedClientId || client.id,
        selectedPeriod,
        selectedFY
      );
      if (res.success && res.records.length > 0) {
        setPurchaseParsed(res.records);
      } else {
        setPurchaseParsed([]);
        setUploadErrors((prev) => [...prev, ...res.errors]);
      }
    } catch (e: any) {
      setUploadErrors((prev) => [...prev, `Purchase Register Error: ${e.message}`]);
    } finally {
      setIsParsingPurchase(false);
    }
  };

  // Load Demo Data for immediate test
  const handleLoadDemoFiles = () => {
    const demo2B: GSTR2BRecord[] = [
      {
        id: `gstr2b-d-1`,
        clientId: selectedClientId || client.id,
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
        id: `gstr2b-d-2`,
        clientId: selectedClientId || client.id,
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
        id: `gstr2b-d-3`,
        clientId: selectedClientId || client.id,
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
      {
        id: `gstr2b-d-4`,
        clientId: selectedClientId || client.id,
        financialYear: selectedFY,
        taxPeriod: selectedPeriod,
        supplierName: 'Direct Portal Supplier Corp',
        supplierGstin: '24AABCA1122D1ZZ',
        invoiceNumber: 'DPS-909',
        invoiceType: 'B2B',
        invoiceDate: '28-Jul-2026',
        taxableValue: 75000,
        igst: 0,
        cgst: 6750,
        sgst: 6750,
        cess: 0,
        totalAmount: 88500,
        itcAvailability: 'Y',
        filingDate: '10-Aug-2026',
      },
    ];

    const demoPurchase: PurchaseInvoiceRecord[] = [
      {
        id: `pinv-d-1`,
        clientId: selectedClientId || client.id,
        financialYear: selectedFY,
        taxPeriod: selectedPeriod,
        supplierName: 'Tata Steel Processing Ltd',
        supplierGstin: '24AAACT1234F1ZP',
        invoiceNumber: 'TSP/2026/0891',
        invoiceDate: '15-Jul-2026',
        taxableValue: 450000,
        igst: 0,
        cgst: 40500,
        sgst: 40500,
        cess: 0,
        totalAmount: 531000,
        fileSource: 'Demo_Purchase.xlsx',
        uploadedAt: new Date().toISOString(),
      },
      {
        id: `pinv-d-2`,
        clientId: selectedClientId || client.id,
        financialYear: selectedFY,
        taxPeriod: selectedPeriod,
        supplierName: 'UltraTech Cement Distributors',
        supplierGstin: '24AAACU9988D1ZQ',
        invoiceNumber: 'UTC/JUL/402', // Slash variation for fuzzy test
        invoiceDate: '18-Jul-2026',
        taxableValue: 280000,
        igst: 0,
        cgst: 25200,
        sgst: 25200,
        cess: 0,
        totalAmount: 330400,
        fileSource: 'Demo_Purchase.xlsx',
        uploadedAt: new Date().toISOString(),
      },
      {
        id: `pinv-d-3`,
        clientId: selectedClientId || client.id,
        financialYear: selectedFY,
        taxPeriod: selectedPeriod,
        supplierName: 'Sun Pharma Distribution Ltd',
        supplierGstin: '27AABCS5544K1ZR',
        invoiceNumber: 'SUN/2026/774',
        invoiceDate: '21-Jul-2026',
        taxableValue: 120000, // ₹5,000 difference for value mismatch test
        igst: 21600,
        cgst: 0,
        sgst: 0,
        cess: 0,
        totalAmount: 141600,
        fileSource: 'Demo_Purchase.xlsx',
        uploadedAt: new Date().toISOString(),
      },
      {
        id: `pinv-d-4`,
        clientId: selectedClientId || client.id,
        financialYear: selectedFY,
        taxPeriod: selectedPeriod,
        supplierName: 'Unfiled Local Vendor Ltd',
        supplierGstin: '24AABCL8899P1ZZ',
        invoiceNumber: 'LOC-551',
        invoiceDate: '25-Jul-2026',
        taxableValue: 85000,
        igst: 0,
        cgst: 7650,
        sgst: 7650,
        cess: 0,
        totalAmount: 100300,
        fileSource: 'Demo_Purchase.xlsx',
        uploadedAt: new Date().toISOString(),
      },
    ];

    setGstr2bParsed(demo2B);
    setPurchaseParsed(demoPurchase);
    setUploadErrors([]);
  };

  const categoryCounts = reconciliationService.getCategoryCounts(selectedClientId || undefined, selectedPeriod);

  const categoryOptions: { key: string; label: string; count: number }[] = [
    { key: 'ALL', label: 'All Records', count: categoryCounts.ALL || 0 },
    { key: 'MATCHED', label: 'A. Matched (100%)', count: categoryCounts.MATCHED || 0 },
    { key: 'PARTIALLY_MATCHED', label: 'B. Partially Matched', count: categoryCounts.PARTIALLY_MATCHED || 0 },
    { key: 'MISSING_IN_GSTR2B', label: 'C. Missing in GSTR-2B', count: categoryCounts.MISSING_IN_GSTR2B || 0 },
    { key: 'MISSING_PURCHASE_INVOICE', label: 'D. Missing in Books', count: categoryCounts.MISSING_PURCHASE_INVOICE || 0 },
    { key: 'VALUE_MISMATCH', label: 'E. Value Mismatch', count: categoryCounts.VALUE_MISMATCH || 0 },
    { key: 'TAX_MISMATCH', label: 'F. Tax Mismatch', count: categoryCounts.TAX_MISMATCH || 0 },
    { key: 'INVOICE_NUM_MISMATCH', label: 'H. Invoice No. Mismatch', count: categoryCounts.INVOICE_NUM_MISMATCH || 0 },
    { key: 'DUPLICATE_INVOICE', label: 'J. Duplicate Invoice', count: categoryCounts.DUPLICATE_INVOICE || 0 },
    { key: 'POSSIBLE_CREDIT_NOTE', label: 'K. Possible Credit Note', count: categoryCounts.POSSIBLE_CREDIT_NOTE || 0 },
  ];

  const filteredItems = reconData.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.matchCategory === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      item.purchaseInvoice?.supplierName.toLowerCase().includes(q) ||
      item.purchaseInvoice?.supplierGstin.toLowerCase().includes(q) ||
      item.purchaseInvoice?.invoiceNumber.toLowerCase().includes(q) ||
      item.gstr2bRecord?.supplierName.toLowerCase().includes(q) ||
      item.gstr2bRecord?.invoiceNumber.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  // Calculate totals
  const totalPurchaseValue = reconData.reduce((acc, curr) => acc + (curr.purchaseInvoice?.taxableValue || 0), 0);
  const total2BValue = reconData.reduce((acc, curr) => acc + (curr.gstr2bRecord?.taxableValue || 0), 0);
  const totalPurchaseTax = reconData.reduce(
    (acc, curr) =>
      acc + (curr.purchaseInvoice ? curr.purchaseInvoice.cgst + curr.purchaseInvoice.sgst + curr.purchaseInvoice.igst : 0),
    0
  );
  const total2BTax = reconData.reduce(
    (acc, curr) =>
      acc + (curr.gstr2bRecord ? curr.gstr2bRecord.cgst + curr.gstr2bRecord.sgst + curr.gstr2bRecord.igst : 0),
    0
  );
  const matchedTax = reconData
    .filter((r) => r.matchCategory === 'MATCHED')
    .reduce(
      (acc, curr) =>
        acc + (curr.gstr2bRecord ? curr.gstr2bRecord.cgst + curr.gstr2bRecord.sgst + curr.gstr2bRecord.igst : 0),
      0
    );
  const atRiskTax = totalPurchaseTax - matchedTax > 0 ? totalPurchaseTax - matchedTax : 0;

  const handleUpdateResolution = (itemId: string, status: 'ACCEPTED' | 'REJECTED') => {
    reconciliationService.updateResolution(itemId, status);
    logAuditAction(
      `Reconciliation Item ${status}`,
      'RECONCILIATION',
      client.legalName,
      `Item ID: ${itemId} marked as ${status}`
    );
  };

  // Run Real Automated 13-Rule Match Engine
  const handleRunAutomatedMatching = (e: React.FormEvent) => {
    e.preventDefault();

    let target2B = gstr2bParsed;
    let targetPurchase = purchaseParsed;

    // If inputs not provided, check existing store
    if (target2B.length === 0) {
      target2B = reconciliationService.getGSTR2BRecords(selectedClientId || client.id, selectedPeriod);
    }
    if (targetPurchase.length === 0) {
      targetPurchase = reconciliationService.getPurchaseRecords(selectedClientId || client.id, selectedPeriod);
    }

    if (target2B.length === 0 && targetPurchase.length === 0) {
      setUploadErrors(['Please upload at least one GSTR-2B Excel or Purchase Register Excel file to match.']);
      return;
    }

    setIsAIProcessing(true);

    setTimeout(() => {
      // Save parsed files to store
      if (gstr2bParsed.length > 0) {
        reconciliationService.saveGSTR2BRecords(gstr2bParsed);
      }
      if (purchaseParsed.length > 0) {
        reconciliationService.savePurchaseRecords(purchaseParsed);
      }

      // Execute 13-Rule Matching Algorithm
      const newMatchedItems = reconciliationService.matchInvoices(
        target2B,
        targetPurchase,
        selectedClientId || client.id,
        selectedPeriod,
        selectedFY
      );

      reconciliationService.saveReconciliationData(newMatchedItems);
      setReconData(newMatchedItems);
      setIsAIProcessing(false);
      setIsUploadModalOpen(false);

      const matchedCount = newMatchedItems.filter((i) => i.matchCategory === 'MATCHED').length;
      const discrepancyCount = newMatchedItems.length - matchedCount;
      const totalITC = newMatchedItems
        .filter((i) => i.matchCategory === 'MATCHED')
        .reduce((sum, item) => sum + (item.gstr2bRecord ? item.gstr2bRecord.cgst + item.gstr2bRecord.sgst + item.gstr2bRecord.igst : 0), 0);

      setLastAutoMatchSummary({
        matchedCount,
        discrepancyCount,
        totalITC,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      logAuditAction(
        'Automated Dual Excel Reconciliation Executed',
        'RECONCILIATION',
        client.legalName,
        `Auto-Matched ${newMatchedItems.length} records (${matchedCount} 100% matched, ${discrepancyCount} discrepancies).`
      );
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <GitCompare className="h-6 w-6 text-brand-600" />
            AI Automated GSTR-2B vs Purchase Register Matching Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Upload GSTR-2B portal download & client Purchase Register to auto-match and bifurcate into statutory classes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {reconData.length > 0 && (
            <button
              onClick={() => reconciliationService.exportReconciliationToExcel(reconData, client.legalName, selectedPeriod)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-sm"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>Export Report (.xlsx)</span>
            </button>
          )}

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Excels & Auto-Match</span>
          </button>
        </div>
      </div>

      {/* Client Selection & Tax Period Filter Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Building className="h-5 w-5 text-slate-400 shrink-0" />
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.legalName} ({c.gstin})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-xs font-semibold text-slate-500">Tax Period:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="July 2026">July 2026</option>
            <option value="June 2026">June 2026</option>
            <option value="May 2026">May 2026</option>
          </select>
        </div>
      </div>

      {/* Auto-Match Live Summary Banner */}
      {lastAutoMatchSummary && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-md flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-300 flex items-center justify-center font-bold">
              <Zap className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-extrabold text-white">Automated Dual Excel Matching Completed</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {lastAutoMatchSummary.timestamp}
                </span>
              </div>
              <p className="text-[11.5px] text-purple-200 mt-0.5">
                Auto-reconciled GSTR-2B download against Purchase Register. Matched <strong>{lastAutoMatchSummary.matchedCount} invoices</strong> (₹{lastAutoMatchSummary.totalITC.toLocaleString('en-IN')} ITC) and flagged <strong>{lastAutoMatchSummary.discrepancyCount} discrepancy items</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={() => setLastAutoMatchSummary(null)}
            className="text-xs text-purple-300 hover:text-white font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Aggregated Totals Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Client Books Taxable</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">₹{totalPurchaseValue.toLocaleString('en-IN')}</div>
          <span className="text-[10.5px] text-slate-400">Tax: ₹{totalPurchaseTax.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-purple-500">Official GSTR-2B Taxable</span>
          <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">₹{total2BValue.toLocaleString('en-IN')}</div>
          <span className="text-[10.5px] text-purple-400">Tax: ₹{total2BTax.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-500">Matched ITC (Sec 16(2)(aa))</span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{matchedTax.toLocaleString('en-IN')}
          </div>
          <span className="text-[10.5px] text-emerald-500">Allowed for GSTR-3B Claim</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-red-500">ITC at Risk (Discrepancies)</span>
          <div className="text-xl font-black text-red-600 dark:text-red-400 mt-1">₹{atRiskTax.toLocaleString('en-IN')}</div>
          <span className="text-[10.5px] text-red-400">Disallowed until supplier files</span>
        </div>
      </div>

      {/* 13 Statutory Category Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sliders className="h-4 w-4 text-brand-600" />
            13 Statutory Reconciliation Classes
          </span>
          <span className="text-[11px] text-slate-400">Showing {filteredItems.length} Invoices</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categoryOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSelectedCategory(opt.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedCategory === opt.key
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedCategory === opt.key ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {opt.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by Supplier Name, GSTIN, or Invoice Number..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Invariant Record Comparison List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
            <GitCompare className="h-10 w-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Invoices Found in this Category</h4>
            <p className="text-xs text-slate-500">
              Upload your GSTR-2B Excel & Purchase Register Excel files to start matching bills.
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm"
            >
              Upload Excel Spreadsheets
            </button>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-subtle transition-all ${
                item.matchCategory === 'MATCHED'
                  ? 'border-emerald-200 dark:border-emerald-950 bg-emerald-50/20 dark:bg-emerald-950/10'
                  : item.matchCategory === 'MISSING_IN_GSTR2B'
                  ? 'border-red-200 dark:border-red-950 bg-red-50/20 dark:bg-red-950/10'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold ${
                      item.matchCategory === 'MATCHED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : item.matchCategory === 'MISSING_IN_GSTR2B'
                        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {item.categoryLabel || item.matchCategory.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-mono text-slate-400">Ref ID: {item.id}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.resolutionStatus === 'ACCEPTED' ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <Check className="h-3.5 w-3.5" /> Accepted by CA
                    </span>
                  ) : item.resolutionStatus === 'REJECTED' ? (
                    <span className="text-xs font-bold text-red-600 flex items-center gap-1 bg-red-50 dark:bg-red-950 px-3 py-1 rounded-xl border border-red-200 dark:border-red-800">
                      <X className="h-3.5 w-3.5" /> Disputed / Rejected
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleUpdateResolution(item.id, 'ACCEPTED')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                      >
                        <Check className="h-3.5 w-3.5" /> Accept Match
                      </button>
                      <button
                        onClick={() => handleUpdateResolution(item.id, 'REJECTED')}
                        className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 font-bold text-xs flex items-center gap-1"
                      >
                        <X className="h-3.5 w-3.5" /> Dispute
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Side-by-Side Invariant Box: Purchase Register vs GSTR-2B */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs">
                {/* Left Side: Client Purchase Register Entry */}
                <div className="p-4 rounded-xl border border-brand-100 dark:border-brand-950 bg-brand-50/20 dark:bg-brand-950/20 space-y-2">
                  <div className="flex items-center justify-between border-b border-brand-100 dark:border-brand-900 pb-2">
                    <span className="font-bold text-brand-900 dark:text-brand-200 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-brand-600" /> Client Purchase Register (Books)
                    </span>
                    {item.purchaseInvoice ? (
                      <span className="text-[10.5px] font-mono text-slate-500">
                        {item.purchaseInvoice.invoiceDate}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded">
                        Not in Books
                      </span>
                    )}
                  </div>

                  {item.purchaseInvoice ? (
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {item.purchaseInvoice.supplierName}
                      </div>
                      <div className="text-slate-500 font-mono text-[11px]">
                        GSTIN: {item.purchaseInvoice.supplierGstin} • Inv: {item.purchaseInvoice.invoiceNumber}
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">Taxable Amount:</span>
                        <span className="font-bold font-mono">₹{item.purchaseInvoice.taxableValue.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Total Tax (IGST+CGST+SGST):</span>
                        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          ₹{(item.purchaseInvoice.igst + item.purchaseInvoice.cgst + item.purchaseInvoice.sgst).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-400 italic">
                      Invoice missing from client purchase register.
                    </div>
                  )}
                </div>

                {/* Right Side: Official GSTR-2B Portal Entry */}
                <div className="p-4 rounded-xl border border-purple-100 dark:border-purple-950 bg-purple-50/20 dark:bg-purple-950/20 space-y-2">
                  <div className="flex items-center justify-between border-b border-purple-100 dark:border-purple-900 pb-2">
                    <span className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <FileSpreadsheet className="h-4 w-4 text-purple-600" /> Official GSTR-2B Portal Record
                    </span>
                    {item.gstr2bRecord ? (
                      <span className="text-[10.5px] font-mono text-slate-500">
                        Filing: {item.gstr2bRecord.filingDate || item.gstr2bRecord.invoiceDate}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded">
                        Missing in 2B
                      </span>
                    )}
                  </div>

                  {item.gstr2bRecord ? (
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {item.gstr2bRecord.supplierName}
                      </div>
                      <div className="text-slate-500 font-mono text-[11px]">
                        GSTIN: {item.gstr2bRecord.supplierGstin} • Inv: {item.gstr2bRecord.invoiceNumber}
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">Portal Taxable:</span>
                        <span className="font-bold font-mono">₹{item.gstr2bRecord.taxableValue.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Eligible ITC:</span>
                        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          ₹{(item.gstr2bRecord.igst + item.gstr2bRecord.cgst + item.gstr2bRecord.sgst).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-red-500 font-semibold italic">
                      Supplier has NOT uploaded this invoice in GSTR-1.
                    </div>
                  )}
                </div>
              </div>

              {/* AI Explanation & CA Recommended Action */}
              <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">AI Finding & Audit Note: </span>
                    <span className="text-slate-700 dark:text-slate-300">{item.aiExplanation}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-6 text-[11px] text-brand-600 dark:text-brand-400 font-semibold">
                  <span>Action: {item.suggestedAction}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dual Excel Real Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-modal space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                Upload GSTR-2B Excel & Purchase Register Excel for Auto-Match
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRunAutomatedMatching} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Target Practice Client *
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
                    Tax Return Month *
                  </label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="July 2026">July 2026</option>
                    <option value="June 2026">June 2026</option>
                    <option value="May 2026">May 2026</option>
                  </select>
                </div>
              </div>

              {/* Dual Upload Real Dropboxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File 1: Official GSTR-2B Excel */}
                <div
                  onClick={() => gstr2bInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors space-y-2 ${
                    gstr2bParsed.length > 0
                      ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : 'border-purple-300 dark:border-purple-800 bg-purple-50/20 dark:bg-purple-950/20 hover:border-purple-400'
                  }`}
                >
                  <input
                    ref={gstr2bInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.json"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleGstr2bFileChange(e.target.files[0]);
                      }
                    }}
                  />

                  {isParsing2B ? (
                    <RefreshCw className="h-8 w-8 text-purple-600 animate-spin mx-auto" />
                  ) : gstr2bParsed.length > 0 ? (
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                  ) : (
                    <FileSpreadsheet className="h-8 w-8 text-purple-600 mx-auto" />
                  )}

                  <span className="font-bold text-purple-950 dark:text-purple-200 block text-xs">
                    1. Official GSTR-2B Excel
                  </span>
                  <p className="text-[10px] text-slate-500">GST Portal Download (.xlsx / .csv / .json)</p>

                  {gstr2bParsed.length > 0 ? (
                    <div className="text-[10.5px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-900/40 p-1.5 rounded-lg">
                      ✓ {gstr2bParsed.length} GSTR-2B Invoices Loaded
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        gstr2bInputRef.current?.click();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 text-white font-bold text-[10.5px] hover:bg-purple-700 shadow-sm"
                    >
                      {gstr2bFile ? gstr2bFile.name : 'Select GSTR-2B File'}
                    </button>
                  )}
                </div>

                {/* File 2: Client Purchase Register */}
                <div
                  onClick={() => purchaseInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors space-y-2 ${
                    purchaseParsed.length > 0
                      ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : 'border-brand-300 dark:border-brand-800 bg-brand-50/20 dark:bg-brand-950/20 hover:border-brand-400'
                  }`}
                >
                  <input
                    ref={purchaseInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.txt"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handlePurchaseFileChange(e.target.files[0]);
                      }
                    }}
                  />

                  {isParsingPurchase ? (
                    <RefreshCw className="h-8 w-8 text-brand-600 animate-spin mx-auto" />
                  ) : purchaseParsed.length > 0 ? (
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                  ) : (
                    <FileText className="h-8 w-8 text-brand-600 mx-auto" />
                  )}

                  <span className="font-bold text-brand-950 dark:text-brand-200 block text-xs">
                    2. Purchase Register Excel
                  </span>
                  <p className="text-[10px] text-slate-500">Tally / Zoho / Excel Purchase Bills</p>

                  {purchaseParsed.length > 0 ? (
                    <div className="text-[10.5px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-900/40 p-1.5 rounded-lg">
                      ✓ {purchaseParsed.length} Purchase Bills Loaded
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        purchaseInputRef.current?.click();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-brand-600 text-white font-bold text-[10.5px] hover:bg-brand-700 shadow-sm"
                    >
                      {purchaseFile ? purchaseFile.name : 'Select Purchase Excel'}
                    </button>
                  )}
                </div>
              </div>

              {/* Template & Demo Helper Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadDemoFiles}
                    className="font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    ⚡ Load Demo Excel Files
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => reconciliationService.downloadSampleGSTR2BTemplate()}
                    className="text-slate-600 dark:text-slate-300 hover:underline flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" /> GSTR-2B Template
                  </button>
                  <button
                    type="button"
                    onClick={() => reconciliationService.downloadSamplePurchaseRegisterTemplate()}
                    className="text-slate-600 dark:text-slate-300 hover:underline flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" /> Purchase Template
                  </button>
                </div>
              </div>

              {/* Upload errors */}
              {uploadErrors.length > 0 && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs">
                  <div className="font-bold flex items-center gap-1 mb-1">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span>Upload Notices:</span>
                  </div>
                  {uploadErrors.map((err, i) => (
                    <p key={i} className="text-[11px]">• {err}</p>
                  ))}
                </div>
              )}

              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-900 dark:text-purple-200 text-[11.5px] flex items-center gap-2 border border-purple-200 dark:border-purple-800">
                <Sparkles className="h-4 w-4 text-purple-600 shrink-0" />
                <span>The 13-Rule Auto Match Engine will reconcile both Excel files line-by-line in under 2 seconds.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAIProcessing || (gstr2bParsed.length === 0 && purchaseParsed.length === 0)}
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50 shadow-md text-xs"
                >
                  {isAIProcessing ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Auto Matching Invoices...</span>
                    </>
                  ) : (
                    <span>Execute 13-Rule Automated Match</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReconciliationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading AI Reconciliation Hub...</div>}>
      <ReconciliationContent />
    </Suspense>
  );
}
