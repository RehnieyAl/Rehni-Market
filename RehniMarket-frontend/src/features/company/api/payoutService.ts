import { api } from "@/api/Client";

import type {
  CompanyBalance,
  CompanyPayout,
  CompanyPayoutsPaginated,
} from "@/features/payouts/types/response";

// Liquidaciones y balance del lado empresa (ver ALCANCE > Módulo de
// liquidaciones, Fase 6) - siempre de solo lectura, la empresa nunca
// genera ni marca como pagada su propia liquidación (eso es exclusivo
// admin, ver features/admin/api/payoutService.ts).

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
