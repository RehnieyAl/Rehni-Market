/** API de la empresa para las reclamaciones de devolución de sus pedidos: listar, ver y decidir. */
import { api } from "@/api/Client";

import type {
  ReturnDecision,
  ReturnDetail,
  ReturnsPaginated,
  ReturnStatus,
} from "@/features/returns/types/response";

interface CompanyReturnsQuery {
  page?: number;
  limit?: number;
  status?: ReturnStatus | "all";
  search?: string;
}

export async function getCompanyReturns(
  query: CompanyReturnsQuery = {},
): Promise<ReturnsPaginated> {
  const { data } = await api.get<ReturnsPaginated>("/company/dashboard/returns", {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      status: query.status && query.status !== "all" ? query.status : undefined,
      search: query.search?.trim() || undefined,
    },
  });

  return data;
}

export async function getCompanyReturnDetail(returnId: string): Promise<ReturnDetail> {
  const { data } = await api.get<ReturnDetail>(`/company/dashboard/returns/${returnId}`);
  return data;
}

/** `reason`: explicación al aprobar (opcional) o motivo del rechazo (obligatorio). */
export async function decideCompanyReturn(
  returnId: string,
  payload: { action: ReturnDecision; subject?: string; reason?: string },
): Promise<ReturnDetail> {
  const { data } = await api.patch<ReturnDetail>(
    `/company/dashboard/returns/${returnId}`,
    payload,
  );

  return data;
}
