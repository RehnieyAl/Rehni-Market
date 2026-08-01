import { api } from "../api/Client";
import type { MeResponse } from "../types/user"
export const getProfile = async (): Promise<MeResponse> => {
  const res = await api.get("/auth/me");
  return res.data;
};