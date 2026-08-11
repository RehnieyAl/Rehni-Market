export interface UpdateAdminUserRequest {
  email?: string;
  role?: "user" | "admin";
}