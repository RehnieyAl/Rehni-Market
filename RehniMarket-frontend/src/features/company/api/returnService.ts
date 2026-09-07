import { api } from "@/api/Client";

import type {
  ReturnDecision,
  ReturnRequest,
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

export async function getCompanyReturnDetail(returnId: string): Promise<ReturnRequest> {
  const { data } = await api.get<ReturnRequest>(`/company/dashboard/returns/${returnId}`);
  return data;
}

export async function decideCompanyReturn(
  returnId: string,
  payload: { action: ReturnDecision; reason?: string },
): Promise<ReturnRequest> {
  const { data } = await api.patch<ReturnRequest>(
    `/company/dashboard/returns/${returnId}`,
    payload,
  );

  return data;
}
