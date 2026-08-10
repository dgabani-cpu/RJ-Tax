'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  Printer,
  FileText,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Building,
  TrendingUp,
  PieChart,
} from 'lucide-react';
import { INITIAL_RECON_DATA } from '@/lib/db/mockDb';
import { Client } from '@/types';
import { clientService } from '@/services/clientService';

export default function ReportsPage() {
  const { user, logAuditAction } = useAuth();
  const [clients, setClients] = useState<Client[]>(() => clientService.getClients());
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
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
  const [selectedReportType, setSelectedReportType] = useState('GSTR2B_RECON_SUMMARY');

  const client = clients.find((c) => c.id === selectedClientId) || clients[0] || {
    id: 'client-1',
    legalName: 'Practice Client',
    gstin: '24AAAAA0000A1Z5',
  };

  const reportTypes = [
    { id: 'GSTR2B_RECON_SUMMARY', title: 'GSTR-2B Reconciliation & Bifurcation Summary', icon: BarChart3 },
    { id: 'MISSING_INVOICES_REPORT', title: 'Supplier Missing Invoices Schedule (Non-Filers)', icon: AlertTriangle },
    { id: 'TAX_MISMATCH_REPORT', title: 'Tax Head & Value Discrepancy Report', icon: FileText },
    { id: 'PURCHASE_REGISTER_SUMMARY', title: 'Monthly Purchase Book vs 2B Tax Summary', icon: FileSpreadsheet },
    { id: 'STAFF_ACTIVITY_REPORT', title: 'Practice Staff SLA & Filing Audit Report', icon: CheckCircle2 },
  ];

  const handleExport = (format: 'PDF' | 'EXCEL' | 'CSV' | 'PRINT') => {
    logAuditAction(`Report Exported (${format})`, 'REPORTS', client.legalName, `Type: ${selectedReportType}`);
    if (format === 'PRINT') {
      window.print();
    } else {
      alert(`Exporting ${selectedReportType} as ${format} file...`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-brand-600" />
            Client Practice Reports & Analytics Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate and export audit-ready GSTR-2B summaries, missing invoice schedules, and tax bifurcations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExport('EXCEL')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => handleExport('PDF')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => handleExport('PRINT')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-subtle"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter Parameters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs no-print">
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Select Report Type</label>
          <select
            value={selectedReportType}
            onChange={(e) => setSelectedReportType(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
          >
            {reportTypes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Practice Client</label>
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
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Tax Period</label>
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

      {/* Generated Report Presentation Canvas */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card space-y-6">
        {/* Report Official Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b-2 border-slate-900 dark:border-slate-100 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                TAXNEXUS & ASSOCIATES CHARTERED ACCOUNTANTS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Practice Management & Tax Compliance Automation Report
            </p>
          </div>

          <div className="text-right text-xs">
            <span className="font-mono text-slate-400">Date of Report:</span>
            <strong className="block text-slate-900 dark:text-white">09 August 2026</strong>
          </div>
        </div>

        {/* Client Metadata Header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-850 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Client Name:</span>
            <strong className="text-slate-900 dark:text-white">{client.legalName}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">GSTIN:</span>
            <strong className="font-mono text-brand-600 dark:text-brand-400">{client.gstin}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">PAN:</span>
            <strong className="font-mono text-slate-800 dark:text-slate-200">{client.pan}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Tax Return Period:</span>
            <strong className="text-emerald-600 dark:text-emerald-400">{selectedPeriod}</strong>
          </div>
        </div>

        {/* Report Table Content */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
            Section 16(2)(aa) Input Tax Credit Reconciliation Summary
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10.5px]">
                <tr>
                  <th className="py-2.5 px-3 border-r">Classification Category</th>
                  <th className="py-2.5 px-3 border-r text-center">Invoice Count</th>
                  <th className="py-2.5 px-3 border-r text-right">Taxable Value (₹)</th>
                  <th className="py-2.5 px-3 border-r text-right">Total Tax (₹)</th>
                  <th className="py-2.5 px-3">Statutory Action Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                <tr>
                  <td className="py-2.5 px-3 border-r font-semibold text-emerald-600">A. Matched (100% Exact)</td>
                  <td className="py-2.5 px-3 border-r text-center font-bold">1</td>
                  <td className="py-2.5 px-3 border-r text-right font-mono">4,50,000.00</td>
                  <td className="py-2.5 px-3 border-r text-right font-mono">1,26,000.00</td>
                  <td className="py-2.5 px-3 text-slate-500">Claim in GSTR-3B Table 4(A)(5)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 border-r font-semibold text-blue-600">B. Partially Matched (Round-off)</td>
                  <td className="py-2.5 px-3 border-r text-center font-bold">1</td>
                  <td className="py-2.5 px-3 border-r text-right font-mono">2,85,450.00</td>
                  <td className="py-2.5 px-3 border-r text-right font-mono">51,381.00</td>
                  <td className="py-2.5 px-3 text-slate-500">Claim ITC with ₹2.00 roundoff entry</td>
                </tr>
                <tr className="bg-red-50/50 dark:bg-red-950/20">
                  <td className="py-2.5 px-3 border-r font-semibold text-red-600">C. Missing in GSTR-2B (Supplier Non-Filer)</td>
                  <td className="py-2.5 px-3 border-r text-center font-bold">1</td>
                  <td className="py-2.5 px-3 border-r text-right font-mono">1,25,000.00</td>
                  <td className="py-2.5 px-3 border-r text-right font-mono">22,500.00</td>
                  <td className="py-2.5 px-3 text-red-600 font-semibold">Withhold ITC; Trigger WhatsApp intimation</td>
                </tr>
                <tr className="bg-amber-50/50 dark:bg-amber-950/20">
                  <td className="py-2.5 px-3 border-r font-semibold text-amber-600">E. Taxable Value Mismatch</td>
                  <td className="py-2.5 px-3 border-r text-center font-bold">1</td>
                  <td className="py-2.5 px-3 border-r text-right font-mono">75,000.00</td>
                  <td className="py-2.5 px-3 border-r text-right font-mono">13,500.00</td>
                  <td className="py-2.5 px-3 text-amber-700">Restrict ITC to ₹9,000 (2B value)</td>
                </tr>
                <tr className="bg-slate-100 dark:bg-slate-800 font-bold">
                  <td className="py-2.5 px-3 border-r">TOTAL INPUT TAX CREDIT SUMMARY</td>
                  <td className="py-2.5 px-3 border-r text-center">4</td>
                  <td className="py-2.5 px-3 border-r text-right font-mono">9,35,450.00</td>
                  <td className="py-2.5 px-3 border-r text-right font-mono">2,13,381.00</td>
                  <td className="py-2.5 px-3 text-brand-600 font-bold">Eligible Net ITC: ₹1,86,381.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CA Signature Block */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div>
            <p className="text-slate-400 text-[11px]">Prepared by TaxNexus AI Practice Automation</p>
            <p className="font-mono text-slate-400 text-[10px]">Verification Hash: SHA256-8F29A4D1B89</p>
          </div>
          <div className="text-right">
            <div className="h-10 border-b border-slate-400 w-48 mb-1" />
            <span className="font-bold text-slate-900 dark:text-white">Neel Gabani, FCA</span>
            <span className="text-[10px] text-slate-400 block">Managing Partner • Memb No: 045129</span>
          </div>
        </div>
      </div>
    </div>
  );
}
