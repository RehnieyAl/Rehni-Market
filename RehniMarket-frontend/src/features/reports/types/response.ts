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
