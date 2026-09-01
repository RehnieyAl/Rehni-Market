import { api } from "@/api/Client";

import type {
  CompanyBalance,
  CompanyPayout,
  CompanyPayoutsPaginated,
} from "@/features/payouts/types/response";

export async function getCompanyPayouts(
  page = 1,
  limit = 10,
): Promise<CompanyPayoutsPaginated> {
  const { data } = await api.get<CompanyPayoutsPaginated>("/company/payouts", {
    params: { page, limit },
  });

  return data;
}

export async function getCompanyPayoutDetail(payoutId: string): Promise<CompanyPayout> {
  const { data } = await api.get<CompanyPayout>(`/company/payouts/${payoutId}`);
  return data;
}

export async function getCompanyBalance(): Promise<CompanyBalance> {
  const { data } = await api.get<CompanyBalance>("/company/balance");
  return data;
}
