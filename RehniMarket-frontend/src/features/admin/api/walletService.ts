import { api } from "@/api/Client";

import type {
  RechargeByEmailResult,
  WalletRechargeHistoryPaginated,
} from "@/features/wallet/types/response";

// Modulo RehniCoin del panel de administracion - exclusivo ADMIN/OWNER
// (el backend lo vuelve a validar, ver AdminWalletRouter.py). Identifica
// al usuario por email, a diferencia de features/wallet/api/walletService.ts
// > rechargeWallet (userId), que se usa desde la fila de un usuario
// puntual en la vista "Usuarios".
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
