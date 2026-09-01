import { api } from "./client";

import type { Wallet, WalletTransactionsPaginated } from "@/types/wallet";

export async function getMyWallet(): Promise<Wallet> {
  const { data } = await api.get<Wallet>("/wallet/me");
  return data;
}

export async function getMyTransactions(
  page = 1,
  limit = 10,
): Promise<WalletTransactionsPaginated> {
  const { data } = await api.get<WalletTransactionsPaginated>("/wallet/transactions", {
    params: { page, limit },
  });
  return data;
}
