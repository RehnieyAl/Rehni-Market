/** Servicios de cuentas bancarias de la empresa y del catálogo de bancos activos que puede elegir. */
import { api } from "@/api/Client";

import type { BankAccount, BankAccountType, BankOption } from "@/features/payouts/types/response";

export interface BankAccountFormPayload {
  accountHolder: string;
  documentNumber: string;
  bankId: string;
  accountType: BankAccountType;
  accountNumber: string;
  isDefault?: boolean;
}

export async function getBankAccounts(): Promise<BankAccount[]> {
  const { data } = await api.get<BankAccount[]>("/company/bank-accounts");
  return data;
}

export async function getAvailableBanks(): Promise<BankOption[]> {
  const { data } = await api.get<BankOption[]>("/company/bank-accounts/banks");
  return data;
}

export async function createBankAccount(payload: BankAccountFormPayload): Promise<BankAccount> {
  const { data } = await api.post<BankAccount>("/company/bank-accounts", payload);
  return data;
}

/** Solo se envían los campos que cambian: sin `accountNumber`, el backend conserva el número guardado. */
export async function updateBankAccount(
  bankAccountId: string,
  payload: Partial<BankAccountFormPayload>,
): Promise<BankAccount> {
  const { data } = await api.patch<BankAccount>(`/company/bank-accounts/${bankAccountId}`, payload);
  return data;
}

export async function deleteBankAccount(bankAccountId: string): Promise<void> {
  await api.delete(`/company/bank-accounts/${bankAccountId}`);
}
