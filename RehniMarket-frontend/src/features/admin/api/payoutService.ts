import { api } from "@/api/Client";

import type {
  CompanyPayout,
  CompanyPayoutsPaginated,
  PayoutAvailablePeriod,
  PayoutPreview,
  PayoutStatus,
} from "@/features/payouts/types/response";

// Módulo de liquidaciones del panel admin (ver ALCANCE > Módulo de
// liquidaciones, Fase 7) - exclusivo admin/owner (ver AdminPayoutRouter.py,
// revalidado también en el backend). Único lado que puede generar una
// liquidación nueva o marcarla como pagada.

export interface GeneratePayoutPayload {
  companyId: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
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

// GET /admin/payouts/available-periods (ver ALCANCE > selector "Mes a
// liquidar" ya no es texto libre) - solo meses con ventas DELIVERED que
// todavía no tienen liquidación generada para esta empresa.
export async function getAvailablePayoutPeriods(companyId: string): Promise<PayoutAvailablePeriod[]> {
  const { data } = await api.get<PayoutAvailablePeriod[]>("/admin/payouts/available-periods", {
    params: { company_id: companyId },
  });

  return data;
}

// GET /admin/payouts/preview (ver ALCANCE > mejora "vista previa" del
// GeneratePayoutModal) - misma validación/cálculo que generatePayout de
// arriba, sin crear nada. Se llama automáticamente al elegir
// empresa+mes, antes de habilitar el botón "Generar liquidación".
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
