export interface Wallet {
  balance: string;
}

export type WalletTransactionType = "recharge" | "purchase" | "refund" | "adjustment";

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
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
