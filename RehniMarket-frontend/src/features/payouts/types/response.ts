/** Tipos de liquidaciones, cuentas bancarias de empresa y catálogo de bancos (respuestas de la API). */

export type BankAccountType = "savings" | "checking" | "nequi" | "daviplata";

export type PayoutStatus = "pending" | "processing" | "paid" | "failed";

/** Cuenta de la empresa tal como la devuelve la API: el número llega enmascarado (últimos 4 dígitos).
 * `bankId` es null en cuentas anteriores al catálogo de bancos que aún no se enlazaron. */
export interface BankAccount {
  id: string;
  accountHolder: string;
  documentNumber: string;
  bankId: string | null;
  bankName: string;
  bankLogoUrl: string | null;
  accountType: BankAccountType;
  lastFourDigits: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string | null;
}

/** Banco activo del catálogo que una empresa puede elegir. */
export interface BankOption {
  id: string;
  name: string;
  logoUrl: string | null;
}

/** Banco del catálogo visto por administración (incluye inactivos y cuentas enlazadas). */
export interface AdminBank extends BankOption {
  isActive: boolean;
  accountsCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface PayoutBankAccountSummary {
  bankName: string;
  accountType: BankAccountType;
  accountNumber: string;
  lastFourDigits: string;
}

interface RehniCoinMovement {
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
  /** Reembolsos de devoluciones descontados; grossSales ya es neto de este valor. */
  refundsAmount: string;
  commissionPercentage: string;
  commissionAmount: string;
  netAmount: string;

  payoutStatus: PayoutStatus;

  bankAccount: PayoutBankAccountSummary;
  rehniCoinMovement: RehniCoinMovement | null;

  paidAt: string | null;
  createdAt: string;

  /** Quinto día hábil (Colombia) tras el cierre, AAAA-MM-DD. `isOverdue` es solo un indicador visual. */
  consignmentDeadline: string;
  isOverdue: boolean;
}

export interface CompanyPayoutsPaginated {
  items: CompanyPayout[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

/** Fila del listado del owner. Con `isGenerated: false` es un mes cerrado aún sin liquidar: sin id, con
 * importes estimados por el backend y `bankAccount` nulo si la empresa no tiene cuenta predeterminada. */
export interface AdminPayoutListItem extends Omit<CompanyPayout, "id" | "bankAccount" | "createdAt"> {
  id: string | null;
  isGenerated: boolean;
  bankAccount: PayoutBankAccountSummary | null;
  createdAt: string | null;
}

export interface AdminPayoutsPaginated {
  items: AdminPayoutListItem[];
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
  /** Reembolsos de devoluciones descontados; grossSales ya es neto de este valor. */
  refundsAmount: string;
  commissionPercentage: string;
  commissionAmount: string;
  netAmount: string;
  bankAccount: PayoutBankAccountSummary;
}
