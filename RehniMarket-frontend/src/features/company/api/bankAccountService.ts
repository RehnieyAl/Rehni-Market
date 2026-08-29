import { api } from "@/api/Client";

import type { BankAccount, BankAccountType } from "@/features/payouts/types/response";

// CRUD de cuentas bancarias de la empresa contra /company/bank-accounts. El admin nunca las muta, solo las lee.

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
