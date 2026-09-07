import { api } from "@/api/Client";

import type {
  AdminCompanyResponse,
  AdminCompaniesPaginatedResponse,
  UpdateCompanyStatusResponse,
} from "../types/response";

export type CompanyCertificateFilter =
  | "all"
  | "pending"
  | "approved"
  | "rejected"
  | "needs_update";

export async function getAdminCompanies(
  limit: number = 10,
  cursor?: string,
  search?: string,
  status: CompanyCertificateFilter = "all",
): Promise<AdminCompaniesPaginatedResponse> {
  const response = await api.get<AdminCompaniesPaginatedResponse>(
    "/admin/dashboard/get-companies",
    {
      params: {
        limit,
        cursor,
        search,
        status: status === "all" ? undefined : status,
      },
    },
  );

  return response.data;
}

export async function getAdminCompany(
  companyId: string,
): Promise<AdminCompanyResponse> {
  const response = await api.get<AdminCompanyResponse>(
    `/admin/dashboard/get-company/${companyId}`,
  );

  return response.data;
}

export type CertificateReviewAction = "approved" | "rejected" | "needs_update";

export async function updateCertificateStatus(
  companyId: string,
  status: CertificateReviewAction,
  reason?: string,
): Promise<void> {
  const needsReason = status === "rejected" || status === "needs_update";

  await api.patch(
    `/admin/dashboard/companies/certificate/status/${companyId}`,
    {
      status,
      // El backend exige `reason` para "rejected" y "needs_update" y sigue siendo la
      // autoridad final (400 MISSING_REQUIRED_FIELD si falta o viene en blanco).
      ...(needsReason ? { reason } : {}),
    },
  );
}

export async function updateCompanyStatus(
  companyId: string,
  status: boolean,
  reason?: string,
): Promise<UpdateCompanyStatusResponse> {
  const response = await api.patch<UpdateCompanyStatusResponse>(
    `/admin/dashboard/company/status/${companyId}`,
    {
      status,
      reason,
    },
  );

  return response.data;
}