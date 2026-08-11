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
  user_id: string;
  addressCompany: string;
  CompanyNIT: string;
  CompanyBanner: string | null;
  CompanyCertificateStatus: CompanyCertificateStatus;
  created_at: string;
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

