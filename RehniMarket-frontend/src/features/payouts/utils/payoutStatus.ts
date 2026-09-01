import type { BadgeTone } from "@/shared/components/ui";

import type { BankAccountType, PayoutStatus } from "../types/response";

export const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  paid: "Pagada",
  failed: "Fallida",
};

export const PAYOUT_STATUS_TONE: Record<PayoutStatus, BadgeTone> = {
  pending: "warning",
  processing: "info",
  paid: "success",
  failed: "danger",
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
