import { api } from "@/api/Client";

import type { AdminColorResponse } from "../types/response";

import type {
  CreateColorRequest,
  UpdateColorRequest,
} from "../types/request";

export async function getAdminColors(): Promise<AdminColorResponse[]> {
  const response = await api.get<AdminColorResponse[]>(
    "/admin/dashboard/get-colors",
  );

  return response.data;
}

export async function createAdminColor(
  data: CreateColorRequest,
): Promise<AdminColorResponse> {
  const response = await api.post<AdminColorResponse>(
    "/admin/dashboard/create-color",
    data,
  );

  return response.data;
}

export async function updateAdminColor(
  colorId: string,
  data: UpdateColorRequest,
): Promise<AdminColorResponse> {
  const response = await api.put<AdminColorResponse>(
    `/admin/dashboard/update-color/${colorId}`,
    data,
  );

  return response.data;
}

export async function deleteAdminColor(colorId: string): Promise<void> {
  await api.delete(`/admin/dashboard/delete-color/${colorId}`);
}
