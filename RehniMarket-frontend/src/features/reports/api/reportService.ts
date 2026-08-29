import { api } from "@/api/Client";

import type {
  ReportDetail,
  ReportsPaginatedResponse,
  ReportStatus,
  ReportTargetType,
} from "../types/response";

// Crea un reporte de producto o de empresa (usuario autenticado).
// multipart/form-data: las evidencias viajan como archivos; `evidences` es opcional.

export async function createReport(
  targetType: ReportTargetType,
  targetId: string,
  reason: string,
  description?: string,
  evidences?: File[],
): Promise<ReportDetail> {
  const formData = new FormData();

  formData.append("targetType", targetType);
  formData.append("targetId", targetId);
  formData.append("reason", reason);

  if (description) {
    formData.append("description", description);
  }

  for (const file of evidences ?? []) {
    formData.append("evidences", file);
  }

  const response = await api.post<ReportDetail>("/reports", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

// ADMIN - centro único de gestión (Admin > Reportes)

export type ReportTypeFilter = "all" | ReportTargetType;
export type ReportStatusFilter = "all" | ReportStatus;

export async function getAdminReports(
  page: number = 1,
  limit: number = 10,
  targetType: ReportTypeFilter = "all",
  status: ReportStatusFilter = "all",
  search?: string,
): Promise<ReportsPaginatedResponse> {
  const response = await api.get<ReportsPaginatedResponse>("/admin/reports", {
    params: {
      page,
      limit,
      target_type: targetType === "all" ? undefined : targetType,
      status: status === "all" ? undefined : status,
      search: search || undefined,
    },
  });

  return response.data;
}

export async function getAdminReport(reportId: string): Promise<ReportDetail> {
  const response = await api.get<ReportDetail>(`/admin/reports/${reportId}`);

  return response.data;
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  adminResponse?: string,
): Promise<ReportDetail> {
  const response = await api.patch<ReportDetail>(
    `/admin/reports/${reportId}/status`,
    {
      status,
      adminResponse: adminResponse || undefined,
    },
  );

  return response.data;
}
