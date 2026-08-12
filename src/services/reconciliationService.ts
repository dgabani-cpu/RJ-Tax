import * as XLSX from 'xlsx';
import { INITIAL_RECON_DATA } from '@/lib/db/mockDb';
import { ReconciliationItem, MatchCategory, GSTR2BRecord, PurchaseInvoiceRecord } from '@/types';

const RECON_STORAGE_KEY = 'taxnexus_reconciliation_data_v2';
const GSTR2B_STORAGE_KEY = 'taxnexus_gstr2b_records_v2';
const PURCHASE_STORAGE_KEY = 'taxnexus_purchase_records_v2';

export interface ParseResult<T> {
  success: boolean;
  totalRows: number;
  validCount: number;
  errorCount: number;
  records: T[];
  errors: string[];
  warnings: string[];
  summary: {
    totalTaxable: number;
    totalTax: number;
    totalAmount: number;
  };
}

// Utility: Normalize and parse numeric values safely
function parseNumeric(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val * 100) / 100;
  const cleaned = String(val).replace(/[^0-9.-]+/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

// Utility: Normalize dates to DD-Mon-YYYY or YYYY-MM-DD
function parseDateString(val: any): string {
  if (!val) return new Date().toISOString().split('T')[0];
  if (val instanceof Date && !isNaN(val.getTime())) {
    const d = String(val.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const m = months[val.getMonth()];
    const y = val.getFullYear();
    return `${d}-${m}-${y}`;
  }
  const str = String(val).trim();
  // Check if Excel serial date number
  if (/^\d{5}$/.test(str)) {
    const serial = parseInt(str, 10);
    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);
    if (!isNaN(dateInfo.getTime())) {
      const d = String(dateInfo.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${d}-${months[dateInfo.getMonth()]}-${dateInfo.getFullYear()}`;
    }
  }
  return str;
}

// Utility: Normalize GSTIN
function cleanGSTIN(val: any): string {
  if (!val) return '';
  return String(val).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Utility: Clean Invoice Number (strip surrounding punctuation, normalize slashes)
function cleanInvoiceNumber(val: any): string {
  if (!val) return '';
  return String(val).trim().toUpperCase().replace(/^[\s\-_#]+|[\s\-_#]+$/g, '');
}

// Utility: Simplified invoice string for fuzzy comparison
function normalizeInvoiceForFuzzy(num: string): string {
  return cleanInvoiceNumber(num).replace(/[^A-Z0-9]/gi, '').replace(/^0+/, '');
}

export const reconciliationService = {
  // -------------------------------------------------------------
  // Storage & State Management
  // -------------------------------------------------------------
  getReconciliationData: (clientId?: string, period?: string): ReconciliationItem[] => {
    if (typeof window === 'undefined') return INITIAL_RECON_DATA;
    try {
      const raw = localStorage.getItem(RECON_STORAGE_KEY);
      let list: ReconciliationItem[] = raw ? JSON.parse(raw) : INITIAL_RECON_DATA;

      if (clientId && clientId !== 'ALL') {
        list = list.filter((r) => r.clientId === clientId);
      }
      if (period && period !== 'ALL') {
        list = list.filter((r) => r.taxPeriod === period);
      }
      return list;
    } catch {
      return INITIAL_RECON_DATA;
    }
  },

  saveReconciliationData: (items: ReconciliationItem[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(RECON_STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('taxnexus:recon-updated', { detail: items }));
    } catch (e) {
      console.error('Failed to save reconciliation data to localStorage', e);
    }
  },

  getGSTR2BRecords: (clientId?: string, period?: string): GSTR2BRecord[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(GSTR2B_STORAGE_KEY);
      let list: GSTR2BRecord[] = raw ? JSON.parse(raw) : [];
      if (clientId && clientId !== 'ALL') {
        list = list.filter((r) => r.clientId === clientId);
      }
      if (period && period !== 'ALL') {
        list = list.filter((r) => r.taxPeriod === period);
      }
      return list;
    } catch {
      return [];
    }
  },

  saveGSTR2BRecords: (records: GSTR2BRecord[]) => {
    if (typeof window === 'undefined') return;
    try {
      const existing = reconciliationService.getGSTR2BRecords();
      // Merge by ID or client+invNo
      const mergedMap = new Map<string, GSTR2BRecord>();
      existing.forEach((r) => mergedMap.set(`${r.clientId}-${r.supplierGstin}-${r.invoiceNumber}`, r));
      records.forEach((r) => mergedMap.set(`${r.clientId}-${r.supplierGstin}-${r.invoiceNumber}`, r));
      const combined = Array.from(mergedMap.values());
      localStorage.setItem(GSTR2B_STORAGE_KEY, JSON.stringify(combined));
      window.dispatchEvent(new CustomEvent('taxnexus:gstr2b-updated', { detail: combined }));
    } catch (e) {
      console.error('Failed to save GSTR-2B records', e);
    }
  },

  getPurchaseRecords: (clientId?: string, period?: string): PurchaseInvoiceRecord[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(PURCHASE_STORAGE_KEY);
      let list: PurchaseInvoiceRecord[] = raw ? JSON.parse(raw) : [];
      if (clientId && clientId !== 'ALL') {
        list = list.filter((r) => r.clientId === clientId);
      }
      if (period && period !== 'ALL') {
        list = list.filter((r) => r.taxPeriod === period);
      }
      return list;
    } catch {
      return [];
    }
  },

  savePurchaseRecords: (records: PurchaseInvoiceRecord[]) => {
    if (typeof window === 'undefined') return;
    try {
      const existing = reconciliationService.getPurchaseRecords();
      const mergedMap = new Map<string, PurchaseInvoiceRecord>();
      existing.forEach((r) => mergedMap.set(`${r.clientId}-${r.supplierGstin}-${r.invoiceNumber}`, r));
      records.forEach((r) => mergedMap.set(`${r.clientId}-${r.supplierGstin}-${r.invoiceNumber}`, r));
      const combined = Array.from(mergedMap.values());
      localStorage.setItem(PURCHASE_STORAGE_KEY, JSON.stringify(combined));
      window.dispatchEvent(new CustomEvent('taxnexus:purchase-updated', { detail: combined }));
    } catch (e) {
      console.error('Failed to save purchase records', e);
    }
  },

  updateResolution: (itemId: string, status: 'ACCEPTED' | 'REJECTED' | 'ADJUSTED', notes?: string) => {
    const all = reconciliationService.getReconciliationData();
    const updated = all.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          resolutionStatus: status,
          userNotes: notes !== undefined ? notes : item.userNotes,
          reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
      }
      return item;
    });
    reconciliationService.saveReconciliationData(updated);
  },

  getCategoryCounts: (clientId?: string, period?: string) => {
    const dataset = reconciliationService.getReconciliationData(clientId, period);
    const counts: Record<string, number> = {
      ALL: dataset.length,
      MATCHED: 0,
      PARTIALLY_MATCHED: 0,
      MISSING_IN_GSTR2B: 0,
      MISSING_PURCHASE_INVOICE: 0,
      VALUE_MISMATCH: 0,
      TAX_MISMATCH: 0,
      GSTIN_MISMATCH: 0,
      INVOICE_NUM_MISMATCH: 0,
      DATE_MISMATCH: 0,
      DUPLICATE_INVOICE: 0,
      POSSIBLE_CREDIT_NOTE: 0,
      POSSIBLE_DEBIT_NOTE: 0,
      REVIEW_REQUIRED: 0,
    };

    dataset.forEach((item) => {
      if (counts[item.matchCategory] !== undefined) {
        counts[item.matchCategory]++;
      }
    });

    return counts;
  },

  // -------------------------------------------------------------
  // 1. Official GSTR-2B File Parser (.xlsx, .xls, .csv, .json)
  // -------------------------------------------------------------
  parseGSTR2BFile: async (
    file: File,
    clientId: string,
    period: string = 'July 2026',
    fy: string = '2026-27'
  ): Promise<ParseResult<GSTR2BRecord>> => {
    return new Promise((resolve) => {
      const fileName = file.name.toLowerCase();

      // Handle GST Portal JSON format
      if (fileName.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = JSON.parse(e.target?.result as string);
            const parsedRecords: GSTR2BRecord[] = [];
            const errors: string[] = [];

            // Official GST Portal JSON format (data.b2b or b2b)
            const b2bList = content.b2b || content.data?.b2b || [];

            if (!Array.isArray(b2bList) || b2bList.length === 0) {
              resolve({
                success: false,
                totalRows: 0,
                validCount: 0,
                errorCount: 1,
                records: [],
                errors: ['No B2B section found in the uploaded GST Portal JSON file.'],
                warnings: [],
                summary: { totalTaxable: 0, totalTax: 0, totalAmount: 0 },
              });
              return;
            }

            let totalTaxable = 0;
            let totalTax = 0;
            let totalAmount = 0;

            b2bList.forEach((supplierBlock: any) => {
              const ctin = cleanGSTIN(supplierBlock.ctin || supplierBlock.gstin);
              const trdName = String(supplierBlock.trdnm || supplierBlock.lgnm || supplierBlock.tradeName || 'Supplier ' + ctin).trim();
              const invList = supplierBlock.inv || supplierBlock.invoices || [];

              invList.forEach((inv: any, idx: number) => {
                const invNum = cleanInvoiceNumber(inv.inum || inv.invNo || inv.invoiceNumber || `INV-${idx + 1}`);
                const invDate = parseDateString(inv.idt || inv.invDate || inv.date);
                const invType = (inv.inv_typ || inv.invType || 'B2B').toUpperCase() as any;
                const itcAvl = (inv.itcavl || inv.itcAvailable || 'Y').toUpperCase() === 'Y' ? 'Y' : 'N';
                const filingDate = parseDateString(inv.fldt || inv.filingDate || '');

                let lineTaxable = 0;
                let lineIgst = 0;
                let lineCgst = 0;
                let lineSgst = 0;
                let lineCess = 0;

                const items = inv.items || inv.itms || [];
                if (Array.isArray(items) && items.length > 0) {
                  items.forEach((itemObj: any) => {
                    const det = itemObj.itm_det || itemObj;
                    lineTaxable += parseNumeric(det.txval || det.taxable);
                    lineIgst += parseNumeric(det.iamt || det.igst);
                    lineCgst += parseNumeric(det.camt || det.cgst);
                    lineSgst += parseNumeric(det.samt || det.sgst);
                    lineCess += parseNumeric(det.csamt || det.cess);
                  });
                } else {
                  lineTaxable = parseNumeric(inv.val || inv.taxableValue);
                  lineIgst = parseNumeric(inv.iamt || inv.igst);
                  lineCgst = parseNumeric(inv.camt || inv.cgst);
                  lineSgst = parseNumeric(inv.samt || inv.sgst);
                }

                const recTotal = lineTaxable + lineIgst + lineCgst + lineSgst + lineCess;
                totalTaxable += lineTaxable;
                totalTax += (lineIgst + lineCgst + lineSgst);
                totalAmount += recTotal;

                parsedRecords.push({
                  id: `gstr2b-${Date.now()}-${parsedRecords.length + 1}`,
                  clientId,
                  financialYear: fy,
                  taxPeriod: period,
                  supplierName: trdName,
                  supplierGstin: ctin,
                  invoiceNumber: invNum,
                  invoiceType: invType,
                  invoiceDate: invDate,
                  taxableValue: Math.round(lineTaxable * 100) / 100,
                  igst: Math.round(lineIgst * 100) / 100,
                  cgst: Math.round(lineCgst * 100) / 100,
                  sgst: Math.round(lineSgst * 100) / 100,
                  cess: Math.round(lineCess * 100) / 100,
                  totalAmount: Math.round(recTotal * 100) / 100,
                  itcAvailability: itcAvl as any,
                  filingDate,
                });
              });
            });

            resolve({
              success: true,
              totalRows: parsedRecords.length,
              validCount: parsedRecords.length,
              errorCount: 0,
              records: parsedRecords,
              errors,
              warnings: [],
              summary: {
                totalTaxable: Math.round(totalTaxable * 100) / 100,
                totalTax: Math.round(totalTax * 100) / 100,
                totalAmount: Math.round(totalAmount * 100) / 100,
              },
            });
          } catch (err: any) {
            resolve({
              success: false,
              totalRows: 0,
              validCount: 0,
              errorCount: 1,
              records: [],
              errors: [`Failed to parse GSTR-2B JSON file: ${err.message}`],
              warnings: [],
              summary: { totalTaxable: 0, totalTax: 0, totalAmount: 0 },
            });
          }
        };
        reader.readAsText(file);
        return;
      }

      // Handle Excel (.xlsx, .xls) and CSV
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });

          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            resolve({
              success: false,
              totalRows: 0,
              validCount: 0,
              errorCount: 1,
              records: [],
              errors: ['No readable worksheets found in GSTR-2B spreadsheet.'],
              warnings: [],
              summary: { totalTaxable: 0, totalTax: 0, totalAmount: 0 },
            });
            return;
          }

          // Search for best sheet: "B2B", "B2BA", "CDNR", or first sheet
          const sheetName =
            workbook.SheetNames.find((s) => /b2b/i.test(s)) ||
            workbook.SheetNames.find((s) => /invoice/i.test(s)) ||
            workbook.SheetNames[0];

          const worksheet = workbook.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
            defval: '',
            raw: false,
          });

          if (!rawRows || rawRows.length === 0) {
            resolve({
              success: false,
              totalRows: 0,
              validCount: 0,
              errorCount: 1,
              records: [],
              errors: [`Worksheet '${sheetName}' contains no data rows.`],
              warnings: [],
              summary: { totalTaxable: 0, totalTax: 0, totalAmount: 0 },
            });
            return;
          }

          // Header pattern helpers
          const getField = (row: Record<string, any>, patterns: RegExp[]): any => {
            const keys = Object.keys(row);
            for (const pat of patterns) {
              const matchKey = keys.find((k) => pat.test(k.trim().toLowerCase()));
              if (matchKey && row[matchKey] !== undefined && row[matchKey] !== null && String(row[matchKey]).trim() !== '') {
                return row[matchKey];
              }
            }
            return '';
          };

          const invoiceMap = new Map<string, GSTR2BRecord>();
          const errors: string[] = [];
          const warnings: string[] = [];

          rawRows.forEach((row, idx) => {
            const gstin = cleanGSTIN(
              getField(row, [
                /gstin\s*of\s*supplier/i,
                /supplier\s*gstin/i,
                /ctin/i,
                /^gstin/i,
                /party\s*gstin/i,
              ])
            );

            const supplierName = String(
              getField(row, [
                /trade\/legal\s*name/i,
                /legal\s*name/i,
                /trade\s*name/i,
                /supplier\s*name/i,
                /party\s*name/i,
                /vendor\s*name/i,
                /supplier/i,
              ]) || (gstin ? `Supplier (${gstin})` : `Supplier Line ${idx + 1}`)
            ).trim();

            const invoiceNum = cleanInvoiceNumber(
              getField(row, [
                /invoice\s*number/i,
                /invoice\s*no/i,
                /inv\s*no/i,
                /inum/i,
                /bill\s*no/i,
                /note\/doc\s*no/i,
                /doc\s*no/i,
              ])
            );

            const rawDate = getField(row, [
              /invoice\s*date/i,
              /inv\s*date/i,
              /idt/i,
              /date/i,
              /bill\s*date/i,
            ]);
            const invoiceDate = parseDateString(rawDate);

            const taxable = parseNumeric(
              getField(row, [
                /taxable\s*value/i,
                /taxable\s*amount/i,
                /txval/i,
                /taxable/i,
                /basic\s*value/i,
                /net\s*amount/i,
              ])
            );

            const igst = parseNumeric(
              getField(row, [
                /integrated\s*tax/i,
                /igst/i,
                /iamt/i,
              ])
            );

            const cgst = parseNumeric(
              getField(row, [
                /central\s*tax/i,
                /cgst/i,
                /camt/i,
              ])
            );

            const sgst = parseNumeric(
              getField(row, [
                /state\/ut\s*tax/i,
                /state\s*tax/i,
                /sgst/i,
                /samt/i,
                /utgst/i,
              ])
            );

            const cess = parseNumeric(
              getField(row, [
                /cess/i,
                /csamt/i,
              ])
            );

            const rawTotal = parseNumeric(
              getField(row, [
                /total\s*invoice\s*value/i,
                /invoice\s*value/i,
                /total\s*amount/i,
                /gross\s*amount/i,
                /val/i,
              ])
            );
            const totalAmount = rawTotal > 0 ? rawTotal : Math.round((taxable + igst + cgst + sgst + cess) * 100) / 100;

            const rawItc = String(
              getField(row, [
                /itc\s*availability/i,
                /itcavl/i,
                /itc\s*status/i,
                /itc\s*eligible/i,
              ])
            ).trim().toUpperCase();
            const itcAvailability: 'Y' | 'N' | 'T' | 'INELIGIBLE' =
              rawItc === 'N' || rawItc === 'NO' || rawItc === 'INELIGIBLE' ? 'INELIGIBLE' : 'Y';

            const filingDate = parseDateString(
              getField(row, [
                /filing\s*date/i,
                /gstr-1\s*filing\s*date/i,
                /return\s*filing\s*date/i,
                /fldt/i,
              ])
            );

            // Skip empty or informational header rows
            if (!gstin && !invoiceNum && taxable === 0 && igst === 0 && cgst === 0 && sgst === 0) {
              return;
            }

            const invKey = `${gstin}_${invoiceNum}`;
            if (invoiceMap.has(invKey)) {
              // Aggregate multi-line invoice item rates
              const existing = invoiceMap.get(invKey)!;
              existing.taxableValue = Math.round((existing.taxableValue + taxable) * 100) / 100;
              existing.igst = Math.round((existing.igst + igst) * 100) / 100;
              existing.cgst = Math.round((existing.cgst + cgst) * 100) / 100;
              existing.sgst = Math.round((existing.sgst + sgst) * 100) / 100;
              existing.cess = Math.round((existing.cess + cess) * 100) / 100;
              existing.totalAmount = Math.round((existing.totalAmount + totalAmount) * 100) / 100;
            } else {
              invoiceMap.set(invKey, {
                id: `gstr2b-${Date.now()}-${invoiceMap.size + 1}`,
                clientId,
                financialYear: fy,
                taxPeriod: period,
                supplierName: supplierName || 'Registered Supplier',
                supplierGstin: gstin || 'UNREGISTERED',
                invoiceNumber: invoiceNum || `INV-ROW-${idx + 1}`,
                invoiceType: 'B2B',
                invoiceDate: invoiceDate || '01-Jul-2026',
                taxableValue: taxable,
                igst,
                cgst,
                sgst,
                cess,
                totalAmount,
                itcAvailability,
                filingDate: filingDate || '10-Aug-2026',
              });
            }
          });

          const records = Array.from(invoiceMap.values());
          let totalTaxable = 0;
          let totalTax = 0;
          let totalAmount = 0;

          records.forEach((r) => {
            totalTaxable += r.taxableValue;
            totalTax += (r.igst + r.cgst + r.sgst);
            totalAmount += r.totalAmount;
          });

          resolve({
            success: records.length > 0,
            totalRows: rawRows.length,
            validCount: records.length,
            errorCount: records.length === 0 ? 1 : 0,
            records,
            errors: records.length === 0 ? ['Could not detect any valid invoice records in the uploaded spreadsheet. Please check the column headers.'] : errors,
            warnings,
            summary: {
              totalTaxable: Math.round(totalTaxable * 100) / 100,
              totalTax: Math.round(totalTax * 100) / 100,
              totalAmount: Math.round(totalAmount * 100) / 100,
            },
          });
        } catch (err: any) {
          resolve({
            success: false,
            totalRows: 0,
            validCount: 0,
            errorCount: 1,
            records: [],
            errors: [`Failed to parse GSTR-2B file: ${err.message}`],
            warnings: [],
            summary: { totalTaxable: 0, totalTax: 0, totalAmount: 0 },
          });
        }
      };
      reader.readAsArrayBuffer(file);
    });
  },

  // -------------------------------------------------------------
  // 2. Client Purchase Register Parser (.xlsx, .xls, .csv, .txt)
  // -------------------------------------------------------------
  parsePurchaseRegisterFile: async (
    file: File,
    clientId: string,
    period: string = 'July 2026',
    fy: string = '2026-27'
  ): Promise<ParseResult<PurchaseInvoiceRecord>> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });

          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            resolve({
              success: false,
              totalRows: 0,
              validCount: 0,
              errorCount: 1,
              records: [],
              errors: ['No readable worksheets found in the Purchase Register spreadsheet.'],
              warnings: [],
              summary: { totalTaxable: 0, totalTax: 0, totalAmount: 0 },
            });
            return;
          }

          const sheetName =
            workbook.SheetNames.find((s) => /purchase/i.test(s)) ||
            workbook.SheetNames.find((s) => /register/i.test(s)) ||
            workbook.SheetNames.find((s) => /bills/i.test(s)) ||
            workbook.SheetNames[0];

          const worksheet = workbook.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
            defval: '',
            raw: false,
          });

          if (!rawRows || rawRows.length === 0) {
            resolve({
              success: false,
              totalRows: 0,
              validCount: 0,
              errorCount: 1,
              records: [],
              errors: [`Worksheet '${sheetName}' is empty or contains no records.`],
              warnings: [],
              summary: { totalTaxable: 0, totalTax: 0, totalAmount: 0 },
            });
            return;
          }

          const getField = (row: Record<string, any>, patterns: RegExp[]): any => {
            const keys = Object.keys(row);
            for (const pat of patterns) {
              const matchKey = keys.find((k) => pat.test(k.trim().toLowerCase()));
              if (matchKey && row[matchKey] !== undefined && row[matchKey] !== null && String(row[matchKey]).trim() !== '') {
                return row[matchKey];
              }
            }
            return '';
          };

          const invoiceMap = new Map<string, PurchaseInvoiceRecord>();
          const errors: string[] = [];
          const warnings: string[] = [];

          rawRows.forEach((row, idx) => {
            const supplierName = String(
              getField(row, [
                /party\s*name/i,
                /vendor\s*name/i,
                /supplier\s*name/i,
                /particulars/i,
                /account\s*name/i,
                /ledger\s*name/i,
                /supplier/i,
                /vendor/i,
                /party/i,
              ])
            ).trim();

            const supplierGstin = cleanGSTIN(
              getField(row, [
                /party\s*gstin/i,
                /supplier\s*gstin/i,
                /vendor\s*gstin/i,
                /gstin\/uin/i,
                /^gstin/i,
                /gst\s*no/i,
                /tin/i,
              ])
            );

            const invoiceNumber = cleanInvoiceNumber(
              getField(row, [
                /invoice\s*no/i,
                /bill\s*no/i,
                /voucher\s*no/i,
                /ref\s*no/i,
                /reference\s*no/i,
                /inv\s*no/i,
                /invoice\s*number/i,
                /bill\s*number/i,
                /vch\s*no/i,
                /doc\s*no/i,
              ])
            );

            const rawDate = getField(row, [
              /invoice\s*date/i,
              /bill\s*date/i,
              /voucher\s*date/i,
              /date/i,
              /inv\s*date/i,
            ]);
            const invoiceDate = parseDateString(rawDate);

            const taxable = parseNumeric(
              getField(row, [
                /taxable\s*value/i,
                /taxable\s*amount/i,
                /basic\s*amount/i,
                /basic\s*value/i,
                /net\s*amount/i,
                /taxable/i,
                /amount/i,
              ])
            );

            const igst = parseNumeric(
              getField(row, [
                /igst\s*amount/i,
                /integrated\s*tax/i,
                /igst/i,
              ])
            );

            const cgst = parseNumeric(
              getField(row, [
                /cgst\s*amount/i,
                /central\s*tax/i,
                /cgst/i,
              ])
            );

            const sgst = parseNumeric(
              getField(row, [
                /sgst\s*amount/i,
                /state\s*tax/i,
                /sgst/i,
                /utgst/i,
              ])
            );

            const cess = parseNumeric(
              getField(row, [
                /cess\s*amount/i,
                /cess/i,
              ])
            );

            const rawTotal = parseNumeric(
              getField(row, [
                /gross\s*amount/i,
                /total\s*amount/i,
                /total\s*invoice\s*value/i,
                /bill\s*amount/i,
                /invoice\s*value/i,
                /total/i,
              ])
            );
            const totalAmount = rawTotal > 0 ? rawTotal : Math.round((taxable + igst + cgst + sgst + cess) * 100) / 100;

            // Skip invalid blank rows
            if (!supplierName && !supplierGstin && !invoiceNumber && taxable === 0) {
              return;
            }

            const invKey = `${supplierGstin || supplierName}_${invoiceNumber || `ROW-${idx + 1}`}`;

            if (invoiceMap.has(invKey)) {
              const existing = invoiceMap.get(invKey)!;
              existing.taxableValue = Math.round((existing.taxableValue + taxable) * 100) / 100;
              existing.igst = Math.round((existing.igst + igst) * 100) / 100;
              existing.cgst = Math.round((existing.cgst + cgst) * 100) / 100;
              existing.sgst = Math.round((existing.sgst + sgst) * 100) / 100;
              existing.cess = Math.round((existing.cess + cess) * 100) / 100;
              existing.totalAmount = Math.round((existing.totalAmount + totalAmount) * 100) / 100;
            } else {
              invoiceMap.set(invKey, {
                id: `pinv-${Date.now()}-${invoiceMap.size + 1}`,
                clientId,
                financialYear: fy,
                taxPeriod: period,
                supplierName: supplierName || 'Vendor ' + (supplierGstin || idx + 1),
                supplierGstin: supplierGstin || 'UNREGISTERED',
                invoiceNumber: invoiceNumber || `VCH-${idx + 1}`,
                invoiceDate: invoiceDate || '01-Jul-2026',
                taxableValue: taxable,
                igst,
                cgst,
                sgst,
                cess,
                totalAmount,
                fileSource: file.name,
                uploadedAt: new Date().toISOString(),
              });
            }
          });

          const records = Array.from(invoiceMap.values());
          let totalTaxable = 0;
          let totalTax = 0;
          let totalAmount = 0;

          records.forEach((r) => {
            totalTaxable += r.taxableValue;
            totalTax += (r.igst + r.cgst + r.sgst);
            totalAmount += r.totalAmount;
          });

          resolve({
            success: records.length > 0,
            totalRows: rawRows.length,
            validCount: records.length,
            errorCount: records.length === 0 ? 1 : 0,
            records,
            errors: records.length === 0 ? ['Could not extract any purchase invoice records from the spreadsheet. Please verify the header columns.'] : errors,
            warnings,
            summary: {
              totalTaxable: Math.round(totalTaxable * 100) / 100,
              totalTax: Math.round(totalTax * 100) / 100,
              totalAmount: Math.round(totalAmount * 100) / 100,
            },
          });
        } catch (err: any) {
          resolve({
            success: false,
            totalRows: 0,
            validCount: 0,
            errorCount: 1,
            records: [],
            errors: [`Failed to parse Purchase Register: ${err.message}`],
            warnings: [],
            summary: { totalTaxable: 0, totalTax: 0, totalAmount: 0 },
          });
        }
      };
      reader.readAsArrayBuffer(file);
    });
  },

  // -------------------------------------------------------------
  // 3. Automated 13-Rule Reconciliation Matching Engine
  // -------------------------------------------------------------
  matchInvoices: (
    gstr2bList: GSTR2BRecord[],
    purchaseList: PurchaseInvoiceRecord[],
    clientId: string,
    period: string = 'July 2026',
    fy: string = '2026-27'
  ): ReconciliationItem[] => {
    const reconItems: ReconciliationItem[] = [];
    const matched2BIds = new Set<string>();
    const matchedPurchaseIds = new Set<string>();

    // Duplicate check in Purchase Register
    const purchaseInvCounts = new Map<string, number>();
    purchaseList.forEach((p) => {
      const k = `${cleanGSTIN(p.supplierGstin)}_${cleanInvoiceNumber(p.invoiceNumber)}`;
      purchaseInvCounts.set(k, (purchaseInvCounts.get(k) || 0) + 1);
    });

    // PASS 1: Exact Match (GSTIN + Invoice Number + Values within ₹1 tolerance)
    purchaseList.forEach((pinv) => {
      const pGstin = cleanGSTIN(pinv.supplierGstin);
      const pInv = cleanInvoiceNumber(pinv.invoiceNumber);

      const candidate = gstr2bList.find((g) => {
        if (matched2BIds.has(g.id)) return false;
        const gGstin = cleanGSTIN(g.supplierGstin);
        const gInv = cleanInvoiceNumber(g.invoiceNumber);
        return gGstin === pGstin && gInv === pInv;
      });

      if (candidate) {
        const taxableDiff = Math.abs(pinv.taxableValue - candidate.taxableValue);
        const pTax = pinv.igst + pinv.cgst + pinv.sgst;
        const gTax = candidate.igst + candidate.cgst + candidate.sgst;
        const taxDiff = Math.abs(pTax - gTax);

        matched2BIds.add(candidate.id);
        matchedPurchaseIds.add(pinv.id);

        if (taxableDiff <= 1.0 && taxDiff <= 1.0) {
          // 100% Exact Match
          reconItems.push({
            id: `recon-match-${Date.now()}-${reconItems.length + 1}`,
            clientId,
            financialYear: fy,
            taxPeriod: period,
            matchCategory: 'MATCHED',
            categoryLabel: 'A. Matched (100% Exact)',
            purchaseInvoice: pinv,
            gstr2bRecord: candidate,
            aiExplanation: 'Perfect 100% match across Supplier GSTIN, Invoice Number, Taxable Value, and Tax Heads. Eligible for full ITC claim in GSTR-3B Table 4(A)(5).',
            suggestedAction: 'Claim Full ITC in GSTR-3B Table 4(A)(5)',
            resolutionStatus: 'ACCEPTED',
          });
        } else if (taxableDiff > 1.0) {
          // Value Mismatch
          const diff = Math.round((pinv.taxableValue - candidate.taxableValue) * 100) / 100;
          reconItems.push({
            id: `recon-vm-${Date.now()}-${reconItems.length + 1}`,
            clientId,
            financialYear: fy,
            taxPeriod: period,
            matchCategory: 'VALUE_MISMATCH',
            categoryLabel: 'E. Value Mismatch',
            purchaseInvoice: pinv,
            gstr2bRecord: candidate,
            discrepancyDiff: {
              taxableDiff: diff,
              taxDiff: Math.round((pTax - gTax) * 100) / 100,
              headDiff: 'Taxable amount discrepancy',
              remarks: `Books value (₹${pinv.taxableValue.toLocaleString('en-IN')}) differs from Portal value (₹${candidate.taxableValue.toLocaleString('en-IN')}).`,
            },
            aiExplanation: `Supplier reported taxable value of ₹${candidate.taxableValue.toLocaleString('en-IN')}, whereas client books record ₹${pinv.taxableValue.toLocaleString('en-IN')} (Difference: ₹${Math.abs(diff).toLocaleString('en-IN')}).`,
            suggestedAction: 'Accept 2B value as cap or issue vendor discrepancy debit note.',
            resolutionStatus: 'PENDING',
          });
        } else {
          // Tax Head Mismatch (e.g. IGST vs CGST+SGST)
          reconItems.push({
            id: `recon-tm-${Date.now()}-${reconItems.length + 1}`,
            clientId,
            financialYear: fy,
            taxPeriod: period,
            matchCategory: 'TAX_MISMATCH',
            categoryLabel: 'F. Tax Mismatch / Head Difference',
            purchaseInvoice: pinv,
            gstr2bRecord: candidate,
            discrepancyDiff: {
              taxableDiff: 0,
              taxDiff: Math.round((pTax - gTax) * 100) / 100,
              headDiff: pinv.igst > 0 && candidate.cgst > 0 ? 'IGST in Books vs CGST+SGST in Portal (Place of Supply mismatch)' : 'Tax head allocation discrepancy',
              remarks: 'Tax head distribution differs between client books and supplier portal filing.',
            },
            aiExplanation: 'Taxable value matches exactly, but tax head allocation differs (POS mismatch or incorrect interstate treatment).',
            suggestedAction: 'Adjust tax head in Books or request supplier to amend in GSTR-1 Table 9.',
            resolutionStatus: 'PENDING',
          });
        }
      }
    });

    // PASS 2: Fuzzy Invoice Number Match (Same GSTIN + Same Taxable Value, slight invoice variation)
    purchaseList.forEach((pinv) => {
      if (matchedPurchaseIds.has(pinv.id)) return;
      const pGstin = cleanGSTIN(pinv.supplierGstin);
      const pFuzzy = normalizeInvoiceForFuzzy(pinv.invoiceNumber);

      const candidate = gstr2bList.find((g) => {
        if (matched2BIds.has(g.id)) return false;
        const gGstin = cleanGSTIN(g.supplierGstin);
        if (gGstin !== pGstin) return false;
        const diff = Math.abs(pinv.taxableValue - g.taxableValue);
        if (diff > 1.0) return false;

        const gFuzzy = normalizeInvoiceForFuzzy(g.invoiceNumber);
        return gFuzzy === pFuzzy || gFuzzy.includes(pFuzzy) || pFuzzy.includes(gFuzzy);
      });

      if (candidate) {
        matched2BIds.add(candidate.id);
        matchedPurchaseIds.add(pinv.id);

        reconItems.push({
          id: `recon-fuzz-${Date.now()}-${reconItems.length + 1}`,
          clientId,
          financialYear: fy,
          taxPeriod: period,
          matchCategory: 'INVOICE_NUM_MISMATCH',
          categoryLabel: 'H. Invoice No. Format Mismatch',
          purchaseInvoice: pinv,
          gstr2bRecord: candidate,
          discrepancyDiff: {
            taxableDiff: 0,
            taxDiff: 0,
            headDiff: 'Invoice Number typo/prefix',
            remarks: `Books invoice '${pinv.invoiceNumber}' matched with Portal '${candidate.invoiceNumber}' via fuzzy algorithm.`,
          },
          aiExplanation: `Same Supplier GSTIN and exact same Taxable Amount (₹${pinv.taxableValue.toLocaleString('en-IN')}), but invoice number format differs ('${pinv.invoiceNumber}' vs '${candidate.invoiceNumber}').`,
          suggestedAction: 'Link and approve match. Update purchase voucher reference in Tally/Zoho.',
          resolutionStatus: 'PENDING',
        });
      }
    });

    // PASS 3: Remaining Unmatched in Purchase Register -> MISSING_IN_GSTR2B
    purchaseList.forEach((pinv) => {
      if (matchedPurchaseIds.has(pinv.id)) return;

      const isDup = (purchaseInvCounts.get(`${cleanGSTIN(pinv.supplierGstin)}_${cleanInvoiceNumber(pinv.invoiceNumber)}`) || 0) > 1;

      if (isDup) {
        reconItems.push({
          id: `recon-dup-${Date.now()}-${reconItems.length + 1}`,
          clientId,
          financialYear: fy,
          taxPeriod: period,
          matchCategory: 'DUPLICATE_INVOICE',
          categoryLabel: 'J. Duplicate Purchase Entry',
          purchaseInvoice: pinv,
          aiExplanation: `Duplicate voucher entry found in client purchase register for Invoice ${pinv.invoiceNumber} from ${pinv.supplierName}.`,
          suggestedAction: 'Reverse duplicate voucher in client accounting records.',
          resolutionStatus: 'PENDING',
        });
      } else {
        reconItems.push({
          id: `recon-mis2b-${Date.now()}-${reconItems.length + 1}`,
          clientId,
          financialYear: fy,
          taxPeriod: period,
          matchCategory: 'MISSING_IN_GSTR2B',
          categoryLabel: 'C. Missing in GSTR-2B (Supplier Non-Filing)',
          purchaseInvoice: pinv,
          aiExplanation: `Purchase invoice ₹${pinv.taxableValue.toLocaleString('en-IN')} (Tax: ₹${(pinv.igst + pinv.cgst + pinv.sgst).toLocaleString('en-IN')}) is recorded in client books but NOT uploaded by vendor in GSTR-1. Claiming ITC carries Section 16(2)(aa) audit risk.`,
          suggestedAction: 'Trigger Automated WhatsApp/Email reminder to vendor requesting immediate GSTR-1 IFF filing.',
          resolutionStatus: 'PENDING',
        });
      }
    });

    // PASS 4: Remaining Unmatched in GSTR-2B -> MISSING_PURCHASE_INVOICE
    gstr2bList.forEach((g) => {
      if (matched2BIds.has(g.id)) return;

      if (g.invoiceType === 'CR' || g.taxableValue < 0) {
        reconItems.push({
          id: `recon-cr-${Date.now()}-${reconItems.length + 1}`,
          clientId,
          financialYear: fy,
          taxPeriod: period,
          matchCategory: 'POSSIBLE_CREDIT_NOTE',
          categoryLabel: 'K. Credit Note from Supplier',
          gstr2bRecord: g,
          aiExplanation: `Credit Note of ₹${Math.abs(g.taxableValue).toLocaleString('en-IN')} issued by ${g.supplierName} reflected on GST portal. ITC must be reduced in GSTR-3B Table 4(B)(2).`,
          suggestedAction: 'Book credit note in Purchase Register and reduce ITC.',
          resolutionStatus: 'PENDING',
        });
      } else {
        reconItems.push({
          id: `recon-misp-${Date.now()}-${reconItems.length + 1}`,
          clientId,
          financialYear: fy,
          taxPeriod: period,
          matchCategory: 'MISSING_PURCHASE_INVOICE',
          categoryLabel: 'D. Missing in Books (Unclaimed ITC)',
          gstr2bRecord: g,
          aiExplanation: `Supplier ${g.supplierName} has filed invoice ${g.invoiceNumber} (ITC ₹${(g.igst + g.cgst + g.sgst).toLocaleString('en-IN')}) on GST portal, but bill has NOT been booked by client accountant. Opportunity to claim additional ITC!`,
          suggestedAction: 'Request original tax invoice PDF from client and book voucher before return filing.',
          resolutionStatus: 'PENDING',
        });
      }
    });

    return reconItems;
  },

  // -------------------------------------------------------------
  // 4. Download Sample Excel Templates (.xlsx)
  // -------------------------------------------------------------
  downloadSampleGSTR2BTemplate: () => {
    const sampleRows = [
      {
        'GSTIN of Supplier': '24AAACT1234F1ZP',
        'Trade/Legal Name': 'Tata Steel Processing Ltd',
        'Invoice Number': 'TSP/2026/0891',
        'Invoice Type': 'B2B',
        'Invoice Date': '15-Jul-2026',
        'Invoice Value': 531000,
        'Place of Supply': '24-Gujarat',
        'Supply Attract Reverse Charge': 'N',
        'Rate (%)': 18,
        'Taxable Value (₹)': 450000,
        'Integrated Tax (₹)': 0,
        'Central Tax (₹)': 40500,
        'State/UT Tax (₹)': 40500,
        'Cess (₹)': 0,
        'GSTR-2B ITC Availability': 'Y',
        'Reason': '',
        'GSTR-1/IFF Filing Date': '10-Aug-2026',
      },
      {
        'GSTIN of Supplier': '24AAACU9988D1ZQ',
        'Trade/Legal Name': 'UltraTech Cement Distributors',
        'Invoice Number': 'UTC-JUL-402',
        'Invoice Type': 'B2B',
        'Invoice Date': '18-Jul-2026',
        'Invoice Value': 330400,
        'Place of Supply': '24-Gujarat',
        'Supply Attract Reverse Charge': 'N',
        'Rate (%)': 18,
        'Taxable Value (₹)': 280000,
        'Integrated Tax (₹)': 0,
        'Central Tax (₹)': 25200,
        'State/UT Tax (₹)': 25200,
        'Cess (₹)': 0,
        'GSTR-2B ITC Availability': 'Y',
        'Reason': '',
        'GSTR-1/IFF Filing Date': '11-Aug-2026',
      },
      {
        'GSTIN of Supplier': '27AABCS5544K1ZR',
        'Trade/Legal Name': 'Sun Pharma Distribution Ltd',
        'Invoice Number': 'SUN/2026/774',
        'Invoice Type': 'B2B',
        'Invoice Date': '21-Jul-2026',
        'Invoice Value': 147500,
        'Place of Supply': '24-Gujarat',
        'Supply Attract Reverse Charge': 'N',
        'Rate (%)': 18,
        'Taxable Value (₹)': 125000,
        'Integrated Tax (₹)': 22500,
        'Central Tax (₹)': 0,
        'State/UT Tax (₹)': 0,
        'Cess (₹)': 0,
        'GSTR-2B ITC Availability': 'Y',
        'Reason': '',
        'GSTR-1/IFF Filing Date': '09-Aug-2026',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    worksheet['!cols'] = [
      { wch: 18 },
      { wch: 30 },
      { wch: 18 },
      { wch: 12 },
      { wch: 14 },
      { wch: 15 },
      { wch: 16 },
      { wch: 14 },
      { wch: 10 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'B2B');
    XLSX.writeFile(workbook, 'Sample_Official_GSTR2B_Portal_Template.xlsx');
  },

  downloadSamplePurchaseRegisterTemplate: () => {
    const sampleRows = [
      {
        'Party Name': 'Tata Steel Processing Ltd',
        'Party GSTIN': '24AAACT1234F1ZP',
        'Invoice No': 'TSP/2026/0891',
        'Invoice Date': '15-Jul-2026',
        'Taxable Value': 450000,
        'IGST Amount': 0,
        'CGST Amount': 40500,
        'SGST Amount': 40500,
        'Cess Amount': 0,
        'Total Invoice Value': 531000,
      },
      {
        'Party Name': 'UltraTech Cement Distributors',
        'Party GSTIN': '24AAACU9988D1ZQ',
        'Invoice No': 'UTC-JUL-402',
        'Invoice Date': '18-Jul-2026',
        'Taxable Value': 280000,
        'IGST Amount': 0,
        'CGST Amount': 25200,
        'SGST Amount': 25200,
        'Cess Amount': 0,
        'Total Invoice Value': 330400,
      },
      {
        'Party Name': 'Sun Pharma Distribution Ltd',
        'Party GSTIN': '27AABCS5544K1ZR',
        'Invoice No': 'SUN/2026/774',
        'Invoice Date': '21-Jul-2026',
        'Taxable Value': 125000,
        'IGST Amount': 22500,
        'CGST Amount': 0,
        'SGST Amount': 0,
        'Cess Amount': 0,
        'Total Invoice Value': 147500,
      },
      {
        'Party Name': 'Unfiled Local Vendor Ltd',
        'Party GSTIN': '24AABCL8899P1ZZ',
        'Invoice No': 'LOC-551',
        'Invoice Date': '25-Jul-2026',
        'Taxable Value': 85000,
        'IGST Amount': 0,
        'CGST Amount': 7650,
        'SGST Amount': 7650,
        'Cess Amount': 0,
        'Total Invoice Value': 100300,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    worksheet['!cols'] = [
      { wch: 30 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 18 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Register');
    XLSX.writeFile(workbook, 'Sample_Purchase_Register_Bills_Template.xlsx');
  },

  // -------------------------------------------------------------
  // 5. Export Full Reconciliation Report to Multi-Sheet Excel
  // -------------------------------------------------------------
  exportReconciliationToExcel: (
    items: ReconciliationItem[],
    clientName: string = 'Practice Client',
    period: string = 'July 2026'
  ) => {
    const cleanDate = new Date().toISOString().split('T')[0];

    const mappedRows = items.map((r, i) => {
      const p = r.purchaseInvoice;
      const g = r.gstr2bRecord;
      return {
        'Sr No': i + 1,
        'Match Category': r.categoryLabel,
        'Resolution': r.resolutionStatus,
        'Supplier Name (Books)': p?.supplierName || '-',
        'Supplier GSTIN (Books)': p?.supplierGstin || '-',
        'Inv No (Books)': p?.invoiceNumber || '-',
        'Inv Date (Books)': p?.invoiceDate || '-',
        'Taxable (Books)': p?.taxableValue || 0,
        'IGST (Books)': p?.igst || 0,
        'CGST (Books)': p?.cgst || 0,
        'SGST (Books)': p?.sgst || 0,
        'Total Tax (Books)': p ? p.igst + p.cgst + p.sgst : 0,
        'Supplier Name (2B)': g?.supplierName || '-',
        'Supplier GSTIN (2B)': g?.supplierGstin || '-',
        'Inv No (2B)': g?.invoiceNumber || '-',
        'Inv Date (2B)': g?.invoiceDate || '-',
        'Taxable (2B)': g?.taxableValue || 0,
        'IGST (2B)': g?.igst || 0,
        'CGST (2B)': g?.cgst || 0,
        'SGST (2B)': g?.sgst || 0,
        'Total Tax (2B)': g ? g.igst + g.cgst + g.sgst : 0,
        'ITC Status (2B)': g?.itcAvailability || '-',
        'Taxable Diff': r.discrepancyDiff?.taxableDiff || 0,
        'Tax Diff': r.discrepancyDiff?.taxDiff || 0,
        'AI Finding & Audit Rule': r.aiExplanation,
        'Recommended CA Action': r.suggestedAction,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(mappedRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reconciliation Summary');

    // Filter Missing in 2B (Vendor Follow-up Sheet)
    const missingIn2B = mappedRows.filter((r) => r['Match Category'].includes('Missing in GSTR-2B'));
    if (missingIn2B.length > 0) {
      const wsMissing = XLSX.utils.json_to_sheet(missingIn2B);
      XLSX.utils.book_append_sheet(workbook, wsMissing, 'Vendor Notice List');
    }

    XLSX.writeFile(workbook, `TaxNexus_Recon_${clientName.replace(/\s+/g, '_')}_${period}_${cleanDate}.xlsx`);
  },
};
