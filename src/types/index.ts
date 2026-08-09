export type RoleType =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'CA_SENIOR'
  | 'MANAGER'
  | 'STAFF'
  | 'ACCOUNTANT'
  | 'DATA_ENTRY'
  | 'VIEWER'
  | 'CUSTOM';

export interface PermissionSet {
  viewClients: boolean;
  addClients: boolean;
  editClients: boolean;
  deleteClients: boolean;
  viewGstData: boolean;
  downloadGstReports: boolean;
  uploadDocuments: boolean;
  viewDocuments: boolean;
  deleteDocuments: boolean;
  runReconciliation: boolean;
  sendWhatsApp: boolean;
  sendEmail: boolean;
  scheduleMessages: boolean;
  viewReports: boolean;
  exportReports: boolean;
  manageStaff: boolean;
  assignClients: boolean;
  manageIntegrations: boolean;
  manageSettings: boolean;
  developerAccess: boolean;
  auditLogAccess: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: RoleType;
  roleTitle: string;
  department?: string;
  designation?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  mfaEnabled: boolean;
  avatarUrl?: string;
  assignedClientsCount: number;
  permissions: PermissionSet;
  lastLogin?: string;
  loginHistory?: {
    timestamp: string;
    ip: string;
    device: string;
    location: string;
  }[];
}

export type EntityType =
  | 'Private Limited Company'
  | 'Public Limited Company'
  | 'Limited Liability Partnership (LLP)'
  | 'Sole Proprietorship'
  | 'Partnership Firm'
  | 'Trust / Society / AOP'
  | 'HUF'
  | 'Other';

export type GSTRegistrationType = 'Regular' | 'Composition' | 'SEZ Unit' | 'SEZ Developer' | 'ISD' | 'Casual Taxable Person';
export type FilingFrequency = 'Monthly' | 'Quarterly (QRMP)';
export type ClientCategory = 'Enterprise (Category A)' | 'Standard (Category B)' | 'Startup / SME (Category C)';

export interface ClientStaffAssignment {
  staffId: string;
  staffName: string;
  staffRole: string;
  staffEmail: string;
  assignmentType: 'PRIMARY' | 'SECONDARY' | 'REVIEWER';
  assignedAt: string;
}

export interface Client {
  id: string;
  clientId: string; // e.g. "TN-2026-001"
  legalName: string;
  tradeName: string;
  businessName: string;
  entityType: EntityType;
  pan: string;
  gstin: string;
  cin?: string;
  tan?: string;
  udyamNumber?: string;
  phone: string;
  altPhone?: string;
  email: string;
  website?: string;
  businessAddress: string;
  registeredAddress: string;
  billingAddress: string;
  
  // Authorized Person
  authorizedPerson: {
    name: string;
    designation: string;
    phone: string;
    email: string;
    altContact?: string;
  };

  // Additional
  category: ClientCategory;
  industry: string;
  gstRegType: GSTRegistrationType;
  filingFrequency: FilingFrequency;
  returnType: string;
  dueDates: {
    gstr1: string;
    gstr3b: string;
    reconciliation: string;
  };
  assignedStaff: ClientStaffAssignment[];
  assignedManagerId?: string;
  assignedManagerName?: string;
  notes?: string;
  importantInstructions?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export interface GSTCredentialVault {
  id: string;
  clientId: string;
  clientName: string;
  gstin: string;
  gstUsername: string;
  isPasswordSaved: boolean;
  integrationStatus: 'CONNECTED' | 'DISCONNECTED' | 'AUTH_REQUIRED' | 'SYNC_IN_PROGRESS';
  connectionMode: 'OFFICIAL_GSP_API' | 'ASSISTED_PORTAL_SESSION';
  lastSuccessfulLogin?: string;
  lastSync?: string;
  tokenExpiresAt?: string;
  syncHistory: {
    id: string;
    period: string;
    timestamp: string;
    status: 'COMPLETED' | 'FAILED' | 'AUTH_REQUIRED' | 'PROCESSING';
    downloadedRecordsCount: number;
    errorReason?: string;
  }[];
}

export type MatchCategory =
  | 'MATCHED'
  | 'PARTIALLY_MATCHED'
  | 'MISSING_IN_GSTR2B'
  | 'MISSING_PURCHASE_INVOICE'
  | 'VALUE_MISMATCH'
  | 'TAX_MISMATCH'
  | 'GSTIN_MISMATCH'
  | 'INVOICE_NUM_MISMATCH'
  | 'DATE_MISMATCH'
  | 'DUPLICATE_INVOICE'
  | 'POSSIBLE_CREDIT_NOTE'
  | 'POSSIBLE_DEBIT_NOTE'
  | 'REVIEW_REQUIRED';

export interface PurchaseInvoiceRecord {
  id: string;
  clientId: string;
  financialYear: string;
  taxPeriod: string;
  supplierName: string;
  supplierGstin: string;
  invoiceNumber: string;
  invoiceDate: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  totalAmount: number;
  fileSource?: string;
  ocrConfidence?: number;
  uploadedAt: string;
}

export interface GSTR2BRecord {
  id: string;
  clientId: string;
  financialYear: string;
  taxPeriod: string;
  supplierName: string;
  supplierGstin: string;
  invoiceNumber: string;
  invoiceType: 'R' | 'CR' | 'DR' | 'B2B';
  invoiceDate: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  totalAmount: number;
  itcAvailability: 'Y' | 'N' | 'T' | 'INELIGIBLE';
  filingDate: string;
}

export interface ReconciliationItem {
  id: string;
  clientId: string;
  financialYear: string;
  taxPeriod: string;
  matchCategory: MatchCategory;
  categoryLabel: string;
  purchaseInvoice?: PurchaseInvoiceRecord;
  gstr2bRecord?: GSTR2BRecord;
  discrepancyDiff?: {
    taxableDiff: number;
    taxDiff: number;
    headDiff: string;
    remarks: string;
  };
  aiExplanation: string;
  suggestedAction: string;
  resolutionStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'ADJUSTED';
  userNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface Task {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  assignedStaffId: string;
  assignedStaffName: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'WAITING_FOR_CLIENT' | 'COMPLETED' | 'OVERDUE';
  category: 'GST_FILING' | 'RECONCILIATION' | 'DOCUMENT_COLLECTION' | 'NOTICE_REPLY' | 'AUDIT_REVIEW';
  createdAt: string;
  commentsCount: number;
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  channel: 'WHATSAPP' | 'EMAIL';
  subject?: string;
  body: string;
  variables: string[];
  category: 'GST_REMINDER' | 'PURCHASE_BILL_REQUEST' | 'RECONCILIATION_REPORT' | 'TAX_PAYMENT_ALERT' | 'CUSTOM';
  updatedAt: string;
}

export interface ScheduledMessage {
  id: string;
  channel: 'WHATSAPP' | 'EMAIL';
  templateId: string;
  templateName: string;
  recipientCount: number;
  scheduledTime: string;
  recurrence: 'ONE_TIME' | 'MONTHLY_5TH' | 'MONTHLY_10TH' | 'MONTHLY_15TH' | 'MONTHLY_18TH';
  status: 'DRAFT' | 'SCHEDULED' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';
  targetClients: string[];
  createdAt: string;
}

export interface CommunicationLog {
  id: string;
  clientId: string;
  clientName: string;
  channel: 'WHATSAPP' | 'EMAIL';
  recipient: string;
  subject?: string;
  messageContent: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'QUEUED';
  sentAt: string;
  sentBy: string;
  errorReason?: string;
}

export interface DocumentItem {
  id: string;
  clientId: string;
  clientName: string;
  category:
    | 'Client Documents'
    | 'GST Documents'
    | 'Purchase Invoices'
    | 'Sales Invoices'
    | 'GSTR-2B'
    | 'Returns'
    | 'Certificates'
    | 'Reports'
    | 'Other';
  fileName: string;
  fileSize: string;
  fileType: 'PDF' | 'EXCEL' | 'CSV' | 'IMAGE' | 'ZIP';
  version: string;
  uploadedBy: string;
  uploadedAt: string;
  downloadUrl: string;
}

export interface AuditLogItem {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resourceType: string;
  clientName?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  details: string;
}

export interface DeveloperRelease {
  version: string;
  releaseDate: string;
  status: 'STABLE' | 'BETA' | 'DEPLOYED';
  features: string[];
  improvements: string[];
  bugFixes: string[];
}

export interface SystemHealthMetric {
  service: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'MAINTENANCE';
  latencyMs: number;
  uptime: string;
  lastChecked: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  category: 'CLIENT' | 'GST' | 'RECON' | 'TASK' | 'COMMUNICATION' | 'SYSTEM';
  timestamp: string;
  read: boolean;
  link?: string;
}
