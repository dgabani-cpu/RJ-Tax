'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  FolderLock,
  UploadCloud,
  Search,
  Filter,
  FileText,
  Download,
  Eye,
  Trash2,
  Lock,
  ShieldCheck,
  Calendar,
  Building,
  Plus,
  Folder,
  Send,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { INITIAL_DOCUMENTS, INITIAL_CLIENTS } from '@/lib/db/mockDb';
import { documentService, DocumentRequestItem, INITIAL_DOCUMENT_REQUESTS } from '@/services/documentService';
import { DocumentItem } from '@/types';

export default function DocumentsPage() {
  const { user, hasPermission, logAuditAction } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [requests, setRequests] = useState<DocumentRequestItem[]>(INITIAL_DOCUMENT_REQUESTS);
  const [activeTab, setActiveTab] = useState<'VAULT' | 'REQUESTS'>('VAULT');

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('ALL');

  // Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reqClientId, setReqClientId] = useState(INITIAL_CLIENTS[0]?.id || '');
  const [reqDocType, setReqDocType] = useState<DocumentRequestItem['documentType']>('Purchase Bills');
  const [reqMonth, setReqMonth] = useState('July 2026');
  const [reqDueDate, setReqDueDate] = useState('2026-08-10');
  const [reqNotes, setReqNotes] = useState('');

  const categories = [
    'ALL',
    'Client Documents',
    'GST Documents',
    'Purchase Invoices',
    'Sales Invoices',
    'GSTR-2B',
    'Returns',
    'Certificates',
    'Reports',
    'Other',
  ];

  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = selectedCategory === 'ALL' || doc.category === selectedCategory;
    const matchesClient = selectedClientId === 'ALL' || doc.clientId === selectedClientId;
    const matchesSearch =
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesClient && matchesSearch;
  });

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const targetClient = INITIAL_CLIENTS.find((c) => c.id === reqClientId) || INITIAL_CLIENTS[0] || {
      id: 'client-1',
      legalName: 'Practice Client',
    };

    const created: DocumentRequestItem = {
      id: `req-${Date.now()}`,
      clientId: targetClient.id,
      clientName: targetClient.legalName,
      financialYear: '2026-27',
      taxPeriod: reqMonth,
      documentType: reqDocType,
      dueDate: reqDueDate,
      requestedBy: user?.name || 'TaxNexus Executive',
      status: 'Pending',
      createdAt: new Date().toISOString().split('T')[0],
      notes: reqNotes,
      isMockData: true,
    };

    setRequests([created, ...requests]);
    setIsRequestModalOpen(false);
    logAuditAction('Document Requested from Client', 'DOCUMENT', targetClient.legalName, `Requested: ${reqDocType} for ${reqMonth}`);
  };

  const handleDownload = (doc: DocumentItem) => {
    logAuditAction('Document Downloaded', 'DOCUMENT', doc.clientName, `File: ${doc.fileName}`);
    alert(`Downloading ${doc.fileName}...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FolderLock className="h-6 w-6 text-brand-600" />
            Centralized Document Vault & Request System
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Encrypted file repository and formal client document collection workflow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold hover:bg-purple-100 transition-all"
          >
            <Send className="h-4 w-4" />
            <span>Request Document</span>
          </button>

          {hasPermission('uploadDocuments') && (
            <button
              onClick={() => alert('Select file to upload into encrypted client vault.')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Upload File</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('VAULT')}
          className={`pb-3 transition-all ${
            activeTab === 'VAULT'
              ? 'border-b-2 border-brand-600 text-brand-600 dark:text-brand-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Encrypted Document Vault ({documents.length})
        </button>

        <button
          onClick={() => setActiveTab('REQUESTS')}
          className={`pb-3 transition-all ${
            activeTab === 'REQUESTS'
              ? 'border-b-2 border-brand-600 text-brand-600 dark:text-brand-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Client Document Requests ({requests.length})
        </button>
      </div>

      {activeTab === 'VAULT' ? (
        <>
          {/* Filter and Folder Navigation Strip */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documents by file name or client..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All Clients</option>
                {INITIAL_CLIENTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.legalName}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10.5px]">
                  <tr>
                    <th className="py-3 px-4">File Name & Format</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Size & Version</th>
                    <th className="py-3 px-4">Uploaded By</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="h-4 w-4 text-brand-600" />
                        <span>{doc.fileName}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">{doc.clientName}</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {doc.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{doc.fileSize} • {doc.version}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{doc.uploadedBy}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-1.5 rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 hover:bg-brand-100"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* REQUESTS TAB */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Client Document Collection Requests</h3>
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{r.documentType}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${r.status === 'Uploaded' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-1">{r.notes}</p>
                  <span className="text-[10px] text-slate-400">Client: {r.clientName} • Due Date: {r.dueDate}</span>
                </div>
                <button onClick={() => alert(`Reminder sent to ${r.clientName}`)} className="px-3 py-1 text-xs font-bold rounded-lg bg-brand-600 text-white">
                  Send WhatsApp Reminder
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Request Document from Client</h3>
              <button onClick={() => setIsRequestModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateRequest} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Target Client *</label>
                <select value={reqClientId} onChange={(e) => setReqClientId(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                  {INITIAL_CLIENTS.map((c) => (
                    <option key={c.id} value={c.id}>{c.legalName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Document Type *</label>
                <select value={reqDocType} onChange={(e) => setReqDocType(e.target.value as any)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold">
                  <option value="Purchase Bills">Purchase Bills</option>
                  <option value="Sales Bills">Sales Bills</option>
                  <option value="Bank Statement">Bank Statement</option>
                  <option value="Expense Bills">Expense Bills</option>
                  <option value="Credit Notes">Credit Notes</option>
                  <option value="Debit Notes">Debit Notes</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Tax Period</label>
                  <input type="text" value={reqMonth} onChange={(e) => setReqMonth(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                  <input type="date" value={reqDueDate} onChange={(e) => setReqDueDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Specific Instructions for Client</label>
                <textarea rows={2} value={reqNotes} onChange={(e) => setReqNotes(e.target.value)} placeholder="e.g. Please send original PDF bills for steel purchase..." className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsRequestModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700">Dispatch Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
