// Tipos del módulo de liquidaciones, compartidos por los dashboards de company y admin
// (mismo shape que PayoutService._to_response).

export type BankAccountType = "savings" | "checking" | "nequi" | "daviplata";

// Mismos 4 valores que PayoutStatusEnum; hoy solo se usan "pending" y "paid".
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

// Cuenta bancaria embebida en un payout. accountNumber va completo (admin/owner lo necesita);
// lastFourDigits para vistas compactas.
export interface PayoutBankAccountSummary {
  bankName: string;
  accountType: BankAccountType;
  accountNumber: string;
  lastFourDigits: string;
}

// Pydantic serializa Decimal como string. Se formatea con formatPrice (acepta string | number).
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

// GET /company/balance.
export interface CompanyBalance {
  grossSalesAccumulated: string;
  commissionAccumulated: string;
  netBalance: string;
  nextPayoutDate: string;
}

// GET /admin/payouts/available-periods: un mes con ventas DELIVERED sin liquidación generada.
export interface PayoutAvailablePeriod {
  periodStart: string;
  periodEnd: string;
}

// GET /admin/payouts/preview: como CompanyPayout pero sin id/payoutStatus/createdAt (aún no existe la liquidación).
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
