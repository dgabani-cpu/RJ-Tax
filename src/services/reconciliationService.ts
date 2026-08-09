import { INITIAL_RECON_DATA } from '@/lib/db/mockDb';
import { ReconciliationItem, MatchCategory } from '@/types';

export const reconciliationService = {
  getReconciliationData: async (clientId?: string, category?: MatchCategory): Promise<ReconciliationItem[]> => {
    let filtered = INITIAL_RECON_DATA;

    if (clientId) {
      filtered = filtered.filter((r) => r.clientId === clientId);
    }

    if (category) {
      filtered = filtered.filter((r) => r.matchCategory === category);
    }

    return filtered;
  },

  getCategoryCounts: (clientId?: string) => {
    let dataset = INITIAL_RECON_DATA;
    if (clientId) {
      dataset = dataset.filter((r) => r.clientId === clientId);
    }

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
};
