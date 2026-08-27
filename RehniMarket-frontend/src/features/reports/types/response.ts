// Mismos valores reales que ModelReport.py (backend) - única fuente de
// verdad, ver ALCANCE > Reportes, sección 8 (estados) y 5 (target_type).
export type ReportTargetType = "product" | "company";
export type ReportStatus = "pending" | "reviewing" | "resolved" | "rejected";

export interface ReportListItem {
  id: string;
  targetType: ReportTargetType;
  targetLabel: string;
  companyName: string | null;
  reporterName: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
}

export interface ReportsPaginatedResponse {
  items: ReportListItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ReportEvidence {
  id: string;
  url: string;
}

export interface ReportDetail {
  id: string;
  targetType: ReportTargetType;

  // IDs, nunca una URL guardada (ver ALCANCE > Reportes, sección 11/15) -
  // el enlace "Ver producto"/"Ver empresa" se arma acá, en el frontend,
  // con estos IDs y las rutas ya existentes (/products/:id,
  // /company/:companyId - ver ReportDetailModal.tsx).
  productId: string | null;
  productName: string | null;

  companyId: string | null;
  companyName: string | null;

  reporterId: string;
  reporterName: string;
  reporterEmail: string;

  reason: string;
  description: string | null;

  status: ReportStatus;
  adminResponse: string | null;

  resolvedByName: string | null;

  evidences: ReportEvidence[];

  createdAt: string;
  updatedAt: string | null;
  resolvedAt: string | null;
}
