// Tipos del módulo de liquidaciones (ver ALCANCE > Módulo de
// liquidaciones): CompanyPayoutResponse es literalmente el mismo shape
// que devuelven tanto GET /company/payouts como GET /admin/payouts (ver
// PayoutService._to_response en el backend) - un solo set de tipos
// compartido por ambos dashboards, en vez de duplicarlo en
// features/company y features/admin.

export type BankAccountType = "savings" | "checking" | "nequi" | "daviplata";

// Mismos 4 valores que PayoutStatusEnum (ver ModelCompanyPayout.py) - solo
// "pending" y "paid" se usan hoy en la práctica (el backend solo
// implementa esa transición, ver PayoutService.mark_payout_paid_service),
// pero se tipan los 4 porque existen en el enum real.
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

// Cuenta bancaria embebida en un payout (ver PayoutBankAccountSummary en
// SchemaPayout.py) - accountNumber viene completo a propósito: quien
// procesa el pago (admin/owner) lo necesita para hacer la transferencia
// real. lastFourDigits se mantiene para vistas compactas.
export interface PayoutBankAccountSummary {
  bankName: string;
  accountType: BankAccountType;
  accountNumber: string;
  lastFourDigits: string;
}

// Decimal del backend (ver ALCANCE > FASE 2, "posibles problemas de
// integración") - Pydantic serializa Decimal como string, no como
// number, mismo criterio ya usado en WalletResponse.balance
// (features/wallet/types/response.ts). Se formatea con formatPrice, que
// ya acepta string | number.
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

// GET /company/balance (ver SchemaPayout.py > CompanyBalanceResponse).
export interface CompanyBalance {
  grossSalesAccumulated: string;
  commissionAccumulated: string;
  netBalance: string;
  nextPayoutDate: string;
}

// GET /admin/payouts/available-periods (ver SchemaPayout.py >
// PayoutAvailablePeriodResponse) - un mes calendario con ventas DELIVERED
// que todavía no tiene liquidación generada (ver
// PayoutService.list_available_payout_periods_service). Reemplaza al
// selector de mes libre: solo se ofrecen periodos reales y liquidables.
export interface PayoutAvailablePeriod {
  periodStart: string;
  periodEnd: string;
}

// GET /admin/payouts/preview (ver SchemaPayout.py > PayoutPreviewResponse)
// - mismos campos que CompanyPayout, pero SIN id/payoutStatus/createdAt:
// todavía no existe ninguna liquidación, es solo la proyección de lo que
// se generaría con esta empresa+periodo (ver PayoutService._resolve_payout_preview,
// misma validación/cálculo que POST /admin/payouts/generate).
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
