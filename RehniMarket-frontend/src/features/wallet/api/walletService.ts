import { api } from "@/api/Client";

import type { Wallet, WalletTransactionsPaginated } from "../types/response";

export async function getMyWallet(): Promise<Wallet> {
  const { data } = await api.get<Wallet>("/wallet/me");
  return data;
}

export async function getMyTransactions(page = 1, limit = 10): Promise<WalletTransactionsPaginated> {
  const { data } = await api.get<WalletTransactionsPaginated>("/wallet/transactions", {
    params: { page, limit },
  });
  return data;
}

// Solo ADMIN/OWNER pueden llamar esto (el backend lo valida igual, ver
// WalletRouter.py) - se usa desde el panel de administración.
export async function rechargeWallet(
  userId: string,
  amount: number,
  description?: string,
): Promise<Wallet> {
  const { data } = await api.post<Wallet>("/wallet/recharge", {
    userId,
    amount,
    description,
  });
  return data;
}
