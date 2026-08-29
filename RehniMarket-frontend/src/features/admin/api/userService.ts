import { api } from "@/api/Client";

import type {
  AdminUserResponse,
  AdminUsersPaginatedResponse,
} from "../types/response";

import type {
  UpdateAdminUserRequest,
} from "../types/request";

export async function getAdminUsers(
  limit: number = 10,
  cursor?: string,
  beforeCursor?: string,
  search?: string,
): Promise<AdminUsersPaginatedResponse> {

  const response =
    await api.get<AdminUsersPaginatedResponse>(
      "/admin/dashboard/get-users",
      {
        params: {
          limit,
          cursor,
          before_cursor: beforeCursor,
          search: search || undefined,
        },
      },
    );

  return response.data;
}

export async function getAdminUserById(
  userId: string,
): Promise<AdminUserResponse> {

  const response =
    await api.get<AdminUserResponse>(
      `/admin/dashboard/get-user/${userId}`,
    );

  return response.data;
}

export const updateAdminUser = async (
  userId: string,
  data: UpdateAdminUserRequest,
): Promise<AdminUserResponse> => {
  const response = await api.patch<AdminUserResponse>(
    `/admin/dashboard/user/update-information/${userId}`,
    data,
  );

  return response.data;
};

export const toggleAdminUserStatus = async (
  userId: string,
): Promise<AdminUserResponse> => {

  const response =
    await api.patch<AdminUserResponse>(
      `/admin/dashboard/user/update-information/status/${userId}`,
    );

  return response.data;
};

export const deleteAdminUser = async (userId: string): Promise<void> => {
  await api.delete(`/admin/dashboard/user/delete/${userId}`);
};