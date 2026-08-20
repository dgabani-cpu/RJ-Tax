import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_PERMISSIONS = {
  SUPER_ADMIN: {
    viewClients: true,
    addClients: true,
    editClients: true,
    deleteClients: true,
    viewGstData: true,
    downloadGstReports: true,
    uploadDocuments: true,
    viewDocuments: true,
    deleteDocuments: true,
    runReconciliation: true,
    sendWhatsApp: true,
    sendEmail: true,
    scheduleMessages: true,
    viewReports: true,
    exportReports: true,
    manageStaff: true,
    assignClients: true,
    manageIntegrations: true,
    manageSettings: true,
    developerAccess: true,
    auditLogAccess: true,
  },
  MANAGER: {
    viewClients: true,
    addClients: true,
    editClients: true,
    deleteClients: false,
    viewGstData: true,
    downloadGstReports: true,
    uploadDocuments: true,
    viewDocuments: true,
    deleteDocuments: false,
    runReconciliation: true,
    sendWhatsApp: true,
    sendEmail: true,
    scheduleMessages: true,
    viewReports: true,
    exportReports: true,
    manageStaff: false,
    assignClients: true,
    manageIntegrations: false,
    manageSettings: false,
    developerAccess: false,
    auditLogAccess: false,
  },
  STAFF: {
    viewClients: true,
    addClients: false,
    editClients: true,
    deleteClients: false,
    viewGstData: true,
    downloadGstReports: true,
    uploadDocuments: true,
    viewDocuments: true,
    deleteDocuments: false,
    runReconciliation: true,
    sendWhatsApp: true,
    sendEmail: true,
    scheduleMessages: false,
    viewReports: true,
    exportReports: true,
    manageStaff: false,
    assignClients: false,
    manageIntegrations: false,
    manageSettings: false,
    developerAccess: false,
    auditLogAccess: false,
  },
};

const INITIAL_USERS = [
  {
    id: 'usr-1',
    name: 'Neel Gabani',
    email: 'admin@taxnexus.io',
    phone: '+91 98250 12345',
    role: 'SUPER_ADMIN',
    roleTitle: 'Managing Partner & Senior CA',
    department: 'Executive / Practice Head',
    designation: 'FCA, Senior Partner',
    status: 'ACTIVE',
    mfaEnabled: true,
    assignedClientsCount: 0,
    permissions: JSON.stringify(DEFAULT_PERMISSIONS.SUPER_ADMIN),
    lastLogin: '2026-08-09 10:15 AM',
    loginHistory: JSON.stringify([
      { timestamp: '2026-08-09 10:15 AM', ip: '103.24.120.45', device: 'Chrome on Windows 11', location: 'Ahmedabad, India' },
    ]),
  },
  {
    id: 'usr-2',
    name: 'Sneha Patel',
    email: 'sneha.patel@taxnexus.io',
    phone: '+91 98795 67890',
    role: 'MANAGER',
    roleTitle: 'Taxation & GST Audit Manager',
    department: 'GST Compliance',
    designation: 'Senior Manager',
    status: 'ACTIVE',
    mfaEnabled: true,
    assignedClientsCount: 0,
    permissions: JSON.stringify(DEFAULT_PERMISSIONS.MANAGER),
    lastLogin: '2026-08-09 09:45 AM',
  },
  {
    id: 'usr-3',
    name: 'Amit Verma',
    email: 'amit.verma@taxnexus.io',
    phone: '+91 97234 54321',
    role: 'STAFF',
    roleTitle: 'Senior GST Executive',
    department: 'GST Audit & Returns',
    designation: 'Senior Associate',
    status: 'ACTIVE',
    mfaEnabled: false,
    assignedClientsCount: 0,
    permissions: JSON.stringify(DEFAULT_PERMISSIONS.STAFF),
    lastLogin: '2026-08-09 08:50 AM',
  },
];

const COMMUNICATION_TEMPLATES = [
  {
    id: 'tpl-1',
    name: 'GSTR-1 Due Date Alert',
    category: 'GST_REMINDER',
    channel: 'WHATSAPP',
    subject: 'Action Required: GSTR-1 Due on {{dueDate}}',
    body: 'Dear {{clientName}},\n\nThis is a compliance reminder from {{firmName}} that your GSTR-1 for the period {{period}} is due on {{dueDate}}.\n\nPlease upload your outward sales registers to avoid late filing penalties.\n\nRegards,\n{{firmName}} Compliance Team',
    variables: JSON.stringify(['clientName', 'firmName', 'period', 'dueDate']),
    updatedAt: '2026-08-09',
  },
  {
    id: 'tpl-2',
    name: 'GSTR-3B Tax Liability & Payment Notice',
    category: 'TAX_PAYMENT_ALERT',
    channel: 'WHATSAPP',
    subject: 'GSTR-3B Filing & Challan Payment for {{period}}',
    body: 'Dear {{clientName}},\n\nYour GSTR-3B return summary for {{period}} has been prepared by {{firmName}}.\n\nNet Tax Payable: {{taxAmount}}\nDue Date: {{dueDate}}\n\nPlease review and approve for submission.\n\nRegards,\n{{firmName}}',
    variables: JSON.stringify(['clientName', 'period', 'taxAmount', 'dueDate', 'firmName']),
    updatedAt: '2026-08-09',
  },
  {
    id: 'tpl-3',
    name: 'Missing Supplier Invoice in 2B Notice',
    category: 'PURCHASE_BILL_REQUEST',
    channel: 'EMAIL',
    subject: 'ITC At Risk: Invoices Missing in GSTR-2B for {{period}}',
    body: 'Dear {{clientName}},\n\nDuring our automated GSTR-2B reconciliation for {{period}}, we identified invoices from your suppliers that have not been reflected in the GST portal.\n\nPlease ask your vendors to file their GSTR-1 immediately to ensure you receive eligible Input Tax Credit.\n\nRegards,\n{{firmName}} Audit Division',
    variables: JSON.stringify(['clientName', 'period', 'firmName']),
    updatedAt: '2026-08-09',
  },
];

const INITIAL_AUDIT_LOGS = [
  {
    id: 'aud-init-1',
    userId: 'usr-1',
    userName: 'Neel Gabani',
    userRole: 'Super Admin',
    action: 'Practice Workspace Initialized with SQLite Database',
    resourceType: 'SYSTEM',
    ipAddress: '127.0.0.1',
    userAgent: 'TaxNexus Practice Engine v2.4.0 (SQLite Prisma DB)',
    timestamp: '20 Aug 2026, 07:35 PM',
    details: 'Embedded SQLite database layer created and seeded successfully.',
  },
];

const DEVELOPER_RELEASES = [
  {
    id: 'rel-1',
    version: 'v2.4.0',
    releaseDate: '20 Aug 2026',
    status: 'DEPLOYED',
    features: JSON.stringify([
      'Integrated SQLite Database with Prisma ORM & Next.js API Routes',
      'Added Automated Dual Excel Match Engine (GSTR-2B vs Purchase Register)',
      'Added Bulk Client Excel Import & Export',
    ]),
    improvements: JSON.stringify([
      'Persistent SQLite local database backend',
      'Enhanced Security & RBAC Scoping',
    ]),
    bugFixes: JSON.stringify([
      'Resolved invoice number fuzzy normalization edge cases',
    ]),
  },
];

const SYSTEM_HEALTH_METRICS = [
  { id: 'shm-1', service: 'API Gateway', status: 'OPERATIONAL', latencyMs: 12, uptime: '99.98%', lastChecked: 'Just now' },
  { id: 'shm-2', service: 'GSP Connect Service', status: 'OPERATIONAL', latencyMs: 18, uptime: '99.95%', lastChecked: 'Just now' },
  { id: 'shm-3', service: 'SQLite Database Core', status: 'OPERATIONAL', latencyMs: 3, uptime: '100%', lastChecked: 'Just now' },
  { id: 'shm-4', service: 'AI Match Engine', status: 'OPERATIONAL', latencyMs: 35, uptime: '99.99%', lastChecked: 'Just now' },
];

const SYSTEM_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'SQLite Database Initialized',
    message: 'TaxNexus Practice Management SaaS is connected to local SQLite database with Prisma ORM.',
    type: 'SUCCESS',
    category: 'SYSTEM',
    timestamp: 'Just now',
    read: false,
  },
];

async function main() {
  console.log('Seeding SQLite database...');

  for (const user of INITIAL_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: user,
      create: user,
    });
  }

  for (const tpl of COMMUNICATION_TEMPLATES) {
    await prisma.communicationTemplate.upsert({
      where: { id: tpl.id },
      update: tpl,
      create: tpl,
    });
  }

  for (const log of INITIAL_AUDIT_LOGS) {
    await prisma.auditLogItem.upsert({
      where: { id: log.id },
      update: log,
      create: log,
    });
  }

  for (const rel of DEVELOPER_RELEASES) {
    await prisma.developerRelease.upsert({
      where: { id: rel.id },
      update: rel,
      create: rel,
    });
  }

  for (const shm of SYSTEM_HEALTH_METRICS) {
    await prisma.systemHealthMetric.upsert({
      where: { service: shm.service },
      update: shm,
      create: shm,
    });
  }

  for (const notif of SYSTEM_NOTIFICATIONS) {
    await prisma.systemNotification.upsert({
      where: { id: notif.id },
      update: notif,
      create: notif,
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
