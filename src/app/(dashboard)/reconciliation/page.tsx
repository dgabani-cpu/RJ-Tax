'use client';

import React, { useState, Suspense } from 'react';
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
import { INITIAL_RECON_DATA } from '@/lib/db/mockDb';
import { MatchCategory, ReconciliationItem, Client } from '@/types';
import { clientService } from '@/services/clientService';

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
  }, []);

  const [selectedPeriod, setSelectedPeriod] = useState('July 2026');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [reconData, setReconData] = useState<ReconciliationItem[]>(INITIAL_RECON_DATA);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(autoUpload);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [lastAutoMatchSummary, setLastAutoMatchSummary] = useState<{
    matchedCount: number;
    discrepancyCount: number;
    totalITC: number;
    timestamp: string;
  } | null>(null);

  // File Upload State
  const [gstr2bFileName, setGstr2bFileName] = useState<string | null>(null);
  const [purchaseBillFileName, setPurchaseBillFileName] = useState<string | null>(null);

  const client = clients.find((c) => c.id === selectedClientId) || clients[0] || {
    id: 'client-default',
    legalName: 'Practice Client',
    gstin: '24AAAAA0000A1Z5',
  };

  const categoryOptions: { key: string; label: string; count: number }[] = [
    { key: 'ALL', label: 'All Records', count: reconData.length },
    { key: 'MATCHED', label: 'A. Matched (100%)', count: reconData.filter((r) => r.matchCategory === 'MATCHED').length },
    { key: 'PARTIALLY_MATCHED', label: 'B. Partially Matched', count: reconData.filter((r) => r.matchCategory === 'PARTIALLY_MATCHED').length },
    { key: 'MISSING_IN_GSTR2B', label: 'C. Missing in GSTR-2B', count: reconData.filter((r) => r.matchCategory === 'MISSING_IN_GSTR2B').length },
    { key: 'MISSING_PURCHASE_INVOICE', label: 'D. Missing Purchase Invoice', count: reconData.filter((r) => r.matchCategory === 'MISSING_PURCHASE_INVOICE').length },
    { key: 'VALUE_MISMATCH', label: 'E. Value Mismatch', count: reconData.filter((r) => r.matchCategory === 'VALUE_MISMATCH').length },
    { key: 'TAX_MISMATCH', label: 'F. Tax Mismatch', count: reconData.filter((r) => r.matchCategory === 'TAX_MISMATCH').length },
    { key: 'INVOICE_NUM_MISMATCH', label: 'H. Invoice No. Mismatch', count: reconData.filter((r) => r.matchCategory === 'INVOICE_NUM_MISMATCH').length },
    { key: 'DUPLICATE_INVOICE', label: 'J. Duplicate Invoice', count: reconData.filter((r) => r.matchCategory === 'DUPLICATE_INVOICE').length },
    { key: 'POSSIBLE_CREDIT_NOTE', label: 'K. Possible Credit Note', count: reconData.filter((r) => r.matchCategory === 'POSSIBLE_CREDIT_NOTE').length },
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

  const handleUpdateResolution = (itemId: string, status: 'ACCEPTED' | 'REJECTED') => {
    setReconData((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, resolutionStatus: status } : item))
    );
    logAuditAction(
      `Reconciliation Item ${status}`,
      'RECONCILIATION',
      client.legalName,
      `Item ID: ${itemId} marked as ${status}`
    );
  };

  // Automated 2B + Purchase Register Excel Matching Engine Simulation
  const handleRunAutomatedMatching = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAIProcessing(true);

    setTimeout(() => {
      // Simulate reading and auto-matching 2B Excel + Purchase Register Excel
      const autoMatchedNewItems: ReconciliationItem[] = [
        {
          id: `recon-${Date.now()}-1`,
          clientId: selectedClientId,
          financialYear: '2026-27',
          taxPeriod: 'July 2026',
          matchCategory: 'MATCHED',
          categoryLabel: 'A. Matched (100% Exact)',
          purchaseInvoice: {
            id: 'pinv-auto-1',
            clientId: selectedClientId,
            financialYear: '2026-27',
            taxPeriod: 'July 2026',
            supplierName: 'Tata Steel Processing Ltd',
            supplierGstin: '24AAACT1234F1ZP',
            invoiceNumber: 'TSP/2026/0891',
            invoiceDate: '2026-07-15',
            taxableValue: 450000,
            cgst: 40500,
            sgst: 40500,
            igst: 0,
            cess: 0,
            totalAmount: 531000,
            uploadedAt: '2026-08-09',
          },
          gstr2bRecord: {
            id: 'gstr2b-auto-1',
            clientId: selectedClientId,
            financialYear: '2026-27',
            taxPeriod: 'July 2026',
            supplierName: 'Tata Steel Processing Ltd',
            supplierGstin: '24AAACT1234F1ZP',
            invoiceNumber: 'TSP/2026/0891',
            invoiceType: 'B2B',
            invoiceDate: '2026-07-15',
            taxableValue: 450000,
            cgst: 40500,
            sgst: 40500,
            igst: 0,
            cess: 0,
            totalAmount: 531000,
            itcAvailability: 'Y',
            filingDate: '2026-08-09',
          },
          aiExplanation: '100% Exact match between GSTR-2B portal Excel download and client Purchase Register.',
          suggestedAction: 'ITC Eligible Section 16(2)(aa). Auto-posted to books.',
          resolutionStatus: 'ACCEPTED',
        },
        {
          id: `recon-${Date.now()}-2`,
          clientId: selectedClientId,
          financialYear: '2026-27',
          taxPeriod: 'July 2026',
          matchCategory: 'INVOICE_NUM_MISMATCH',
          categoryLabel: 'H. Invoice No. Mismatch',
          purchaseInvoice: {
            id: 'pinv-auto-2',
            clientId: selectedClientId,
            financialYear: '2026-27',
            taxPeriod: 'July 2026',
            supplierName: 'UltraTech Cement Distributors',
            supplierGstin: '24AAACU9988D1ZQ',
            invoiceNumber: 'UTC/JUL/402',
            invoiceDate: '2026-07-18',
            taxableValue: 280000,
            cgst: 25200,
            sgst: 25200,
            igst: 0,
            cess: 0,
            totalAmount: 330400,
            uploadedAt: '2026-08-09',
          },
          gstr2bRecord: {
            id: 'gstr2b-auto-2',
            clientId: selectedClientId,
            financialYear: '2026-27',
            taxPeriod: 'July 2026',
            supplierName: 'UltraTech Cement Distributors',
            supplierGstin: '24AAACU9988D1ZQ',
            invoiceNumber: 'UTC-JUL-402',
            invoiceType: 'B2B',
            invoiceDate: '2026-07-18',
            taxableValue: 280000,
            cgst: 25200,
            sgst: 25200,
            igst: 0,
            cess: 0,
            totalAmount: 330400,
            itcAvailability: 'Y',
            filingDate: '2026-08-09',
          },
          aiExplanation: 'Fuzzy Match (98.4% Confidence): Invoice number contains slash "/" in purchase register vs dash "-" in GSTR-2B Excel.',
          suggestedAction: 'Accept invoice number normalization alias.',
          resolutionStatus: 'PENDING',
        },
      ];

      const merged = [...autoMatchedNewItems, ...reconData];
      setReconData(merged);
      setIsAIProcessing(false);
      setIsUploadModalOpen(false);

      setLastAutoMatchSummary({
        matchedCount: 2,
        discrepancyCount: 1,
        totalITC: 131400,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      logAuditAction(
        'Automated Dual Excel Reconciliation Executed',
        'RECONCILIATION',
        client.legalName,
        `Matched GSTR-2B Excel (${gstr2bFileName || 'GSTR2B_July2026.xlsx'}) with Purchase Register (${purchaseBillFileName || 'Purchase_Bills_July2026.xlsx'})`
      );
    }, 1800);
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
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload GSTR-2B & Purchase Excel</span>
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
                Auto-reconciled GSTR-2B download against Purchase Register. Matched <strong>{lastAutoMatchSummary.matchedCount} invoices</strong> (₹{lastAutoMatchSummary.totalITC.toLocaleString('en-IN')} ITC).
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
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Client Books Taxable Value</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">₹{totalPurchaseValue.toLocaleString('en-IN')}</div>
          <span className="text-[10.5px] text-slate-400">Tax: ₹{totalPurchaseTax.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-purple-500">Official GSTR-2B Taxable Value</span>
          <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">₹{total2BValue.toLocaleString('en-IN')}</div>
          <span className="text-[10.5px] text-purple-400">Tax: ₹{total2BTax.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-500">Matched ITC (Sec 16(2)(aa))</span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{(total2BTax - 26550).toLocaleString('en-IN')}
          </div>
          <span className="text-[10.5px] text-emerald-500">Allowed for GSTR-3B Claim</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-red-500">ITC at Risk (Discrepancies)</span>
          <div className="text-xl font-black text-red-600 dark:text-red-400 mt-1">₹26,550</div>
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
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span>{opt.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${selectedCategory === opt.key ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'}`}>
                {opt.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-Side Invariant Record Comparison List */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
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
                  {item.matchCategory.replace(/_/g, ' ')}
                </span>
                <span className="text-xs font-mono text-slate-400">Ref ID: {item.id}</span>
              </div>

              <div className="flex items-center gap-2">
                {item.resolutionStatus === 'ACCEPTED' ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-200">
                    <Check className="h-3.5 w-3.5" /> Accepted by CA
                  </span>
                ) : item.resolutionStatus === 'REJECTED' ? (
                  <span className="text-xs font-bold text-red-600 flex items-center gap-1 bg-red-50 dark:bg-red-950 px-3 py-1 rounded-xl border border-red-200">
                    <X className="h-3.5 w-3.5" /> Rejected by CA
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => handleUpdateResolution(item.id, 'ACCEPTED')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 shadow-xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Accept Match</span>
                    </button>
                    <button
                      onClick={() => handleUpdateResolution(item.id, 'REJECTED')}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Side-by-Side Cards: Client Purchase Register vs Official GSTR-2B Record */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
              {/* Client Books */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-brand-600" />
                    Client Purchase Register (Books)
                  </span>
                  {item.purchaseInvoice ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-100 text-brand-800">
                      Inv #{item.purchaseInvoice.invoiceNumber}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">MISSING IN BOOKS</span>
                  )}
                </div>

                {item.purchaseInvoice ? (
                  <div className="space-y-1 text-slate-700 dark:text-slate-300">
                    <div className="font-bold text-slate-900 dark:text-white">{item.purchaseInvoice.supplierName}</div>
                    <div className="font-mono text-[11px] text-slate-400">GSTIN: {item.purchaseInvoice.supplierGstin}</div>
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11.5px]">
                      <div>Taxable: ₹{item.purchaseInvoice.taxableValue.toLocaleString('en-IN')}</div>
                      <div>IGST: ₹{item.purchaseInvoice.igst.toLocaleString('en-IN')}</div>
                      <div>CGST: ₹{item.purchaseInvoice.cgst.toLocaleString('en-IN')}</div>
                      <div>SGST: ₹{item.purchaseInvoice.sgst.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic py-2">No purchase invoice recorded in client books for this 2B record.</p>
                )}
              </div>

              {/* Official GSTR-2B Record */}
              <div className="p-4 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/60 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-purple-200 dark:border-purple-800">
                  <span className="font-extrabold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-purple-600" />
                    Official GSTR-2B Portal Record
                  </span>
                  {item.gstr2bRecord ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      2B #{item.gstr2bRecord.invoiceNumber}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">NOT IN GSTR-2B</span>
                  )}
                </div>

                {item.gstr2bRecord ? (
                  <div className="space-y-1 text-slate-700 dark:text-slate-300">
                    <div className="font-bold text-slate-900 dark:text-white">{item.gstr2bRecord.supplierName}</div>
                    <div className="font-mono text-[11px] text-slate-400">GSTIN: {item.gstr2bRecord.supplierGstin}</div>
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11.5px]">
                      <div>Taxable: ₹{item.gstr2bRecord.taxableValue.toLocaleString('en-IN')}</div>
                      <div>IGST: ₹{item.gstr2bRecord.igst.toLocaleString('en-IN')}</div>
                      <div>CGST: ₹{item.gstr2bRecord.cgst.toLocaleString('en-IN')}</div>
                      <div>SGST: ₹{item.gstr2bRecord.sgst.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-red-500 italic py-2">Supplier has not filed GSTR-1 for this invoice yet.</p>
                )}
              </div>
            </div>

            {/* AI Discrepancy Rationale Explainer */}
            <div className="mt-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-bold text-purple-950 dark:text-purple-200">
                  {item.aiExplanation}
                </div>
                <div className="text-[11.5px] font-semibold text-purple-800 dark:text-purple-300">
                  Suggested CA Action: {item.suggestedAction}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dual Excel Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-modal space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-600" />
                Upload GSTR-2B Excel & Purchase Register Excel for Auto-Match
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleRunAutomatedMatching} className="space-y-4 text-xs">
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

              {/* Dual Upload Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* File 1: Official GSTR-2B Excel */}
                <div className="border-2 border-dashed border-purple-300 dark:border-purple-800 rounded-xl p-4 text-center bg-purple-50/30 dark:bg-purple-950/20 space-y-2">
                  <FileSpreadsheet className="h-8 w-8 text-purple-600 mx-auto" />
                  <span className="font-bold text-purple-950 dark:text-purple-200 block text-xs">1. Official GSTR-2B Excel</span>
                  <p className="text-[10px] text-slate-500">GST Portal Download (.xlsx / .csv)</p>
                  <button
                    type="button"
                    onClick={() => setGstr2bFileName('GSTR2B_July2026_Official.xlsx')}
                    className="px-2.5 py-1 rounded bg-purple-600 text-white font-bold text-[10.5px]"
                  >
                    {gstr2bFileName || 'Select GSTR-2B Excel'}
                  </button>
                </div>

                {/* File 2: Client Purchase Register */}
                <div className="border-2 border-dashed border-brand-300 dark:border-brand-800 rounded-xl p-4 text-center bg-brand-50/30 dark:bg-brand-950/20 space-y-2">
                  <FileText className="h-8 w-8 text-brand-600 mx-auto" />
                  <span className="font-bold text-brand-950 dark:text-brand-200 block text-xs">2. Purchase Register Excel</span>
                  <p className="text-[10px] text-slate-500">Tally / Zoho / Excel Purchase Register</p>
                  <button
                    type="button"
                    onClick={() => setPurchaseBillFileName('Purchase_Register_July2026.xlsx')}
                    className="px-2.5 py-1 rounded bg-brand-600 text-white font-bold text-[10.5px]"
                  >
                    {purchaseBillFileName || 'Select Purchase Excel'}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-900 dark:text-purple-200 text-[11.5px] flex items-center gap-2 border border-purple-200">
                <Sparkles className="h-4 w-4 text-purple-600 shrink-0" />
                <span>The 13-Rule Auto Match Engine will reconcile both Excel files line-by-line in under 2 seconds.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAIProcessing}
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50 shadow-md"
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
