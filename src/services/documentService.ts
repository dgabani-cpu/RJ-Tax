import { INITIAL_DOCUMENTS } from '@/lib/db/mockDb';
import { DocumentItem } from '@/types';

export interface DocumentRequestItem {
  id: string;
  clientId: string;
  clientName: string;
  financialYear: string;
  taxPeriod: string;
  documentType: 'Purchase Bills' | 'Sales Bills' | 'Bank Statement' | 'Expense Bills' | 'Credit Notes' | 'Debit Notes' | 'Other';
  dueDate: string;
  requestedBy: string;
  status: 'Requested' | 'Pending' | 'Uploaded' | 'Under Review' | 'Verified' | 'Rejected';
  createdAt: string;
  notes?: string;
  isMockData: boolean;
}

export const INITIAL_DOCUMENT_REQUESTS: DocumentRequestItem[] = [
  {
    id: 'req-1',
    clientId: 'client-1',
    clientName: 'Apex Infra Projects Pvt Ltd',
    financialYear: '2026-27',
    taxPeriod: 'July 2026',
    documentType: 'Purchase Bills',
    dueDate: '2026-08-10',
    requestedBy: 'Amit Verma',
    status: 'Pending',
    createdAt: '2026-08-01',
    notes: 'Please upload original PDF purchase invoices for sub-contractor steel supplies.',
    isMockData: true,
  },
  {
    id: 'req-2',
    clientId: 'client-1',
    clientName: 'Apex Infra Projects Pvt Ltd',
    financialYear: '2026-27',
    taxPeriod: 'July 2026',
    documentType: 'Bank Statement',
    dueDate: '2026-08-10',
    requestedBy: 'Pooja Shah',
    status: 'Uploaded',
    createdAt: '2026-08-02',
    notes: 'HDFC Current Account statement required for ITC 180-day payment rule verification.',
    isMockData: true,
  },
  {
    id: 'req-3',
    clientId: 'client-2',
    clientName: 'Nova Medicare Lifesciences LLP',
    financialYear: '2026-27',
    taxPeriod: 'July 2026',
    documentType: 'Expense Bills',
    dueDate: '2026-08-12',
    requestedBy: 'Sneha Patel',
    status: 'Requested',
    createdAt: '2026-08-05',
    notes: 'RCM transport freight receipts for pharma distribution.',
    isMockData: true,
  },
];

export const documentService = {
  getDocuments: async (clientId?: string): Promise<DocumentItem[]> => {
    if (clientId) {
      return INITIAL_DOCUMENTS.filter((d) => d.clientId === clientId);
    }
    return INITIAL_DOCUMENTS;
  },

  getDocumentRequests: async (clientId?: string): Promise<DocumentRequestItem[]> => {
    if (clientId) {
      return INITIAL_DOCUMENT_REQUESTS.filter((r) => r.clientId === clientId);
    }
    return INITIAL_DOCUMENT_REQUESTS;
  },
};
