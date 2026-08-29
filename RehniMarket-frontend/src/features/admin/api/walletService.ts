import { api } from "@/api/Client";

import type {
  RechargeByEmailResult,
  WalletRechargeHistoryPaginated,
} from "@/features/wallet/types/response";

// Módulo RehniCoin del panel admin. Identifica al usuario por email (no por userId como rechargeWallet).
export async function rechargeWalletByEmail(
  email: string,
  amount: number,
  description?: string,
): Promise<RechargeByEmailResult> {
  const { data } = await api.post<RechargeByEmailResult>("/admin/wallet/recharge", {
    email,
    amount,
    description,
  });
  return data;
}

export async function getRechargeHistory(
  page = 1,
  limit = 10,
): Promise<WalletRechargeHistoryPaginated> {
  const { data } = await api.get<WalletRechargeHistoryPaginated>("/admin/wallet/history", {
    params: { page, limit },
  });
  return data;
}
