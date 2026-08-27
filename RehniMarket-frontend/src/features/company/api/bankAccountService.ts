import { api } from "@/api/Client";

import type { BankAccount, BankAccountType } from "@/features/payouts/types/response";

// Cuentas bancarias de la empresa (ver ALCANCE > Módulo de liquidaciones,
// Fase 1) - CRUD real contra /company/bank-accounts (ver
// BankAccountRouter.py). Único lado que puede mutarlas: el admin nunca
// crea/edita cuentas bancarias de una empresa, solo las lee de forma
// resumida embebidas en un payout (ver features/admin/api/payoutService.ts).

export interface BankAccountFormPayload {
  accountHolder: string;
  documentNumber: string;
  bankName: string;
  accountType: BankAccountType;
  accountNumber: string;
  isDefault?: boolean;
}

export async function getBankAccounts(): Promise<BankAccount[]> {
  const { data } = await api.get<BankAccount[]>("/company/bank-accounts");
  return data;
}

export async function createBankAccount(
  payload: BankAccountFormPayload,
): Promise<BankAccount> {
  const { data } = await api.post<BankAccount>("/company/bank-accounts", payload);
  return data;
}

export async function updateBankAccount(
  bankAccountId: string,
  payload: Partial<BankAccountFormPayload>,
): Promise<BankAccount> {
  const { data } = await api.patch<BankAccount>(
    `/company/bank-accounts/${bankAccountId}`,
    payload,
  );
  return data;
}

export async function deleteBankAccount(bankAccountId: string): Promise<void> {
  await api.delete(`/company/bank-accounts/${bankAccountId}`);
}
