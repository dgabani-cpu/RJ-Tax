import * as XLSX from 'xlsx';
import { INITIAL_CLIENTS, INITIAL_TASKS, INITIAL_RECON_DATA, INITIAL_DOCUMENTS, INITIAL_USERS } from '@/lib/db/mockDb';
import { Client, ClientCategory, Task, ReconciliationItem, DocumentItem, EntityType, FilingFrequency, GSTRegistrationType } from '@/types';

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

export interface ParsedClientRow {
  client: Client;
  rowNumber: number;
  status: 'VALID' | 'WARNING' | 'ERROR';
  messages: string[];
  rawRow: Record<string, any>;
}

export interface ClientImportResult {
  totalRows: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
  parsedClients: Client[];
  rowDetails: ParsedClientRow[];
  errors: string[];
}

const CLIENTS_STORAGE_KEY = 'tax_nexus_clients_v2';

export const clientService = {
  // Synchronous and safe access to current clients list from localStorage
  getClients: (): Client[] => {
    if (typeof window === 'undefined') {
      return INITIAL_CLIENTS;
    }
    try {
      const stored = localStorage.getItem(CLIENTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading clients from localStorage:', e);
    }
    return INITIAL_CLIENTS;
  },

  // Save clients to localStorage & notify other components & sync to SQLite database
  saveClients: (clients: Client[]): void => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
        window.dispatchEvent(new CustomEvent('taxnexus:clients-updated', { detail: clients }));
      } catch (e) {
        console.error('Error saving clients to localStorage:', e);
      }
    }
  },

  // Add single client and persist to SQLite DB & localStorage
  addClient: (client: Client): Client[] => {
    const current = clientService.getClients();
    const updated = [client, ...current.filter((c) => c.id !== client.id && c.gstin !== client.gstin)];
    clientService.saveClients(updated);

    // Async sync to SQLite database
    if (typeof window !== 'undefined') {
      fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client),
      }).catch((err) => console.warn('SQLite DB sync error (POST /api/clients):', err));
    }

    return updated;
  },

  // Add multiple clients (e.g. from Excel/CSV bulk import) and persist to SQLite DB & localStorage
  addClients: (newClients: Client[]): Client[] => {
    const current = clientService.getClients();
    const existingGstinSet = new Set(current.map((c) => (c.gstin || '').toUpperCase()));
    const filteredNew = newClients.filter((c) => !existingGstinSet.has((c.gstin || '').toUpperCase()));
    const updated = [...filteredNew, ...current];
    clientService.saveClients(updated);

    // Async sync to SQLite database
    if (typeof window !== 'undefined' && filteredNew.length > 0) {
      fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filteredNew),
      }).catch((err) => console.warn('SQLite DB bulk sync error:', err));
    }

    return updated;
  },

  // Update existing client in SQLite DB & localStorage
  updateClient: (updatedClient: Client): Client[] => {
    const current = clientService.getClients();
    const updated = current.map((c) => (c.id === updatedClient.id ? updatedClient : c));
    clientService.saveClients(updated);

    // Async sync to SQLite database
    if (typeof window !== 'undefined') {
      fetch(`/api/clients/${updatedClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedClient),
      }).catch((err) => console.warn(`SQLite DB sync error (PUT /api/clients/${updatedClient.id}):`, err));
    }

    return updated;
  },

  // Delete client in SQLite DB & localStorage
  deleteClient: (clientId: string): Client[] => {
    const current = clientService.getClients();
    const updated = current.filter((c) => c.id !== clientId);
    clientService.saveClients(updated);

    // Async sync to SQLite database
    if (typeof window !== 'undefined') {
      fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      }).catch((err) => console.warn(`SQLite DB sync error (DELETE /api/clients/${clientId}):`, err));
    }

    return updated;
  },

  // Fetch all clients from SQLite DB backend with localStorage fallback
  getAllClients: async (): Promise<Client[]> => {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/clients');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            if (json.data.length > 0) {
              clientService.saveClients(json.data);
              return json.data;
            }
          }
        }
      } catch (e) {
        console.warn('Unable to fetch clients from SQLite API, using local state:', e);
      }
    }
    return clientService.getClients();
  },

  // Fetch single client by ID
  getClientById: async (id: string): Promise<Client | undefined> => {
    return clientService.getClientByIdSync(id);
  },

  // Synchronous client lookup by id or clientId
  getClientByIdSync: (id: string): Client | undefined => {
    const all = clientService.getClients();
    return all.find((c) => c.id === id || c.clientId === id);
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

  // Parse uploaded Excel (.xlsx, .xls) or CSV (.csv, .txt) file
  parseClientImportFile: async (
    file: File,
    existingClients: Client[] = []
  ): Promise<ClientImportResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });

          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            resolve({
              totalRows: 0,
              validCount: 0,
              warningCount: 0,
              errorCount: 1,
              parsedClients: [],
              rowDetails: [],
              errors: ['The uploaded file contains no readable sheets.'],
            });
            return;
          }

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
            defval: '',
            raw: false,
          });

          if (!rawRows || rawRows.length === 0) {
            resolve({
              totalRows: 0,
              validCount: 0,
              warningCount: 0,
              errorCount: 1,
              parsedClients: [],
              rowDetails: [],
              errors: ['No data rows found in the sheet. Please make sure headers and client records are present.'],
            });
            return;
          }

          const existingGstinSet = new Set(
            existingClients.map((c) => (c.gstin || '').trim().toUpperCase()).filter(Boolean)
          );
          const seenGstinBatch = new Set<string>();

          const rowDetails: ParsedClientRow[] = [];
          const validClients: Client[] = [];
          const globalErrors: string[] = [];

          rawRows.forEach((row, index) => {
            const rowNumber = index + 2; // Row 1 is header
            const messages: string[] = [];
            let status: 'VALID' | 'WARNING' | 'ERROR' = 'VALID';

            // Find key values with flexible matcher
            const getValue = (patterns: RegExp[]): string => {
              const keys = Object.keys(row);
              for (const pattern of patterns) {
                const matchedKey = keys.find((k) => pattern.test(k.trim().toLowerCase()));
                if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
                  return String(row[matchedKey]).trim();
                }
              }
              return '';
            };

            const legalName = getValue([
              /^legal\s*name$/i,
              /^party\s*name$/i,
              /^company\s*name$/i,
              /^firm\s*name$/i,
              /^client\s*name$/i,
              /^business\s*name$/i,
              /^name$/i,
              /legal/i,
              /party/i,
              /company/i,
            ]);

            const tradeName = getValue([
              /^trade\s*name$/i,
              /^brand\s*name$/i,
              /^doing\s*business\s*as$/i,
              /^trade$/i,
            ]) || legalName;

            let gstin = getValue([
              /^gstin$/i,
              /^gst\s*number$/i,
              /^gst\s*no$/i,
              /^gst_in$/i,
              /^gst_no$/i,
              /^gst$/i,
              /gstin/i,
            ]).toUpperCase().replace(/[^A-Z0-9]/g, '');

            let pan = getValue([
              /^pan$/i,
              /^pan\s*no$/i,
              /^pan\s*number$/i,
              /^pan_no$/i,
              /pan/i,
            ]).toUpperCase().replace(/[^A-Z0-9]/g, '');

            // Derive PAN from GSTIN if PAN is missing
            if (!pan && gstin.length === 15) {
              pan = gstin.substring(2, 12);
              messages.push(`PAN (${pan}) auto-extracted from GSTIN`);
            }

            // Fallback GSTIN generation if not provided
            if (!gstin && pan.length === 10) {
              gstin = `24${pan}1Z5`; // Default Gujarat state code with demo checksum
              messages.push(`No GSTIN provided; generated placeholder from PAN (${gstin})`);
              status = 'WARNING';
            }

            // Validation: Name is mandatory
            if (!legalName) {
              status = 'ERROR';
              messages.push('Missing Legal Name or Business Name');
            }

            // Validation: GSTIN format
            if (gstin && gstin.length !== 15) {
              status = 'WARNING';
              messages.push(`GSTIN '${gstin}' is not standard 15 characters`);
            }

            // Duplicate detection
            if (gstin) {
              if (existingGstinSet.has(gstin)) {
                status = 'WARNING';
                messages.push(`GSTIN '${gstin}' already exists in practice database`);
              } else if (seenGstinBatch.has(gstin)) {
                status = 'WARNING';
                messages.push(`Duplicate GSTIN '${gstin}' in upload batch`);
              } else {
                seenGstinBatch.add(gstin);
              }
            }

            // Normalize Entity Type
            const rawEntityType = getValue([
              /entity\s*type/i,
              /constitution/i,
              /organization\s*type/i,
              /business\s*type/i,
              /type/i,
            ]).toLowerCase();

            let entityType: EntityType = 'Private Limited Company';
            if (rawEntityType.includes('pvt') || rawEntityType.includes('private')) {
              entityType = 'Private Limited Company';
            } else if (rawEntityType.includes('public') || rawEntityType.includes('ltd')) {
              entityType = 'Public Limited Company';
            } else if (rawEntityType.includes('llp') || rawEntityType.includes('limited liability')) {
              entityType = 'Limited Liability Partnership (LLP)';
            } else if (rawEntityType.includes('proprietor') || rawEntityType.includes('individual') || rawEntityType.includes('sole')) {
              entityType = 'Sole Proprietorship';
            } else if (rawEntityType.includes('partner') || rawEntityType.includes('firm')) {
              entityType = 'Partnership Firm';
            } else if (rawEntityType.includes('trust') || rawEntityType.includes('society') || rawEntityType.includes('aop')) {
              entityType = 'Trust / Society / AOP';
            } else if (rawEntityType.includes('huf')) {
              entityType = 'HUF';
            } else if (pan.length >= 4) {
              // Derive from PAN 4th character
              const fourthChar = pan.charAt(3);
              if (fourthChar === 'C') entityType = 'Private Limited Company';
              else if (fourthChar === 'P') entityType = 'Sole Proprietorship';
              else if (fourthChar === 'F') entityType = 'Partnership Firm';
              else if (fourthChar === 'T') entityType = 'Trust / Society / AOP';
              else if (fourthChar === 'H') entityType = 'HUF';
            }

            // Normalize Category
            const rawCategory = getValue([/category/i, /tier/i, /segment/i, /grade/i]).toLowerCase();
            let category: ClientCategory = 'Standard (Category B)';
            if (rawCategory.includes('a') || rawCategory.includes('enterprise')) {
              category = 'Enterprise (Category A)';
            } else if (rawCategory.includes('c') || rawCategory.includes('startup') || rawCategory.includes('sme')) {
              category = 'Startup / SME (Category C)';
            }

            // Normalize Filing Frequency
            const rawFrequency = getValue([/frequency/i, /scheme/i, /qrmp/i, /filing/i]).toLowerCase();
            let filingFrequency: FilingFrequency = 'Monthly';
            if (rawFrequency.includes('quarter') || rawFrequency.includes('qrmp')) {
              filingFrequency = 'Quarterly (QRMP)';
            }

            // Normalize GST Registration Type
            const rawRegType = getValue([/reg.*type/i, /taxpayer.*type/i, /gst.*type/i]).toLowerCase();
            let gstRegType: GSTRegistrationType = 'Regular';
            if (rawRegType.includes('composition')) gstRegType = 'Composition';
            else if (rawRegType.includes('sez unit')) gstRegType = 'SEZ Unit';
            else if (rawRegType.includes('sez dev')) gstRegType = 'SEZ Developer';
            else if (rawRegType.includes('isd')) gstRegType = 'ISD';

            // Contact details
            const authPersonName = getValue([
              /auth.*name/i,
              /contact.*name/i,
              /authorized.*person/i,
              /signatory/i,
              /director/i,
              /owner/i,
              /proprietor/i,
            ]) || 'Managing Director';

            const authPersonEmail = getValue([
              /email/i,
              /e-mail/i,
              /mail/i,
            ]) || `accounts@${legalName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}.com`;

            const authPersonPhone = getValue([
              /phone/i,
              /mobile/i,
              /contact\s*no/i,
              /cell/i,
            ]) || '+91 98250 00000';

            const address = getValue([
              /address/i,
              /location/i,
              /city/i,
              /place/i,
            ]) || 'Gujarat, India';

            const industry = getValue([
              /industry/i,
              /sector/i,
              /activity/i,
              /nature/i,
            ]) || 'Trading & Manufacturing';

            // Staff assignment
            const staffInput = getValue([/staff/i, /assigned/i, /manager/i, /accountant/i]);
            const matchedStaff = INITIAL_USERS.find(
              (u) =>
                u.name.toLowerCase().includes(staffInput.toLowerCase()) ||
                u.email.toLowerCase().includes(staffInput.toLowerCase())
            ) || INITIAL_USERS[2] || INITIAL_USERS[0];

            const clientObj: Client = {
              id: `client-imported-${Date.now()}-${index}`,
              clientId: `RJT-2026-${String(existingClients.length + index + 1).padStart(3, '0')}`,
              legalName: legalName || 'Unnamed Entity',
              tradeName: tradeName || legalName || 'Unnamed Entity',
              businessName: tradeName || legalName || 'Unnamed Entity',
              entityType,
              pan: pan || (gstin.length === 15 ? gstin.substring(2, 12) : 'PANNOTPROV'),
              gstin: gstin || '24PENDING0000Z1',
              phone: authPersonPhone,
              email: authPersonEmail,
              businessAddress: address,
              registeredAddress: address,
              billingAddress: address,
              authorizedPerson: {
                name: authPersonName,
                designation: entityType.includes('Company') ? 'Director' : entityType.includes('LLP') ? 'Designated Partner' : 'Proprietor',
                phone: authPersonPhone,
                email: authPersonEmail,
              },
              category,
              industry,
              gstRegType,
              filingFrequency,
              returnType: filingFrequency === 'Monthly' ? 'GSTR-1, GSTR-3B' : 'IFF, GSTR-3B (QRMP)',
              dueDates: {
                gstr1: filingFrequency === 'Monthly' ? '11th of month' : '13th of quarter end',
                gstr3b: '20th of month',
                reconciliation: '14th of month',
              },
              assignedStaff: [
                {
                  staffId: matchedStaff.id,
                  staffName: matchedStaff.name,
                  staffRole: matchedStaff.designation || 'Associate',
                  staffEmail: matchedStaff.email,
                  assignmentType: 'PRIMARY',
                  assignedAt: new Date().toISOString().split('T')[0],
                },
              ],
              status: 'ACTIVE',
              createdAt: new Date().toISOString().split('T')[0],
              updatedAt: new Date().toISOString().split('T')[0],
            };

            rowDetails.push({
              client: clientObj,
              rowNumber,
              status,
              messages,
              rawRow: row,
            });

            if (status !== 'ERROR') {
              validClients.push(clientObj);
            }
          });

          const validCount = rowDetails.filter((r) => r.status === 'VALID').length;
          const warningCount = rowDetails.filter((r) => r.status === 'WARNING').length;
          const errorCount = rowDetails.filter((r) => r.status === 'ERROR').length;

          resolve({
            totalRows: rawRows.length,
            validCount,
            warningCount,
            errorCount,
            parsedClients: validClients,
            rowDetails,
            errors: globalErrors,
          });
        } catch (err: any) {
          console.error('Error parsing client file:', err);
          resolve({
            totalRows: 0,
            validCount: 0,
            warningCount: 0,
            errorCount: 1,
            parsedClients: [],
            rowDetails: [],
            errors: [err?.message || 'Failed to read and parse Excel/CSV document.'],
          });
        }
      };

      reader.onerror = () => {
        resolve({
          totalRows: 0,
          validCount: 0,
          warningCount: 0,
          errorCount: 1,
          parsedClients: [],
          rowDetails: [],
          errors: ['Failed to read the uploaded file from your computer.'],
        });
      };

      reader.readAsArrayBuffer(file);
    });
  },

  // Export Clients List to Native Excel (.xlsx) or CSV (.csv)
  exportClientsToCSV: (clients: Client[], format: 'xlsx' | 'csv' = 'xlsx') => {
    const exportData = clients.map((c) => {
      const health = clientService.getClientHealth(c);
      const primaryStaff = c.assignedStaff?.[0]?.staffName || 'Unassigned';
      return {
        'Client ID': c.clientId,
        'Legal Name': c.legalName,
        'Trade Name': c.tradeName,
        'GSTIN': c.gstin,
        'PAN': c.pan,
        'Entity Type': c.entityType,
        'Category': c.category,
        'Filing Scheme': c.filingFrequency,
        'GST Reg Type': c.gstRegType,
        'Authorized Person': c.authorizedPerson.name,
        'Authorized Email': c.authorizedPerson.email,
        'Authorized Phone': c.authorizedPerson.phone,
        'Assigned Staff': primaryStaff,
        'Address': c.businessAddress,
        'Health Status': health.status,
        'Health Score': `${health.score}%`,
        'Status': c.status,
      };
    });

    const fileNameDate = new Date().toISOString().split('T')[0];

    if (format === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet['!cols'] = [
        { wch: 14 }, // Client ID
        { wch: 32 }, // Legal Name
        { wch: 24 }, // Trade Name
        { wch: 18 }, // GSTIN
        { wch: 14 }, // PAN
        { wch: 28 }, // Entity Type
        { wch: 22 }, // Category
        { wch: 18 }, // Filing Scheme
        { wch: 14 }, // GST Reg Type
        { wch: 20 }, // Auth Person
        { wch: 26 }, // Auth Email
        { wch: 16 }, // Auth Phone
        { wch: 18 }, // Assigned Staff
        { wch: 35 }, // Address
        { wch: 16 }, // Health Status
        { wch: 14 }, // Health Score
        { wch: 10 }, // Status
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients Directory');
      XLSX.writeFile(workbook, `TaxNexus_Client_Directory_${fileNameDate}.xlsx`);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TaxNexus_Client_Directory_${fileNameDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  },

  // Download Sample Excel/CSV Import Template (.xlsx or .csv)
  downloadSampleImportTemplate: (format: 'xlsx' | 'csv' = 'xlsx') => {
    const sampleRows = [
      {
        'Legal Name': 'Gujarat Alkali & Chemicals Ltd',
        'Trade Name': 'GACL Chemicals',
        'GSTIN': '24AAACG1234F1ZP',
        'PAN': 'AAACG1234F',
        'Entity Type': 'Public Limited Company',
        'Category': 'Enterprise (Category A)',
        'Filing Frequency': 'Monthly',
        'GST Reg Type': 'Regular',
        'Auth Person Name': 'Mukesh Patel',
        'Auth Person Email': 'mukesh.patel@gacl.co.in',
        'Auth Person Phone': '+91 98250 88776',
        'Address': 'GIDC Nandesari, Vadodara, Gujarat 391340',
        'Industry': 'Chemical Manufacturing',
        'Assigned Staff': 'Amit Verma',
      },
      {
        'Legal Name': 'Torrent Logistics & Cold Storage LLP',
        'Trade Name': 'Torrent Logistics',
        'GSTIN': '24AAACT5678K1ZQ',
        'PAN': 'AAACT5678K',
        'Entity Type': 'Limited Liability Partnership (LLP)',
        'Category': 'Standard (Category B)',
        'Filing Frequency': 'Monthly',
        'GST Reg Type': 'Regular',
        'Auth Person Name': 'Nitin Shah',
        'Auth Person Email': 'nitin@torrentlogistics.com',
        'Auth Person Phone': '+91 97129 44332',
        'Address': 'Changodar Industrial Zone, Ahmedabad, Gujarat 382213',
        'Industry': 'Logistics & Cold Storage',
        'Assigned Staff': 'Sneha Patel',
      },
      {
        'Legal Name': 'Apex Digital Solutions Proprietary Concern',
        'Trade Name': 'Apex Tech Labs',
        'GSTIN': '24BPWPA9876Q1Z2',
        'PAN': 'BPWPA9876Q',
        'Entity Type': 'Sole Proprietorship',
        'Category': 'Startup / SME (Category C)',
        'Filing Frequency': 'Quarterly (QRMP)',
        'GST Reg Type': 'Regular',
        'Auth Person Name': 'Pooja Sharma',
        'Auth Person Email': 'pooja@apextechlabs.io',
        'Auth Person Phone': '+91 98980 12345',
        'Address': '402 Synergy Tower, SG Highway, Ahmedabad 380054',
        'Industry': 'IT & Software Services',
        'Assigned Staff': 'Neel Gabani',
      },
    ];

    if (format === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(sampleRows);
      worksheet['!cols'] = [
        { wch: 35 }, // Legal Name
        { wch: 22 }, // Trade Name
        { wch: 18 }, // GSTIN
        { wch: 14 }, // PAN
        { wch: 28 }, // Entity Type
        { wch: 24 }, // Category
        { wch: 18 }, // Filing Frequency
        { wch: 14 }, // GST Reg Type
        { wch: 20 }, // Auth Person Name
        { wch: 28 }, // Auth Person Email
        { wch: 18 }, // Auth Person Phone
        { wch: 45 }, // Address
        { wch: 25 }, // Industry
        { wch: 18 }, // Assigned Staff
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Client Import Template');
      XLSX.writeFile(workbook, 'TaxNexus_Clients_Import_Template.xlsx');
    } else {
      const worksheet = XLSX.utils.json_to_sheet(sampleRows);
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'TaxNexus_Clients_Import_Template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  },
};
