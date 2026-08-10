'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, FileText, CheckSquare, RefreshCw, X, ArrowRight, Building2, UserCheck } from 'lucide-react';
import { INITIAL_TASKS, INITIAL_DOCUMENTS, INITIAL_RECON_DATA, INITIAL_USERS } from '@/lib/db/mockDb';
import { clientService } from '@/services/clientService';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    const allClients = clientService.getClients();

    const matchedClients = allClients.filter(
      (c) =>
        c.legalName.toLowerCase().includes(q) ||
        c.tradeName.toLowerCase().includes(q) ||
        c.gstin.toLowerCase().includes(q) ||
        c.pan.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.authorizedPerson?.name?.toLowerCase().includes(q)
    );

    const matchedTasks = INITIAL_TASKS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.clientName.toLowerCase().includes(q) ||
        t.assignedStaffName.toLowerCase().includes(q)
    );

    const matchedInvoices = INITIAL_RECON_DATA.filter(
      (r) =>
        r.purchaseInvoice?.invoiceNumber.toLowerCase().includes(q) ||
        r.purchaseInvoice?.supplierName.toLowerCase().includes(q) ||
        r.gstr2bRecord?.invoiceNumber.toLowerCase().includes(q) ||
        r.gstr2bRecord?.supplierName.toLowerCase().includes(q)
    );

    const matchedDocs = INITIAL_DOCUMENTS.filter(
      (d) => d.fileName.toLowerCase().includes(q) || d.clientName.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)
    );

    const matchedStaff = INITIAL_USERS.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.roleTitle.toLowerCase().includes(q)
    );

    return {
      clients: matchedClients,
      tasks: matchedTasks,
      invoices: matchedInvoices,
      docs: matchedDocs,
      staff: matchedStaff,
    };
  }, [query]);

  if (!isOpen) return null;

  const navigateTo = (url: string) => {
    onClose();
    router.push(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-modal overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="relative flex items-center border-b border-slate-200 dark:border-slate-800 px-4 py-3.5">
          <Search className="h-5 w-5 text-brand-600 dark:text-brand-400 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients, GSTIN, PAN, invoices, tasks, staff, files..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-2 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query.trim() ? (
            <div className="py-8 text-center">
              <Building2 className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quick Global Search</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                Type client trade name, 15-digit GSTIN, PAN, invoice number, staff name, or document file.
              </p>
              <div className="flex justify-center gap-2 mt-4">
                {['Apex Infra', '24AABCA1234F1Z5', 'Ultratech', 'July 2026', 'Amit Verma'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:text-brand-600 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Clients Results */}
              {searchResults?.clients && searchResults.clients.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-brand-600" />
                    Clients ({searchResults.clients.length})
                  </div>
                  <div className="space-y-1.5">
                    {searchResults.clients.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => navigateTo(`/clients/${c.id}`)}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-brand-50/40 dark:hover:bg-brand-950/30 cursor-pointer transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{c.legalName}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold">
                              {c.gstin}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            PAN: {c.pan} • {c.entityType} • Assigned: {c.assignedStaff.map((s) => s.staffName).join(', ')}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks Results */}
              {searchResults?.tasks && searchResults.tasks.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <CheckSquare className="h-3.5 w-3.5 text-amber-500" />
                    Tasks ({searchResults.tasks.length})
                  </div>
                  <div className="space-y-1.5">
                    {searchResults.tasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => navigateTo('/tasks')}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-amber-300 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">{t.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {t.clientName} • Due: {t.dueDate} • Assigned: {t.assignedStaffName}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices & Reconciliation */}
              {searchResults?.invoices && searchResults.invoices.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5 text-purple-500" />
                    Invoices & Reconciliation ({searchResults.invoices.length})
                  </div>
                  <div className="space-y-1.5">
                    {searchResults.invoices.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => navigateTo(`/reconciliation?clientId=${r.clientId}`)}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-purple-300 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">
                            {r.purchaseInvoice?.supplierName || r.gstr2bRecord?.supplierName}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Inv: {r.purchaseInvoice?.invoiceNumber || r.gstr2bRecord?.invoiceNumber} • Value: ₹
                            {(r.purchaseInvoice?.taxableValue || r.gstr2bRecord?.taxableValue || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                          {r.categoryLabel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Staff Results */}
              {searchResults?.staff && searchResults.staff.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-blue-500" />
                    Staff ({searchResults.staff.length})
                  </div>
                  <div className="space-y-1.5">
                    {searchResults.staff.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => navigateTo('/staff')}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">{s.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {s.roleTitle} • {s.email} • {s.phone}
                          </p>
                        </div>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {s.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No matches */}
              {searchResults &&
                searchResults.clients.length === 0 &&
                searchResults.tasks.length === 0 &&
                searchResults.invoices.length === 0 &&
                searchResults.docs.length === 0 &&
                searchResults.staff.length === 0 && (
                  <div className="py-8 text-center text-slate-500">
                    <p className="text-xs font-semibold">No records found matching &ldquo;{query}&rdquo;</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try searching by client name, GSTIN, PAN or invoice number.</p>
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
