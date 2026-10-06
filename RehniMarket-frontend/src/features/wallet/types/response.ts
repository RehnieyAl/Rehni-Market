export interface Wallet {
  balance: string;
}

export interface WalletTransaction {
  id: string;
  type: "recharge" | "purchase" | "refund" | "adjustment";
  amount: string;
  description: string | null;
  createdAt: string;
}

export interface WalletTransactionsPaginated {
  items: WalletTransaction[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface RechargeByEmailResult {
  balance: string;
  userName: string;
  userEmail: string;
}

export interface CorrectRechargeResult {
  balance: string;
  userName: string;
  userEmail: string;
  originalAmount: string;
  newAmount: string;
  adjustment: string;
  correctionTransactionId: string;
}

export interface WalletRechargeHistoryItem {
  id: string;
  createdAt: string;
  userName: string;
  userEmail: string;
  amount: string;
  description: string | null;
  createdByName: string | null;
  createdByEmail: string | null;
  isCorrected: boolean;
}

export interface WalletRechargeHistoryPaginated {
  items: WalletRechargeHistoryItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
