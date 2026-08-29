import type { AdvertisementTargetType } from "./request";

export type CompanyCertificateStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface AdminCompanyResponse {
  id: string;
  nameCompany: string;
  CompanyNITDV: string;
  CompanyLogo: string | null;
  CompanyCertificate: string;
  CompanyStatus: boolean;
  // Motivo de suspensión vigente; null mientras CompanyStatus es true.
  suspensionReason: string | null;
  user_id: string;
  addressCompany: string;
  CompanyNIT: string;
  CompanyBanner: string | null;
  CompanyCertificateStatus: CompanyCertificateStatus;
  created_at: string;
}

// Respuesta de PATCH .../company/status/{id}: la empresa actualizada + el resultado del reembolso.
// 0/"0" al desbloquear o al suspender una empresa sin pedidos PENDING/PAID/PROCESSING.
export interface UpdateCompanyStatusResponse extends AdminCompanyResponse {
  affectedOrdersCount: number;
  totalRefunded: string;
}

export interface AdminCompaniesPaginatedResponse {
  items: AdminCompanyResponse[];
  next_cursor: string | null;
  has_next: boolean;
}

export interface AdminUserResponse {
  id: string;
  fullName: string;
  email: string;
  tell: string;
  profileImagen: string | null;
  role: string;
  isActive: boolean;
  created_at: string;
}

export interface AdminUsersPaginatedResponse {
  items: AdminUserResponse[];
  next_cursor: string | null;
  previous_cursor: string | null;
  has_next: boolean;
  has_previous: boolean;
}

export interface AdminDashboardStatisticsResponse {
  users: number;
  companies: number;
  active_users: number;
  blocked_users: number;
  administrators: number;
  active_companies: number;
  blocked_companies: number;
}

export type AdminActivityAction =
  | "user_created"
  | "user_updated"
  | "user_upgraded"
  | "user_blocked"
  | "user_unblocked"
  | "user_deleted"
  | "company_created"
  | "company_approved"
  | "company_rejected"
  | "company_blocked"
  | "company_unblocked";

export interface AdminRecentActivity {
  id: string;
  action: AdminActivityAction;
  title: string;
  description: string;
  created_at: string;
  target_user_id: string | null;
  target_company_id: string | null;
}

export interface AdminRecentUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  created_at: string;
}

export interface AdminCatalogResponse {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  // Productos activos y con stock válido; calculado en el backend.
  product_count: number;
}

export interface AdminColorResponse {
  id: string;
  name: string;
  hex_color: string;
}

export interface AdminSpecificationResponse {
  id: string;
  name: string;
  type: string;
  required: boolean;
  catalog_id: string;
}

export interface AdminAdvertisementResponse {
  id: string;
  title: string;
  description: string | null;
  // Desktop/tablet
  image_url: string;
  // Móvil, nullable: el Hero hace fallback a image_url
  mobile_image_url: string | null;
  button_text: string | null;
  // Lo calcula el backend con target_type != null; editable a mano solo con target_type null.
  button_link: string | null;
  is_active: boolean;
  order: number;
  created_at: string;

  target_type: AdvertisementTargetType | null;
  target_product_id: string | null;
  target_catalog_id: string | null;
  target_company_id: string | null;
  minimum_discount: number | null;
  maximum_stock: number | null;
  max_age_days: number | null;
}

