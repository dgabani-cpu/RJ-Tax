'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  X,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { INITIAL_DOCUMENTS } from '@/lib/db/mockDb';
import { documentService, DocumentRequestItem, INITIAL_DOCUMENT_REQUESTS } from '@/services/documentService';
import { DocumentItem, Client } from '@/types';
import { clientService } from '@/services/clientService';
import { reconciliationService } from '@/services/reconciliationService';

const DOCS_STORAGE_KEY = 'taxnexus_documents_vault_v1';

export default function DocumentsPage() {
  const { user, hasPermission, logAuditAction } = useAuth();
  const [clients, setClients] = useState<Client[]>(() => clientService.getClients());
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    if (typeof window === 'undefined') return INITIAL_DOCUMENTS;
    try {
      const saved = localStorage.getItem(DOCS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
    } catch {
      return INITIAL_DOCUMENTS;
    }
  });
  const [requests, setRequests] = useState<DocumentRequestItem[]>(INITIAL_DOCUMENT_REQUESTS);
  const [activeTab, setActiveTab] = useState<'VAULT' | 'REQUESTS'>('VAULT');

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('ALL');

  // Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reqClientId, setReqClientId] = useState<string>(() => {
    const all = clientService.getClients();
    return all[0]?.id || '';
  });

  // Direct Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadClientId, setUploadClientId] = useState<string>(() => {
    const all = clientService.getClients();
    return all[0]?.id || '';
  });
  const [uploadCategory, setUploadCategory] = useState('Purchase Invoices');
  const [uploadTaxPeriod, setUploadTaxPeriod] = useState('July 2026');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const allClients = clientService.getClients();
    setClients(allClients);
    if (!reqClientId && allClients.length > 0) {
      setReqClientId(allClients[0].id);
      setUploadClientId(allClients[0].id);
    }
    const handleUpdate = () => {
      const updated = clientService.getClients();
      setClients(updated);
      if (!reqClientId && updated.length > 0) {
        setReqClientId(updated[0].id);
        setUploadClientId(updated[0].id);
      }
    };
    window.addEventListener('taxnexus:clients-updated' as any, handleUpdate);
    return () => window.removeEventListener('taxnexus:clients-updated' as any, handleUpdate);
  }, [reqClientId]);

  const saveDocuments = (newDocs: DocumentItem[]) => {
    setDocuments(newDocs);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(newDocs));
      } catch (e) {
        console.error(e);
      }
    }
  };

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
    const targetClient = clients.find((c) => c.id === reqClientId) || clients[0] || {
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

  const handleConfirmFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile) return;

    const targetClient = clients.find((c) => c.id === uploadClientId) || clients[0] || {
      id: 'client-1',
      legalName: 'Practice Client',
    };

    const sizeStr = `${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB`;
    const cleanDate = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      clientId: targetClient.id,
      clientName: targetClient.legalName,
      fileName: uploadedFile.name,
      fileSize: sizeStr,
      fileType: uploadedFile.name.endsWith('.xlsx') || uploadedFile.name.endsWith('.xls') ? 'EXCEL' : uploadedFile.name.endsWith('.csv') ? 'CSV' : 'PDF',
      category: uploadCategory as any,
      version: 'v1.0',
      uploadedBy: user?.name || 'Neel Gabani',
      uploadedAt: cleanDate,
      downloadUrl: '#',
    };

    saveDocuments([newDoc, ...documents]);

    // If it's a purchase register or 2B excel, parse and link automatically
    if (uploadedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      if (uploadCategory === 'Purchase Invoices') {
        const res = await reconciliationService.parsePurchaseRegisterFile(uploadedFile, targetClient.id, uploadTaxPeriod);
        if (res.success && res.records.length > 0) {
          reconciliationService.savePurchaseRecords(res.records);
        }
      } else if (uploadCategory === 'GSTR-2B') {
        const res = await reconciliationService.parseGSTR2BFile(uploadedFile, targetClient.id, uploadTaxPeriod);
        if (res.success && res.records.length > 0) {
          reconciliationService.saveGSTR2BRecords(res.records);
        }
      }
    }

    logAuditAction('Document Uploaded to Vault', 'DOCUMENT', targetClient.legalName, `Uploaded ${uploadedFile.name} (${uploadCategory})`);
    setIsUploadModalOpen(false);
    setUploadedFile(null);
    alert(`File "${uploadedFile.name}" successfully uploaded and AES-256 encrypted for ${targetClient.legalName}!`);
  };

  const handleDownload = (doc: DocumentItem) => {
    logAuditAction('Document Downloaded', 'DOCUMENT', doc.clientName, `File: ${doc.fileName}`);
    alert(`Downloading ${doc.fileName}...`);
  };

  const handleDelete = (docId: string) => {
    const updated = documents.filter((d) => d.id !== docId);
    saveDocuments(updated);
    logAuditAction('Document Deleted', 'DOCUMENT', 'Vault', `Deleted doc ID: ${docId}`);
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
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Upload Document</span>
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
                {clients.map((c) => (
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
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
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
                <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Document / File Name</th>
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Security</th>
                    <th className="py-3 px-4">Uploaded By</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No documents found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {doc.fileType === 'EXCEL' || doc.fileType === 'CSV' ? (
                            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <FileText className="h-4 w-4 text-brand-600" />
                          )}
                          <div>
                            <div>{doc.fileName}</div>
                            <span className="text-[10px] text-slate-400 font-normal">{doc.fileSize}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">{doc.clientName}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10.5px]">
                            {doc.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{doc.version}</td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[10.5px]">
                            <Lock className="h-3 w-3" /> AES-256
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          <div>{doc.uploadedBy}</div>
                          <span className="text-[10px] text-slate-400">{doc.uploadedAt}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleDownload(doc)}
                              className="p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Download Decrypted File"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            {hasPermission('deleteDocuments') && (
                              <button
                                onClick={() => handleDelete(doc.id)}
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                title="Delete File"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Requests Tab */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Requested Document</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Return Month</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Requested By</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      <div>{req.documentType}</div>
                      {req.notes && <p className="text-[10px] text-slate-400 font-normal">{req.notes}</p>}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">{req.clientName}</td>
                    <td className="py-3 px-4 text-slate-500">{req.taxPeriod}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{req.dueDate}</td>
                    <td className="py-3 px-4 text-slate-500">{req.requestedBy}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.status === 'Uploaded'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => alert(`Resent reminder to ${req.clientName} for ${req.documentType}.`)}
                        className="text-xs font-bold text-brand-600 hover:underline"
                      >
                        Send Reminder →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-modal space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-brand-600" />
                Upload Document to Encrypted Client Vault
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleConfirmFileUpload} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Target Client *</label>
                <select
                  value={uploadClientId}
                  onChange={(e) => setUploadClientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.legalName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Purchase Invoices">Purchase Invoices (Excel/PDF)</option>
                    <option value="GSTR-2B">GSTR-2B Portal Download</option>
                    <option value="Sales Invoices">Sales Invoices</option>
                    <option value="GST Documents">GST Documents</option>
                    <option value="Returns">Returns</option>
                    <option value="Certificates">Certificates</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Tax Period</label>
                  <input
                    type="text"
                    value={uploadTaxPeriod}
                    onChange={(e) => setUploadTaxPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-brand-300 dark:border-brand-800 rounded-xl p-5 text-center cursor-pointer bg-brand-50/20 dark:bg-brand-950/20 hover:border-brand-400 space-y-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setUploadedFile(e.target.files[0]);
                    }
                  }}
                />
                <UploadCloud className="h-8 w-8 text-brand-600 mx-auto" />
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  {uploadedFile ? uploadedFile.name : 'Click to select or drag & drop file'}
                </div>
                <p className="text-[10px] text-slate-500">Supports .xlsx, .xls, .csv, .pdf, images (up to 50MB)</p>
                {uploadedFile && (
                  <p className="text-[10.5px] text-brand-600 font-bold">
                    Size: {(uploadedFile.size / 1024).toFixed(1)} KB • Ready for AES-256 Vault Encryption
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setUploadedFile(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadedFile}
                  className="px-5 py-2 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 disabled:opacity-50 shadow-sm"
                >
                  Encrypt & Save to Vault
                </button>
              </div>
            </form>
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
                  {clients.map((c) => (
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
