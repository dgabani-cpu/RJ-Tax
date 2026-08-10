'use client';

import React, { useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  Users,
  Search,
  Plus,
  Filter,
  Building,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Eye,
  Edit,
  UserCheck,
  Download,
  FileSpreadsheet,
  UploadCloud,
  Trash2,
  Loader2,
  Check,
  X,
  Sparkles,
  Info,
} from 'lucide-react';
import { INITIAL_CLIENTS, INITIAL_USERS } from '@/lib/db/mockDb';
import { Client, EntityType, FilingFrequency, GSTRegistrationType, ClientCategory } from '@/types';
import { clientService, ClientImportResult } from '@/services/clientService';

function ClientsContent() {
  const searchParams = useSearchParams();
  const initialAction = searchParams.get('action');

  const { user, hasPermission, logAuditAction } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterFrequency, setFilterFrequency] = useState<string>('ALL');
  const [filterStaff, setFilterStaff] = useState<string>('ALL');
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(initialAction === 'new');
  const [isImportModalOpen, setIsImportModalOpen] = useState(initialAction === 'import');
  
  // Real File Upload & Import States
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [importResult, setImportResult] = useState<ClientImportResult | null>(null);
  const [previewImportClients, setPreviewImportClients] = useState<Client[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load and subscribe to persistent client storage
  React.useEffect(() => {
    setClients(clientService.getClients());

    const handleClientsUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setClients(e.detail);
      } else {
        setClients(clientService.getClients());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'tax_nexus_clients_v2') {
        setClients(clientService.getClients());
      }
    };

    window.addEventListener('taxnexus:clients-updated' as any, handleClientsUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('taxnexus:clients-updated' as any, handleClientsUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Handle Real File Selection
  const handleProcessFile = async (file: File) => {
    if (!file) return;
    setImportFile(file);
    setIsParsing(true);
    try {
      const result = await clientService.parseClientImportFile(file, clients);
      setImportResult(result);
      setPreviewImportClients(result.parsedClients);
    } catch (err: any) {
      console.error('Error processing client file:', err);
      setImportResult({
        totalRows: 0,
        validCount: 0,
        warningCount: 0,
        errorCount: 1,
        parsedClients: [],
        rowDetails: [],
        errors: [err?.message || 'Failed to parse file. Please verify the format.'],
      });
    } finally {
      setIsParsing(false);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleProcessFile(file);
    }
  };

  const handleSimulateExcelParse = () => {
    setIsParsing(true);
    setTimeout(() => {
      const sampleBatch: Client[] = [
        {
          id: `client-${Date.now()}-1`,
          clientId: `TN-2026-0${clients.length + 1}`,
          legalName: 'Gujarat Alkali & Chemicals Ltd',
          tradeName: 'GACL Chemicals',
          businessName: 'GACL Chemicals',
          entityType: 'Public Limited Company',
          pan: 'AAACG1234F',
          gstin: '24AAACG1234F1ZP',
          phone: '+91 98250 88776',
          email: 'accounts@gacl.co.in',
          businessAddress: 'GIDC Nandesari, Vadodara, Gujarat 391340',
          registeredAddress: 'GIDC Nandesari, Vadodara, Gujarat 391340',
          billingAddress: 'GIDC Nandesari, Vadodara, Gujarat 391340',
          authorizedPerson: {
            name: 'Mukesh Patel',
            designation: 'VP Finance',
            phone: '+91 98250 88776',
            email: 'mukesh.patel@gacl.co.in',
          },
          category: 'Enterprise (Category A)',
          industry: 'Chemical Manufacturing',
          gstRegType: 'Regular',
          filingFrequency: 'Monthly',
          returnType: 'GSTR-1, GSTR-3B',
          dueDates: { gstr1: '11th of month', gstr3b: '20th of month', reconciliation: '14th of month' },
          assignedStaff: [{ staffId: 'usr-1', staffName: 'Neel Gabani', staffRole: 'Managing Partner', staffEmail: 'admin@taxnexus.io', assignmentType: 'PRIMARY', assignedAt: '2026-08-09' }],
          status: 'ACTIVE',
          createdAt: '2026-08-09',
          updatedAt: '2026-08-09',
        },
        {
          id: `client-${Date.now()}-2`,
          clientId: `TN-2026-0${clients.length + 2}`,
          legalName: 'Torrent Logistics & Cold Storage LLP',
          tradeName: 'Torrent Logistics',
          businessName: 'Torrent Logistics',
          entityType: 'Limited Liability Partnership (LLP)',
          pan: 'AAACT5678K',
          gstin: '24AAACT5678K1ZQ',
          phone: '+91 97129 44332',
          email: 'taxation@torrentlogistics.com',
          businessAddress: 'Changodar Industrial Zone, Ahmedabad, Gujarat 382213',
          registeredAddress: 'Changodar Industrial Zone, Ahmedabad, Gujarat 382213',
          billingAddress: 'Changodar Industrial Zone, Ahmedabad, Gujarat 382213',
          authorizedPerson: {
            name: 'Nitin Shah',
            designation: 'Designated Partner',
            phone: '+91 97129 44332',
            email: 'nitin@torrentlogistics.com',
          },
          category: 'Standard (Category B)',
          industry: 'Logistics & Cold Storage',
          gstRegType: 'Regular',
          filingFrequency: 'Monthly',
          returnType: 'GSTR-1, GSTR-3B',
          dueDates: { gstr1: '11th of month', gstr3b: '20th of month', reconciliation: '14th of month' },
          assignedStaff: [{ staffId: 'usr-2', staffName: 'Sneha Patel', staffRole: 'Manager', staffEmail: 'sneha.patel@taxnexus.io', assignmentType: 'PRIMARY', assignedAt: '2026-08-09' }],
          status: 'ACTIVE',
          createdAt: '2026-08-09',
          updatedAt: '2026-08-09',
        },
        {
          id: `client-${Date.now()}-3`,
          clientId: `TN-2026-0${clients.length + 3}`,
          legalName: 'Apex Digital Solutions Proprietary Concern',
          tradeName: 'Apex Tech Labs',
          businessName: 'Apex Tech Labs',
          entityType: 'Sole Proprietorship',
          pan: 'BPWPA9876Q',
          gstin: '24BPWPA9876Q1Z2',
          phone: '+91 98980 12345',
          email: 'pooja@apextechlabs.io',
          businessAddress: '402 Synergy Tower, SG Highway, Ahmedabad 380054',
          registeredAddress: '402 Synergy Tower, SG Highway, Ahmedabad 380054',
          billingAddress: '402 Synergy Tower, SG Highway, Ahmedabad 380054',
          authorizedPerson: {
            name: 'Pooja Sharma',
            designation: 'Proprietor',
            phone: '+91 98980 12345',
            email: 'pooja@apextechlabs.io',
          },
          category: 'Startup / SME (Category C)',
          industry: 'IT & Software Services',
          gstRegType: 'Regular',
          filingFrequency: 'Quarterly (QRMP)',
          returnType: 'IFF, GSTR-3B (QRMP)',
          dueDates: { gstr1: '13th of quarter end', gstr3b: '20th of month', reconciliation: '14th of month' },
          assignedStaff: [{ staffId: 'usr-3', staffName: 'Amit Verma', staffRole: 'Senior Associate', staffEmail: 'amit.verma@taxnexus.io', assignmentType: 'PRIMARY', assignedAt: '2026-08-09' }],
          status: 'ACTIVE',
          createdAt: '2026-08-09',
          updatedAt: '2026-08-09',
        },
      ];

      setImportResult({
        totalRows: sampleBatch.length,
        validCount: sampleBatch.length,
        warningCount: 0,
        errorCount: 0,
        parsedClients: sampleBatch,
        rowDetails: sampleBatch.map((c, idx) => ({
          client: c,
          rowNumber: idx + 2,
          status: 'VALID',
          messages: [],
          rawRow: { 'Legal Name': c.legalName, GSTIN: c.gstin },
        })),
        errors: [],
      });
      setPreviewImportClients(sampleBatch);
      setIsParsing(false);
    }, 400);
  };

  const handleConfirmImport = () => {
    if (previewImportClients.length === 0) return;
    const updated = clientService.addClients(previewImportClients);
    setClients(updated);
    logAuditAction(
      'Bulk Clients Imported via Excel',
      'CLIENT',
      importFile ? importFile.name : 'Excel / CSV Register',
      `Imported ${previewImportClients.length} clients into TaxNexus database.`
    );
    setNotification({
      type: 'success',
      message: `🎉 Successfully imported ${previewImportClients.length} clients into practice directory!`,
    });
    setPreviewImportClients([]);
    setImportResult(null);
    setImportFile(null);
    setIsImportModalOpen(false);
    setTimeout(() => setNotification(null), 5000);
  };

  // Reset import state
  const handleResetImport = () => {
    setImportFile(null);
    setImportResult(null);
    setPreviewImportClients([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // New Client Form State
  const [newClientForm, setNewClientForm] = useState({
    legalName: '',
    tradeName: '',
    entityType: 'Private Limited Company' as EntityType,
    pan: '',
    gstin: '',
    cin: '',
    tan: '',
    udyamNumber: '',
    phone: '',
    email: '',
    businessAddress: '',
    registeredAddress: '',
    authPersonName: '',
    authPersonDesignation: 'Director',
    authPersonPhone: '',
    authPersonEmail: '',
    category: 'Enterprise (Category A)' as ClientCategory,
    industry: 'Manufacturing & Engineering',
    gstRegType: 'Regular' as GSTRegistrationType,
    filingFrequency: 'Monthly' as FilingFrequency,
    assignedStaffId: 'usr-3',
  });

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.legalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tradeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.gstin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.pan.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === 'ALL' || c.category.includes(filterCategory);
    const matchesFrequency = filterFrequency === 'ALL' || c.filingFrequency.includes(filterFrequency);
    const matchesStaff =
      filterStaff === 'ALL' || c.assignedStaff.some((s) => s.staffId === filterStaff);

    return matchesSearch && matchesCategory && matchesFrequency && matchesStaff;
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedStaffObj = INITIAL_USERS.find((u) => u.id === newClientForm.assignedStaffId) || INITIAL_USERS[2];

    const createdClient: Client = {
      id: `client-${Date.now()}`,
      clientId: `RJT-2026-${String(clients.length + 1).padStart(3, '0')}`,
      legalName: newClientForm.legalName,
      tradeName: newClientForm.tradeName || newClientForm.legalName,
      businessName: newClientForm.tradeName || newClientForm.legalName,
      entityType: newClientForm.entityType,
      pan: newClientForm.pan.toUpperCase(),
      gstin: newClientForm.gstin.toUpperCase(),
      cin: newClientForm.cin || undefined,
      tan: newClientForm.tan || undefined,
      udyamNumber: newClientForm.udyamNumber || undefined,
      phone: newClientForm.phone,
      email: newClientForm.email,
      businessAddress: newClientForm.businessAddress,
      registeredAddress: newClientForm.registeredAddress || newClientForm.businessAddress,
      billingAddress: newClientForm.businessAddress,
      authorizedPerson: {
        name: newClientForm.authPersonName,
        designation: newClientForm.authPersonDesignation,
        phone: newClientForm.authPersonPhone,
        email: newClientForm.authPersonEmail,
      },
      category: newClientForm.category,
      industry: newClientForm.industry,
      gstRegType: newClientForm.gstRegType,
      filingFrequency: newClientForm.filingFrequency,
      returnType: newClientForm.filingFrequency === 'Monthly' ? 'GSTR-1, GSTR-3B' : 'IFF, GSTR-3B (QRMP)',
      dueDates: {
        gstr1: '11th of month',
        gstr3b: '20th of month',
        reconciliation: '14th of month',
      },
      assignedStaff: [
        {
          staffId: assignedStaffObj.id,
          staffName: assignedStaffObj.name,
          staffRole: assignedStaffObj.designation || 'Associate',
          staffEmail: assignedStaffObj.email,
          assignmentType: 'PRIMARY',
          assignedAt: new Date().toISOString().split('T')[0],
        },
      ],
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const updated = clientService.addClient(createdClient);
    setClients(updated);
    setIsNewClientModalOpen(false);
    logAuditAction('Client Profile Created', 'CLIENT', createdClient.legalName, `Registered GSTIN: ${createdClient.gstin}`);
    setNotification({
      type: 'success',
      message: `Client ${createdClient.legalName} registered successfully!`,
    });
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in slide-in-from-top-2 duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:opacity-75">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Building className="h-6 w-6 text-brand-600" />
            Client Directory & Practice Profiles
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage legal entities, GSTIN profiles, multi-staff assignments, and compliance frequencies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Clients Button */}
          <div className="relative group">
            <button
              onClick={() => {
                clientService.exportClientsToCSV(clients, 'xlsx');
                logAuditAction('Clients Directory Exported', 'CLIENT', 'All Practice Clients', `Exported ${clients.length} client profiles to Excel`);
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs font-bold transition-all shadow-xs"
              title="Export full client list to native Excel (.xlsx)"
            >
              <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Export (.xlsx)</span>
            </button>
          </div>

          {/* Import Bulk Clients Button */}
          {hasPermission('addClients') && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/80 hover:bg-purple-100 text-purple-700 dark:text-purple-300 px-3.5 py-2 text-xs font-bold transition-all shadow-xs"
              title="Bulk import clients from Excel / CSV register"
            >
              <FileSpreadsheet className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span>Import Bulk Clients</span>
            </button>
          )}

          {hasPermission('addClients') && (
            <button
              onClick={() => setIsNewClientModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-xs font-bold shadow-sm shadow-brand-500/25 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Register Client</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by legal name, trade name, 15-digit GSTIN, or PAN..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="ALL">All Categories</option>
          <option value="Category A">Enterprise (Category A)</option>
          <option value="Category B">Standard (Category B)</option>
          <option value="Category C">Startup / SME (Category C)</option>
        </select>

        {/* Filing Frequency Filter */}
        <select
          value={filterFrequency}
          onChange={(e) => setFilterFrequency(e.target.value)}
          className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="ALL">All Filing Frequencies</option>
          <option value="Monthly">Monthly Regular</option>
          <option value="QRMP">Quarterly (QRMP)</option>
        </select>

        {/* Staff Assignee Filter */}
        <select
          value={filterStaff}
          onChange={(e) => setFilterStaff(e.target.value)}
          className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="ALL">All Staff Members</option>
          {INITIAL_USERS.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role})
            </option>
          ))}
        </select>
      </div>

      {/* Clients Table Grid */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10.5px]">
              <tr>
                <th className="py-3 px-4">Client ID & Legal Name</th>
                <th className="py-3 px-4">Client Health</th>
                <th className="py-3 px-4">GSTIN / PAN</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Filing Scheme</th>
                <th className="py-3 px-4">Authorized Person</th>
                <th className="py-3 px-4">Assigned Staff</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Building className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Practice Clients Found</p>
                    <p className="text-xs text-slate-400 mt-1">Get started by onboarding your first client or importing an Excel register.</p>
                    <div className="flex justify-center gap-2 mt-4">
                      <button
                        onClick={() => setIsNewClientModalOpen(true)}
                        className="px-3.5 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 shadow-sm"
                      >
                        + Add Practice Client
                      </button>
                      <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-3.5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 shadow-sm"
                      >
                        Import Bulk Excel
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((c) => {
                  const health = clientService.getClientHealth(c);
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/clients/${c.id}`}
                          className="font-bold text-slate-900 dark:text-white hover:text-brand-600 transition-colors block"
                        >
                          {c.legalName}
                        </Link>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span className="font-mono">{c.clientId}</span>
                          <span>•</span>
                          <span>{c.tradeName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            health.status === 'Healthy'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : health.status === 'Needs Attention'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          <span>{health.status}</span>
                        </span>
                        <p className="text-[9.5px] text-slate-400 mt-0.5">{health.reasons[0] || '100% Compliant'}</p>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{c.gstin}</div>
                        <div className="text-[10.5px] text-slate-400 font-mono">PAN: {c.pan}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{c.entityType}</span>
                        <div className="text-[10px] text-slate-400">{c.industry}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                          {c.filingFrequency}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{c.returnType}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{c.authorizedPerson?.name || 'Contact'}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {c.authorizedPerson?.phone || 'N/A'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {c.assignedStaff?.map((s, idx) => (
                            <span
                              key={idx}
                              className="inline-block mr-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300"
                            >
                              {s.staffName}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/clients/${c.id}`}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-brand-600 hover:border-brand-500 bg-white dark:bg-slate-800 transition-colors"
                            title="Open 360° Client Profile"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/reconciliation?clientId=${c.id}`}
                            className="px-2 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800 text-[10px] font-bold text-brand-700 dark:text-brand-300 hover:bg-brand-100"
                            title="Run GSTR-2B Reconciliation"
                          >
                            2B Recon
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register New Client Modal */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Register New Client Profile
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter complete tax entity parameters and assign practice staff
                </p>
              </div>
              <button
                onClick={() => setIsNewClientModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="mt-4 space-y-4">
              {/* Section 1: Basic Information */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">
                  1. Business & Tax Identity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Legal Name of Business *
                    </label>
                    <input
                      type="text"
                      required
                      value={newClientForm.legalName}
                      onChange={(e) => setNewClientForm({ ...newClientForm, legalName: e.target.value })}
                      placeholder="e.g. Apex Infra Projects Pvt Ltd"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Trade Name / Brand Name
                    </label>
                    <input
                      type="text"
                      value={newClientForm.tradeName}
                      onChange={(e) => setNewClientForm({ ...newClientForm, tradeName: e.target.value })}
                      placeholder="e.g. Apex Infra"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      GSTIN (15-Digit) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={15}
                      value={newClientForm.gstin}
                      onChange={(e) => setNewClientForm({ ...newClientForm, gstin: e.target.value.toUpperCase() })}
                      placeholder="e.g. 24AABCA1234F1Z5"
                      className="w-full px-3 py-1.5 text-xs font-mono uppercase rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      PAN (10-Digit) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={newClientForm.pan}
                      onChange={(e) => setNewClientForm({ ...newClientForm, pan: e.target.value.toUpperCase() })}
                      placeholder="e.g. AABCA1234F"
                      className="w-full px-3 py-1.5 text-xs font-mono uppercase rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Entity Constitution
                    </label>
                    <select
                      value={newClientForm.entityType}
                      onChange={(e) => setNewClientForm({ ...newClientForm, entityType: e.target.value as EntityType })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="Private Limited Company">Private Limited Company</option>
                      <option value="Public Limited Company">Public Limited Company</option>
                      <option value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</option>
                      <option value="Sole Proprietorship">Sole Proprietorship</option>
                      <option value="Partnership Firm">Partnership Firm</option>
                      <option value="Trust / Society / AOP">Trust / Society / AOP</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      GST Filing Scheme
                    </label>
                    <select
                      value={newClientForm.filingFrequency}
                      onChange={(e) => setNewClientForm({ ...newClientForm, filingFrequency: e.target.value as FilingFrequency })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="Monthly">Monthly Regular (GSTR-1 + 3B)</option>
                      <option value="Quarterly (QRMP)">Quarterly (QRMP - IFF + 3B)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Authorized Person */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">
                  2. Authorized Signatory / Director
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newClientForm.authPersonName}
                      onChange={(e) => setNewClientForm({ ...newClientForm, authPersonName: e.target.value })}
                      placeholder="e.g. Virendra Singh"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newClientForm.authPersonPhone}
                      onChange={(e) => setNewClientForm({ ...newClientForm, authPersonPhone: e.target.value })}
                      placeholder="+91 98251 XXXXX"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={newClientForm.authPersonEmail}
                      onChange={(e) => setNewClientForm({ ...newClientForm, authPersonEmail: e.target.value })}
                      placeholder="director@apexinfra.com"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Staff Assignment & Category */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">
                  3. Practice Assignment & Classification
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Primary Assigned Staff *
                    </label>
                    <select
                      value={newClientForm.assignedStaffId}
                      onChange={(e) => setNewClientForm({ ...newClientForm, assignedStaffId: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {INITIAL_USERS.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} — {u.roleTitle} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Client Category
                    </label>
                    <select
                      value={newClientForm.category}
                      onChange={(e) => setNewClientForm({ ...newClientForm, category: e.target.value as ClientCategory })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="Enterprise (Category A)">Enterprise (Category A)</option>
                      <option value="Standard (Category B)">Standard (Category B)</option>
                      <option value="Startup / SME (Category C)">Startup / SME (Category C)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm"
                >
                  Register Client Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Excel/CSV Client Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-modal space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Bulk Import Clients via Excel (.xlsx / .xls) or CSV
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Batch onboard client entities, GSTIN profiles, filing schemes, and staff assignments with automatic validation and PAN extraction.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  handleResetImport();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Template Download Strip */}
            <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <Download className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  Download Practice Import Templates
                </span>
                <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
                  Includes formatted columns with sample GSTINs, entity types, and instructions.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => clientService.downloadSampleImportTemplate('xlsx')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Excel Template (.xlsx)</span>
                </button>
                <button
                  onClick={() => clientService.downloadSampleImportTemplate('csv')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-bold text-xs transition-colors"
                >
                  <span>CSV Template (.csv)</span>
                </button>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleProcessFile(e.target.files[0]);
                }
              }}
              accept=".xlsx,.xls,.csv,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              className="hidden"
            />

            {/* Drag & Drop File Upload Box */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isParsing && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/60 scale-[1.01]'
                  : importFile
                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-purple-400 bg-slate-50/50 dark:bg-slate-850/40'
              }`}
            >
              {isParsing ? (
                <div className="py-6 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Parsing Excel Spreadsheet & Validating GSTINs...
                  </p>
                  <p className="text-[11px] text-slate-500">Auto-extracting PAN, checking duplicates, and mapping columns...</p>
                </div>
              ) : importFile ? (
                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                  <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                      <span>{importFile.name}</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        ({(importFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </h4>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                      File loaded and parsed successfully. Review preview below before saving.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                    >
                      Choose Different File
                    </button>
                    <button
                      type="button"
                      onClick={handleResetImport}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mx-auto h-12 w-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Drop Excel (.xlsx, .xls) or CSV file here, or <span className="text-purple-600 dark:text-purple-400 underline">browse</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Supports standard client registers from Tally, Busy, ClearTax, and custom spreadsheets (up to 500 rows)
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 shadow-sm transition-colors"
                    >
                      Select File to Import
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSimulateExcelParse();
                      }}
                      className="px-4 py-2 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-50 transition-colors"
                    >
                      Load Sample Demo Data
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Parsing Stats & Errors Summary */}
            {importResult && (
              <div className="space-y-3">
                {/* Metrics Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Rows</span>
                    <p className="text-base font-extrabold text-slate-900 dark:text-white">{importResult.totalRows}</p>
                  </div>
                  <div className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Ready to Import</span>
                    <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">{importResult.validCount}</p>
                  </div>
                  <div className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40">
                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Warnings / Auto-Fixed</span>
                    <p className="text-base font-extrabold text-amber-700 dark:text-amber-300">{importResult.warningCount}</p>
                  </div>
                  <div className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40">
                    <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Invalid Rows</span>
                    <p className="text-base font-extrabold text-rose-700 dark:text-rose-300">{importResult.errorCount}</p>
                  </div>
                </div>

                {/* Error messages if any */}
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 space-y-1">
                    {importResult.errors.map((err, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Parsed Preview Table */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Import Records Preview</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        ({importResult.rowDetails.length} rows parsed)
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Auto-extracted PANs & normalized filing frequencies shown
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px] sticky top-0">
                        <tr>
                          <th className="p-2.5">Row / Status</th>
                          <th className="p-2.5">Legal Name & Trade</th>
                          <th className="p-2.5">GSTIN / PAN</th>
                          <th className="p-2.5">Entity Constitution</th>
                          <th className="p-2.5">Scheme & Category</th>
                          <th className="p-2.5">Authorized Contact</th>
                          <th className="p-2.5">Assigned Staff</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {importResult.rowDetails.map((item, idx) => (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                              item.status === 'ERROR' ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                            }`}
                          >
                            <td className="p-2.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10.5px] text-slate-400">#{item.rowNumber}</span>
                                {item.status === 'VALID' && (
                                  <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    <Check className="h-3 w-3" /> Ready
                                  </span>
                                )}
                                {item.status === 'WARNING' && (
                                  <span
                                    title={item.messages.join('; ')}
                                    className="inline-flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  >
                                    <AlertTriangle className="h-3 w-3" /> Warning
                                  </span>
                                )}
                                {item.status === 'ERROR' && (
                                  <span
                                    title={item.messages.join('; ')}
                                    className="inline-flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                  >
                                    <AlertCircle className="h-3 w-3" /> Failed
                                  </span>
                                )}
                              </div>
                              {item.messages.length > 0 && (
                                <p className="text-[9.5px] text-amber-600 dark:text-amber-400 mt-0.5 line-clamp-1 max-w-[140px]" title={item.messages.join(', ')}>
                                  {item.messages[0]}
                                </p>
                              )}
                            </td>
                            <td className="p-2.5">
                              <div className="font-bold text-slate-900 dark:text-white">{item.client.legalName}</div>
                              {item.client.tradeName !== item.client.legalName && (
                                <div className="text-[10px] text-slate-400">{item.client.tradeName}</div>
                              )}
                            </td>
                            <td className="p-2.5">
                              <div className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                {item.client.gstin}
                              </div>
                              <div className="font-mono text-[10px] text-slate-400">
                                PAN: {item.client.pan}
                              </div>
                            </td>
                            <td className="p-2.5">
                              <span className="text-slate-700 dark:text-slate-300">{item.client.entityType}</span>
                              <div className="text-[10px] text-slate-400">{item.client.industry}</div>
                            </td>
                            <td className="p-2.5">
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                                {item.client.filingFrequency}
                              </span>
                              <div className="text-[10px] text-slate-400 mt-0.5">{item.client.category}</div>
                            </td>
                            <td className="p-2.5">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">
                                {item.client.authorizedPerson.name}
                              </div>
                              <div className="text-[10px] text-slate-400">{item.client.authorizedPerson.email}</div>
                            </td>
                            <td className="p-2.5">
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300">
                                {item.client.assignedStaff[0]?.staffName || 'Default Staff'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                {previewImportClients.length > 0 && (
                  <p className="text-xs text-slate-500">
                    <strong className="text-slate-800 dark:text-slate-200">{previewImportClients.length}</strong> valid client entities ready to onboard.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    handleResetImport();
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={previewImportClients.length === 0 || isParsing}
                  onClick={handleConfirmImport}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm disabled:opacity-50 transition-all"
                >
                  <Check className="h-4 w-4" />
                  <span>Import {previewImportClients.length} Clients to Database</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Clients...</div>}>
      <ClientsContent />
    </Suspense>
  );
}
