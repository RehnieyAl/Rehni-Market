import { api } from "@/api/Client";

import type {
  CompanyPayout,
  CompanyPayoutsPaginated,
  PayoutAvailablePeriod,
  PayoutPreview,
  PayoutStatus,
} from "@/features/payouts/types/response";

export interface GeneratePayoutPayload {
  companyId: string;
  periodStart: string;
  periodEnd: string;
}

export async function getAdminPayouts(
  page = 1,
  limit = 10,
  status?: PayoutStatus,
): Promise<CompanyPayoutsPaginated> {
  const { data } = await api.get<CompanyPayoutsPaginated>("/admin/payouts", {
    params: { page, limit, status },
  });

  return data;
}

export async function getAdminPayoutDetail(payoutId: string): Promise<CompanyPayout> {
  const { data } = await api.get<CompanyPayout>(`/admin/payouts/${payoutId}`);
  return data;
}

export async function generatePayout(payload: GeneratePayoutPayload): Promise<CompanyPayout> {
  const { data } = await api.post<CompanyPayout>("/admin/payouts/generate", payload);
  return data;
}

export async function getAvailablePayoutPeriods(companyId: string): Promise<PayoutAvailablePeriod[]> {
  const { data } = await api.get<PayoutAvailablePeriod[]>("/admin/payouts/available-periods", {
    params: { company_id: companyId },
  });

  return data;
}

export async function getPayoutPreview(
  companyId: string,
  periodStart: string,
  periodEnd: string,
): Promise<PayoutPreview> {
  const { data } = await api.get<PayoutPreview>("/admin/payouts/preview", {
    params: { company_id: companyId, period_start: periodStart, period_end: periodEnd },
  });

  return data;
}

export async function markPayoutPaid(payoutId: string): Promise<CompanyPayout> {
  const { data } = await api.patch<CompanyPayout>(`/admin/payouts/${payoutId}/pay`);
  return data;
}
