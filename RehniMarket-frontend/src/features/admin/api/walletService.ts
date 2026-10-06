import { api } from "@/api/Client";

import type {
  CorrectRechargeResult,
  RechargeByEmailResult,
  WalletRechargeHistoryPaginated,
} from "@/features/wallet/types/response";

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

export async function correctRecharge(
  transactionId: string,
  newAmount: number,
  reason: string,
): Promise<CorrectRechargeResult> {
  const { data } = await api.post<CorrectRechargeResult>(
    `/admin/wallet/recharge/${transactionId}/correction`,
    { newAmount, reason },
  );
  return data;
}
