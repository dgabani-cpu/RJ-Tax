'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  Building,
  ArrowLeft,
  Calendar,
  FileText,
  RefreshCw,
  GitCompare,
  MessageSquare,
  CheckSquare,
  BarChart3,
  UserCheck,
  StickyNote,
  Clock,
  ShieldCheck,
  KeyRound,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Send,
  Plus,
  Download,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import {
  INITIAL_CLIENTS,
  INITIAL_GST_VAULTS,
  INITIAL_RECON_DATA,
  INITIAL_TASKS,
  INITIAL_DOCUMENTS,
  INITIAL_USERS,
  INITIAL_AUDIT_LOGS,
} from '@/lib/db/mockDb';
import { GSTCredentialVault, PurchaseInvoiceRecord, Client } from '@/types';
import { clientService } from '@/services/clientService';
import { reconciliationService } from '@/services/reconciliationService';

type TabKey =
  | 'overview'
  | 'gst'
  | 'documents'
  | 'invoices'
  | 'gstr2b'
  | 'reconciliation'
  | 'communication'
  | 'tasks'
  | 'reports'
  | 'staff'
  | 'notes'
  | 'activity';

export default function ClientProfilePage() {
  const params = useParams();
  const clientId = params.id as string;
  const router = useRouter();
  const { user, logAuditAction } = useAuth();

  const [client, setClient] = useState<Client>(() => {
    return (
      clientService.getClientByIdSync(clientId) || {
        id: clientId,
        clientId: `RJT-2026-001`,
        legalName: 'Practice Client',
        tradeName: 'Practice Client',
        businessName: 'Practice Client',
        entityType: 'Private Limited Company',
        pan: 'AAACG1234F',
        gstin: '24AAACG1234F1ZP',
        phone: '+91 98250 00000',
        email: 'client@taxnexus.io',
        businessAddress: 'Practice City, Gujarat',
        registeredAddress: 'Practice City, Gujarat',
        billingAddress: 'Practice City, Gujarat',
        authorizedPerson: {
          name: 'Authorized Signatory',
          designation: 'Director',
          phone: '+91 98250 00000',
          email: 'signatory@taxnexus.io',
        },
        category: 'Standard (Category B)',
        industry: 'Manufacturing & Services',
        gstRegType: 'Regular',
        filingFrequency: 'Monthly',
        returnType: 'GSTR-1, GSTR-3B',
        dueDates: {
          gstr1: '11th of month',
          gstr3b: '20th of month',
          reconciliation: '14th of month',
        },
        assignedStaff: [
          {
            staffId: 'usr-1',
            staffName: 'Neel Gabani',
            staffRole: 'Super Admin',
            staffEmail: 'admin@taxnexus.io',
            assignmentType: 'PRIMARY',
            assignedAt: '2026-08-09',
          },
        ],
        status: 'ACTIVE',
        createdAt: '2026-08-09',
        updatedAt: '2026-08-09',
      }
    );
  });

  React.useEffect(() => {
    const loaded = clientService.getClientByIdSync(clientId);
    if (loaded) {
      setClient(loaded);
    }

    const handleUpdate = () => {
      const updated = clientService.getClientByIdSync(clientId);
      if (updated) setClient(updated);
    };

    window.addEventListener('taxnexus:clients-updated' as any, handleUpdate);
    return () => window.removeEventListener('taxnexus:clients-updated' as any, handleUpdate);
  }, [clientId]);
  const vault: GSTCredentialVault = INITIAL_GST_VAULTS.find((v) => v.clientId === client.id) || {
    id: 'vault-default',
    clientId: client.id,
    clientName: client.legalName,
    gstin: client.gstin,
    gstUsername: 'GST_PORTAL_USER',
    isPasswordSaved: true,
    integrationStatus: 'CONNECTED',
    connectionMode: 'OFFICIAL_GSP_API',
    lastSuccessfulLogin: '09 Aug 2026, 09:35 AM',
    lastSync: '09 Aug 2026, 09:35 AM',
    syncHistory: [],
  };
  const reconItems = INITIAL_RECON_DATA.filter((r) => r.clientId === client.id);
  const clientTasks = INITIAL_TASKS.filter((t) => t.clientId === client.id);
  const clientDocs = INITIAL_DOCUMENTS.filter((d) => d.clientId === client.id);
  const clientLogs = INITIAL_AUDIT_LOGS.filter((a) => a.clientName?.includes(client.legalName) || a.clientName?.includes(client.tradeName));

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Purchase Bills State & Import
  const [purchaseInvoices, setPurchaseInvoices] = useState<any[]>([
    {
      id: 'pinv-1',
      clientId: client.id,
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
    {
      id: 'pinv-2',
      clientId: client.id,
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
  ]);
  const [isPurchaseImportOpen, setIsPurchaseImportOpen] = useState(false);
  const [previewPurchaseInvoices, setPreviewPurchaseInvoices] = useState<PurchaseInvoiceRecord[]>([]);
  const [purchaseFile, setPurchaseFile] = useState<File | null>(null);
  const [isParsingPurchase, setIsParsingPurchase] = useState(false);
  const [purchaseParseErrors, setPurchaseParseErrors] = useState<string[]>([]);
  const purchaseFileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePurchaseFileSelect = async (file: File) => {
    if (!file) return;
    setPurchaseFile(file);
    setIsParsingPurchase(true);
    setPurchaseParseErrors([]);

    try {
      const res = await reconciliationService.parsePurchaseRegisterFile(file, client.id, 'July 2026', '2026-27');
      if (res.success && res.records.length > 0) {
        setPreviewPurchaseInvoices(res.records);
      } else {
        setPreviewPurchaseInvoices([]);
        setPurchaseParseErrors(res.errors.length > 0 ? res.errors : ['Could not extract purchase invoices.']);
      }
    } catch (err: any) {
      setPurchaseParseErrors([`Failed to read file: ${err.message}`]);
    } finally {
      setIsParsingPurchase(false);
    }
  };

  const handleSimulatePurchaseExcelParse = () => {
    setPreviewPurchaseInvoices([
      {
        id: `pinv-sim-${Date.now()}-1`,
        clientId: client.id,
        financialYear: '2026-27',
        taxPeriod: 'July 2026',
        supplierName: 'Larsen & Toubro Electricals',
        supplierGstin: '24AAACL1234K1ZM',
        invoiceNumber: 'LNT/2026/1029',
        invoiceDate: '22-Jul-2026',
        taxableValue: 340000,
        cgst: 30600,
        sgst: 30600,
        igst: 0,
        cess: 0,
        totalAmount: 401200,
        uploadedAt: new Date().toISOString(),
      },
    ]);
    setPurchaseParseErrors([]);
  };

  const handleConfirmPurchaseImport = () => {
    const updated = [...previewPurchaseInvoices, ...purchaseInvoices];
    setPurchaseInvoices(updated);
    reconciliationService.savePurchaseRecords(previewPurchaseInvoices);

    // Auto-match if 2B records exist
    const gstr2bList = reconciliationService.getGSTR2BRecords(client.id, 'July 2026');
    if (gstr2bList.length > 0) {
      const autoMatched = reconciliationService.matchInvoices(gstr2bList, updated, client.id, 'July 2026', '2026-27');
      reconciliationService.saveReconciliationData(autoMatched);
    }

    logAuditAction(
      'Purchase Register Imported via Excel',
      'DOCUMENT',
      client.legalName,
      `Imported ${previewPurchaseInvoices.length} purchase bills from ${purchaseFile?.name || 'Purchase Register Excel'} into books.`
    );
    setPreviewPurchaseInvoices([]);
    setPurchaseFile(null);
    setIsPurchaseImportOpen(false);
    alert(`Successfully imported ${previewPurchaseInvoices.length} purchase invoices into ${client.legalName}'s purchase register!`);
  };

  const tabs: { key: TabKey; label: string; icon: React.ElementType; badge?: string }[] = [
    { key: 'overview', label: 'Overview', icon: Building },
    { key: 'gst', label: 'GST Vault', icon: KeyRound, badge: vault.integrationStatus === 'CONNECTED' ? 'Active' : 'Auth' },
    { key: 'reconciliation', label: 'AI Reconciliation', icon: GitCompare, badge: `${reconItems.length} Records` },
    { key: 'invoices', label: 'Purchase Bills', icon: FileText },
    { key: 'gstr2b', label: 'GSTR-2B Sync', icon: RefreshCw },
    { key: 'documents', label: 'Documents', icon: UploadCloud, badge: `${clientDocs.length}` },
    { key: 'tasks', label: 'Tasks & SLA', icon: CheckSquare, badge: `${clientTasks.length}` },
    { key: 'communication', label: 'WhatsApp / Email', icon: MessageSquare },
    { key: 'reports', label: 'Summary Reports', icon: BarChart3 },
    { key: 'staff', label: 'Staff Scopes', icon: UserCheck },
    { key: 'notes', label: 'CA Instructions', icon: StickyNote },
    { key: 'activity', label: 'Audit Trail', icon: Clock },
  ];

  const handleSync2B = () => {
    setIsSyncing(true);
    setSyncSuccessMsg(null);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccessMsg('GSTR-2B data for July 2026 retrieved and parsed successfully (42 invoices).');
      logAuditAction('GSTR-2B Manual Sync Triggered', 'GST_SYNC', client.legalName, 'GSP API session active.');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/clients')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {client.legalName}
              </h1>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                {client.gstin}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {client.category}
              </span>
              {(() => {
                const health = clientService.getClientHealth(client);
                return (
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      health.status === 'Healthy'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : health.status === 'Needs Attention'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    Health: {health.status} ({health.score}/100)
                  </span>
                );
              })()}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Client ID: <strong className="text-slate-700 dark:text-slate-300">{client.clientId}</strong> • {client.entityType} • {client.industry}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSync2B}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm shadow-brand-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Downloading 2B...' : 'Download GSTR-2B'}</span>
          </button>

          <Link
            href={`/reconciliation?clientId=${client.id}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold hover:bg-purple-100"
          >
            <GitCompare className="h-3.5 w-3.5" />
            <span>Run Reconciliation</span>
          </Link>
        </div>
      </div>

      {syncSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{syncSuccessMsg}</span>
          </div>
          <button onClick={() => setSyncSuccessMsg(null)} className="text-emerald-600 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* 12-Tab Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle p-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Panels */}
      <div className="space-y-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Tax & Business Details */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-subtle">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-4 flex items-center gap-2">
                  <Building className="h-4 w-4" /> Tax & Corporate Identity
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Legal Entity Name</span>
                    <span className="font-bold text-slate-900 dark:text-white">{client.legalName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Trade Name</span>
                    <span className="font-bold text-slate-900 dark:text-white">{client.tradeName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">GSTIN (15-Digit)</span>
                    <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{client.gstin}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Income Tax PAN</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{client.pan}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Corporate CIN</span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{client.cin || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tax Deduction TAN</span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{client.tan || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">MSME Udyam Number</span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{client.udyamNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">GST Registration Type</span>
                    <span className="font-bold text-slate-900 dark:text-white">{client.gstRegType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Filing Frequency</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{client.filingFrequency}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-subtle">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Registered & Operational Addresses
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Principal Place of Business</span>
                    <p className="text-slate-800 dark:text-slate-200 mt-0.5">{client.businessAddress}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Registered Corporate Address</span>
                    <p className="text-slate-800 dark:text-slate-200 mt-0.5">{client.registeredAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Authorized Signatory & Assigned Staff */}
            <div className="space-y-6">
              {/* Authorized Signatory */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-subtle">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-3 flex items-center gap-2">
                  <UserCheck className="h-4 w-4" /> Authorized Signatory
                </h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Name & Designation</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {client.authorizedPerson.name} ({client.authorizedPerson.designation})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Mobile Phone</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" /> {client.authorizedPerson.phone}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email Address</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" /> {client.authorizedPerson.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assigned Staff Matrix */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-subtle">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 flex items-center gap-2">
                    <UserCheck className="h-4 w-4" /> Assigned Staff
                  </h3>
                  <button
                    onClick={() => setActiveTab('staff')}
                    className="text-[11px] font-semibold text-brand-600 hover:underline"
                  >
                    Manage
                  </button>
                </div>
                <div className="space-y-2">
                  {client.assignedStaff.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{s.staffName}</div>
                        <div className="text-[10px] text-slate-400">{s.staffRole}</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                        {s.assignmentType}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GST CREDENTIAL VAULT */}
        {activeTab === 'gst' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-subtle space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-brand-600" />
                  Encrypted GST Portal Integration Vault
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Credentials encrypted with AES-256-GCM. 0-bypass compliant session tokens.
                </p>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Connected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <span className="text-slate-400 block text-[11px]">GST Portal Username</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white mt-1 block">{vault.gstUsername}</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <span className="text-slate-400 block text-[11px]">Integration Mode</span>
                <span className="font-bold text-brand-600 dark:text-brand-400 mt-1 block">Official GSP / ASP API</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <span className="text-slate-400 block text-[11px]">Last Sync Timestamp</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 mt-1 block">{vault.lastSync}</span>
              </div>
            </div>

            {/* Sync History */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                GSTR-2B Sync & Automation History
              </h4>
              <div className="space-y-2">
                {vault.syncHistory.map((sync) => (
                  <div
                    key={sync.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">Tax Period: {sync.period}</span>
                      <span className="text-slate-400 ml-2">• {sync.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        {sync.downloadedRecordsCount} Invoices Processed
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {sync.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: PURCHASE BILLS & IMPORT */}
        {activeTab === 'invoices' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-brand-600" />
                  Client Purchase Register & Inward Invoices (Books)
                </h3>
                <p className="text-xs text-slate-500">
                  {purchaseInvoices.length} Purchase Invoices recorded in client accounting books for July 2026.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPurchaseImportOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Import Purchase Register Excel</span>
                </button>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Supplier Name & GSTIN</th>
                    <th className="py-2.5 px-3">Invoice Number</th>
                    <th className="py-2.5 px-3">Invoice Date</th>
                    <th className="py-2.5 px-3">Taxable Value</th>
                    <th className="py-2.5 px-3">Tax Breakdown (CGST/SGST/IGST)</th>
                    <th className="py-2.5 px-3">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {purchaseInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{inv.supplierName}</div>
                        <div className="font-mono text-[10.5px] text-slate-400">GSTIN: {inv.supplierGstin}</div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold">{inv.invoiceNumber}</td>
                      <td className="py-2.5 px-3 text-slate-500">{inv.invoiceDate}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">₹{inv.taxableValue.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        CGST: ₹{inv.cgst.toLocaleString('en-IN')} | SGST: ₹{inv.sgst.toLocaleString('en-IN')} | IGST: ₹{inv.igst.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: RECONCILIATION */}
        {activeTab === 'reconciliation' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GitCompare className="h-4 w-4 text-purple-600" />
                  13-Category Reconciliation Results — July 2026
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  AI-assisted matching comparing Purchase Invoices against GSTR-2B data
                </p>
              </div>
              <Link
                href={`/reconciliation?clientId=${client.id}`}
                className="px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors"
              >
                Launch Interactive Reconciliation Hub
              </Link>
            </div>

            <div className="space-y-3">
              {reconItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-2 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {item.purchaseInvoice?.supplierName || item.gstr2bRecord?.supplierName}
                      </span>
                      <span className="text-slate-400 text-xs ml-2">
                        GSTIN: {item.purchaseInvoice?.supplierGstin || item.gstr2bRecord?.supplierGstin}
                      </span>
                    </div>
                    <span className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                      {item.categoryLabel}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white">AI Explainer: </strong>
                      {item.aiExplanation}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-medium">
                      Invoice No: <strong>{item.purchaseInvoice?.invoiceNumber || item.gstr2bRecord?.invoiceNumber}</strong> • Taxable: ₹
                      {(item.purchaseInvoice?.taxableValue || item.gstr2bRecord?.taxableValue || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-brand-600 dark:text-brand-400 font-bold">
                      Recommendation: {item.suggestedAction}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: TASKS */}
        {activeTab === 'tasks' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Tasks & SLAs</h3>
              <Link href="/tasks" className="text-xs font-bold text-brand-600 hover:underline">
                View Kanban Board
              </Link>
            </div>

            <div className="space-y-2">
              {clientTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{t.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Assigned: {t.assignedStaffName} • Due: {t.dueDate}
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

        {/* TAB 5: DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Client Document Vault</h3>
              <Link href="/documents" className="text-xs font-bold text-brand-600 hover:underline">
                All Vault Files
              </Link>
            </div>

            <div className="space-y-2">
              {clientDocs.map((d) => (
                <div
                  key={d.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-brand-600" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{d.fileName}</p>
                      <p className="text-[10.5px] text-slate-400">
                        {d.category} • {d.fileSize} • Uploaded by {d.uploadedBy}
                      </p>
                    </div>
                  </div>
                  <button className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-brand-600 font-semibold flex items-center gap-1 text-[11px]">
                    <Download className="h-3 w-3" /> Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: CA NOTES & INSTRUCTIONS */}
        {activeTab === 'notes' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Practice Instructions & Audit Notes</h3>
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <strong className="block mb-1 font-bold">Important Filing Instructions:</strong>
              {client.importantInstructions || 'No custom instructions set for this client.'}
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
              <strong className="block mb-1 font-bold">General Practice Notes:</strong>
              {client.notes || 'Sub-contractor TDS 194C and Section 16(2)(aa) 2B reconciliation are high priority.'}
            </div>
          </div>
        )}

        {/* TAB 7: ACTIVITY & AUDIT TRAIL */}
        {activeTab === 'activity' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-subtle space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Client Activity Trail & Audit Records
            </h3>
            <div className="space-y-2">
              {clientLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{log.action}</span>
                    <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Triggered by: <strong>{log.userName}</strong> ({log.userRole}) • {log.details}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Import Purchase Register Excel Modal */}
      {isPurchaseImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-modal space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Import Purchase Register Excel (Tally / Zoho / Excel)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload outward vendor purchase bills for {client.legalName} into accounting books.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsPurchaseImportOpen(false);
                  setPreviewPurchaseInvoices([]);
                }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Drag & Drop Real Upload Box */}
            <div
              onClick={() => purchaseFileInputRef.current?.click()}
              className="border-2 border-dashed border-purple-300 dark:border-purple-800 rounded-2xl p-6 text-center space-y-3 bg-purple-50/20 dark:bg-purple-950/20 hover:border-purple-400 cursor-pointer"
            >
              <input
                ref={purchaseFileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handlePurchaseFileSelect(e.target.files[0]);
                  }
                }}
              />

              {isParsingPurchase ? (
                <RefreshCw className="h-10 w-10 text-purple-600 animate-spin mx-auto" />
              ) : (
                <UploadCloud className="h-10 w-10 text-purple-600 mx-auto animate-bounce" />
              )}

              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {purchaseFile ? purchaseFile.name : 'Upload Purchase Register Spreadsheet (.xlsx, .xls, .csv)'}
                </h4>
                <p className="text-[11px] text-slate-500">Supports Tally XML/Excel, Zoho CSV, and standard Excel registers</p>
                {purchaseFile && (
                  <p className="text-[10px] text-purple-600 font-bold mt-1">
                    Size: {(purchaseFile.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => purchaseFileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 shadow-sm flex items-center gap-1"
                >
                  <UploadCloud className="h-3.5 w-3.5" /> Browse Excel File
                </button>

                <button
                  type="button"
                  onClick={handleSimulatePurchaseExcelParse}
                  className="px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-50"
                >
                  Load Sample Bills
                </button>

                <button
                  type="button"
                  onClick={() => reconciliationService.downloadSamplePurchaseRegisterTemplate()}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 flex items-center gap-1"
                >
                  <Download className="h-3 w-3" /> Template (.xlsx)
                </button>
              </div>
            </div>

            {/* Error message */}
            {purchaseParseErrors.length > 0 && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs">
                <div className="font-bold mb-1">Upload Error:</div>
                {purchaseParseErrors.map((err, i) => (
                  <p key={i} className="text-[11px]">• {err}</p>
                ))}
              </div>
            )}

            {/* Parsed Preview Table */}
            {previewPurchaseInvoices.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Parsed Invoices ({previewPurchaseInvoices.length} Bills Ready)
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                    ✓ Ready for Import
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto max-h-52">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="p-2.5">Supplier Name</th>
                        <th className="p-2.5">Supplier GSTIN</th>
                        <th className="p-2.5">Inv No</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5 text-right">Taxable</th>
                        <th className="p-2.5 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {previewPurchaseInvoices.map((inv, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-bold text-slate-900 dark:text-white max-w-[140px] truncate">{inv.supplierName}</td>
                          <td className="p-2.5 font-mono text-[11px]">{inv.supplierGstin}</td>
                          <td className="p-2.5 font-mono">{inv.invoiceNumber}</td>
                          <td className="p-2.5 text-slate-500">{inv.invoiceDate}</td>
                          <td className="p-2.5 font-mono text-right">₹{inv.taxableValue.toLocaleString('en-IN')}</td>
                          <td className="p-2.5 font-mono font-bold text-emerald-600 text-right">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
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
                  setIsPurchaseImportOpen(false);
                  setPreviewPurchaseInvoices([]);
                  setPurchaseFile(null);
                  setPurchaseParseErrors([]);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={previewPurchaseInvoices.length === 0}
                onClick={handleConfirmPurchaseImport}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm disabled:opacity-50"
              >
                Import {previewPurchaseInvoices.length} Bills into Books
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
