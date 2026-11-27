/** API de administración de reclamaciones de devolución: consulta, intervención, decisión, contacto y llamadas. */
import { api } from "@/api/Client";

import type {
  AdminReturnDetail,
  CallOutcome,
  ReturnDecision,
  ReturnsPaginated,
  ReturnStatus,
} from "@/features/returns/types/response";

interface AdminReturnsQuery {
  page?: number;
  limit?: number;
  status?: ReturnStatus | "all";
  search?: string;
}

export type ContactChannel = "company_contact" | "representative_account";

const base = (returnId: string) => `/admin/dashboard/returns/${returnId}`;

export async function getAdminReturns(query: AdminReturnsQuery = {}): Promise<ReturnsPaginated> {
  const { data } = await api.get<ReturnsPaginated>("/admin/dashboard/returns", {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      status: query.status && query.status !== "all" ? query.status : undefined,
      search: query.search?.trim() || undefined,
    },
  });
  return data;
}

export async function getAdminReturnDetail(returnId: string): Promise<AdminReturnDetail> {
  const { data } = await api.get<AdminReturnDetail>(base(returnId));
  return data;
}

export async function escalateReturn(returnId: string, reason: string): Promise<AdminReturnDetail> {
  const { data } = await api.post<AdminReturnDetail>(`${base(returnId)}/escalate`, { reason });
  return data;
}

export async function decideReturnAsAdmin(
  returnId: string,
  payload: { action: ReturnDecision; subject: string; message: string },
): Promise<AdminReturnDetail> {
  const { data } = await api.post<AdminReturnDetail>(`${base(returnId)}/decision`, payload);
  return data;
}

export async function contactCompany(
  returnId: string,
  payload: { channel: ContactChannel; subject: string; message: string },
): Promise<AdminReturnDetail> {
  const { data } = await api.post<AdminReturnDetail>(`${base(returnId)}/contact`, payload);
  return data;
}

export async function registerCall(
  returnId: string,
  payload: { calledAt: string; outcome: CallOutcome; notes: string },
): Promise<AdminReturnDetail> {
  const { data } = await api.post<AdminReturnDetail>(`${base(returnId)}/calls`, payload);
  return data;
}

export async function retryReturnNotification(returnId: string, notificationId: string): Promise<AdminReturnDetail> {
  const { data } = await api.post<AdminReturnDetail>(`${base(returnId)}/notifications/${notificationId}/retry`);
  return data;
}
