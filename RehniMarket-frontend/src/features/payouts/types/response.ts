export type BankAccountType = "savings" | "checking" | "nequi" | "daviplata";

export type PayoutStatus = "pending" | "processing" | "paid" | "failed";

export interface BankAccount {
  id: string;
  accountHolder: string;
  documentNumber: string;
  bankName: string;
  accountType: BankAccountType;
  accountNumber: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface PayoutBankAccountSummary {
  bankName: string;
  accountType: BankAccountType;
  accountNumber: string;
  lastFourDigits: string;
}

export interface RehniCoinMovement {
  amountCop: string;
  rehniCoins: string;
  conversionRate: string;
  createdAt: string;
}

export interface CompanyPayout {
  id: string;
  companyId: string;
  companyName: string | null;

  periodStart: string;
  periodEnd: string;

  grossSales: string;
  commissionPercentage: string;
  commissionAmount: string;
  netAmount: string;

  payoutStatus: PayoutStatus;

  bankAccount: PayoutBankAccountSummary;
  rehniCoinMovement: RehniCoinMovement | null;

  paidAt: string | null;
  createdAt: string;
}

export interface CompanyPayoutsPaginated {
  items: CompanyPayout[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CompanyBalance {
  grossSalesAccumulated: string;
  commissionAccumulated: string;
  netBalance: string;
  nextPayoutDate: string;
}

export interface PayoutAvailablePeriod {
  periodStart: string;
  periodEnd: string;
}

export interface PayoutPreview {
  companyId: string;
  companyName: string;
  periodStart: string;
  periodEnd: string;
  grossSales: string;
  commissionPercentage: string;
  commissionAmount: string;
  netAmount: string;
  bankAccount: PayoutBankAccountSummary;
}
