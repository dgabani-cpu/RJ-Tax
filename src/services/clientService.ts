import { INITIAL_CLIENTS, INITIAL_TASKS, INITIAL_RECON_DATA, INITIAL_DOCUMENTS } from '@/lib/db/mockDb';
import { Client, ClientCategory, Task, ReconciliationItem, DocumentItem } from '@/types';

export interface ClientHealthStatus {
  status: 'Healthy' | 'Needs Attention' | 'Critical';
  score: number; // 0 - 100
  reasons: string[];
  pendingDocsCount: number;
  reconDiscrepanciesCount: number;
  overdueTasksCount: number;
}

export interface ClientTimelineEvent {
  id: string;
  clientId: string;
  title: string;
  description: string;
  type: 'REGISTRATION' | 'STAFF_ASSIGNMENT' | 'DOCUMENT_UPLOAD' | 'GSTR2B_SYNC' | 'RECONCILIATION' | 'TASK_CREATED' | 'TASK_COMPLETED' | 'COMMUNICATION';
  actorName: string;
  timestamp: string;
  isMockData: boolean;
}

export const clientService = {
  // Fetch all clients
  getAllClients: async (): Promise<Client[]> => {
    return INITIAL_CLIENTS;
  },

  // Fetch single client by ID
  getClientById: async (id: string): Promise<Client | undefined> => {
    return INITIAL_CLIENTS.find((c) => c.id === id || c.clientId === id);
  },

  // Calculate client health dynamically based on real items
  getClientHealth: (client: Client): ClientHealthStatus => {
    const clientTasks = INITIAL_TASKS.filter((t) => t.clientId === client.id);
    const clientRecon = INITIAL_RECON_DATA.filter((r) => r.clientId === client.id && r.resolutionStatus === 'PENDING');
    const clientDocs = INITIAL_DOCUMENTS.filter((d) => d.clientId === client.id);

    const overdueTasks = clientTasks.filter((t) => t.status === 'OVERDUE' || (t.dueDate < '2026-08-09' && t.status !== 'COMPLETED'));
    const reconDiscrepancies = clientRecon.length;
    const pendingDocs = Math.max(0, 5 - clientDocs.length); // Assume 5 monthly required docs

    const reasons: string[] = [];
    let score = 100;

    if (reconDiscrepancies > 0) {
      score -= reconDiscrepancies * 8;
      reasons.push(`${reconDiscrepancies} GSTR-2B reconciliation discrepancies pending resolution`);
    }

    if (overdueTasks.length > 0) {
      score -= overdueTasks.length * 15;
      reasons.push(`${overdueTasks.length} practice tasks overdue SLA limit`);
    }

    if (pendingDocs > 0) {
      score -= pendingDocs * 5;
      reasons.push(`${pendingDocs} monthly tax documents pending submission`);
    }

    score = Math.max(10, Math.min(100, score));

    let status: 'Healthy' | 'Needs Attention' | 'Critical' = 'Healthy';
    if (score < 50 || overdueTasks.length >= 2) {
      status = 'Critical';
    } else if (score < 85 || reconDiscrepancies > 0 || pendingDocs > 0) {
      status = 'Needs Attention';
    }

    return {
      status,
      score,
      reasons,
      pendingDocsCount: pendingDocs,
      reconDiscrepanciesCount: reconDiscrepancies,
      overdueTasksCount: overdueTasks.length,
    };
  },

  // Generate client timeline events
  getClientTimeline: (clientId: string): ClientTimelineEvent[] => {
    return [
      {
        id: 'tl-1',
        clientId,
        title: 'July 2026 GSTR-2B Sync Completed',
        description: '42 inward invoice records downloaded from GST portal via GSP connector.',
        type: 'GSTR2B_SYNC',
        actorName: 'GST Auto Worker',
        timestamp: '2026-08-09 09:35 AM',
        isMockData: true,
      },
      {
        id: 'tl-2',
        clientId,
        title: '13-Category AI Reconciliation Executed',
        description: 'Auto-matching engine identified 12 exact matches and 1 missing supplier invoice.',
        type: 'RECONCILIATION',
        actorName: 'TaxNexus AI Engine',
        timestamp: '2026-08-09 09:40 AM',
        isMockData: true,
      },
      {
        id: 'tl-3',
        clientId,
        title: 'Purchase Register Uploaded',
        description: 'Excel purchase file Apex_Purchase_Register_July2026.xlsx uploaded for audit.',
        type: 'DOCUMENT_UPLOAD',
        actorName: 'Amit Verma',
        timestamp: '2026-08-07 03:15 PM',
        isMockData: true,
      },
      {
        id: 'tl-4',
        clientId,
        title: 'Staff Assignment Updated',
        description: 'Pooja Shah assigned as Secondary Accountant reviewer.',
        type: 'STAFF_ASSIGNMENT',
        actorName: 'Neel Gabani',
        timestamp: '2026-02-15 11:30 AM',
        isMockData: true,
      },
      {
        id: 'tl-5',
        clientId,
        title: 'Client Profile Onboarded',
        description: 'Registered under Category A Enterprise scheme.',
        type: 'REGISTRATION',
        actorName: 'Neel Gabani',
        timestamp: '2025-04-01 10:00 AM',
        isMockData: true,
      },
    ];
  },

  // Export Clients List to CSV / Excel
  exportClientsToCSV: (clients: Client[]) => {
    const headers = [
      'Client ID',
      'Legal Name',
      'Trade Name',
      'GSTIN',
      'PAN',
      'Entity Type',
      'Category',
      'Filing Frequency',
      'GST Reg Type',
      'Authorized Person',
      'Email',
      'Phone',
      'Status',
      'Health Status',
    ];

    const rows = clients.map((c) => {
      const health = clientService.getClientHealth(c);
      return [
        `"${c.clientId}"`,
        `"${c.legalName}"`,
        `"${c.tradeName}"`,
        `"${c.gstin}"`,
        `"${c.pan}"`,
        `"${c.entityType}"`,
        `"${c.category}"`,
        `"${c.filingFrequency}"`,
        `"${c.gstRegType}"`,
        `"${c.authorizedPerson.name}"`,
        `"${c.authorizedPerson.email}"`,
        `"${c.authorizedPerson.phone}"`,
        `"${c.status}"`,
        `"${health.status}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TaxNexus_Client_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Download Sample Excel/CSV Import Template
  downloadSampleImportTemplate: () => {
    const headers = [
      'Legal Name',
      'Trade Name',
      'GSTIN',
      'PAN',
      'Entity Type',
      'Category',
      'Filing Frequency',
      'GST Reg Type',
      'Auth Person Name',
      'Auth Person Email',
      'Auth Person Phone',
      'Address',
    ];

    const sampleRow = [
      '"Reliance Retail Traders Private Limited"',
      '"Reliance Retail"',
      '"24AAACR1234F1Z8"',
      '"AAACR1234F"',
      '"Private Limited"',
      '"Enterprise A"',
      '"Monthly"',
      '"Regular"',
      '"Rajesh Sharma"',
      '"rajesh@relianceretail.com"',
      '"+91 98250 11223"',
      '"101 CG Road Ahmedabad Gujarat 380009"',
    ].join(',');

    const csvContent = [headers.join(','), sampleRow].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TaxNexus_Clients_Import_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
