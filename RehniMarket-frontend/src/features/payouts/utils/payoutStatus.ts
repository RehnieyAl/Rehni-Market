import type { BankAccountType, PayoutStatus } from "../types/response";

// Única fuente de verdad de la etiqueta/color de cada estado de liquidación (empresa + admin).
export const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  paid: "Pagada",
  failed: "Fallida",
};

export const PAYOUT_STATUS_BADGE: Record<PayoutStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export const BANK_ACCOUNT_TYPE_LABEL: Record<BankAccountType, string> = {
  savings: "Ahorros",
  checking: "Corriente",
  nequi: "Nequi",
  daviplata: "Daviplata",
};

export const BANK_ACCOUNT_TYPE_OPTIONS: { value: BankAccountType; label: string }[] = [
  { value: "savings", label: "Ahorros" },
  { value: "checking", label: "Corriente" },
  { value: "nequi", label: "Nequi" },
  { value: "daviplata", label: "Daviplata" },
];
