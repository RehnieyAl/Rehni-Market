import { api } from "@/api/Client";
import type {
  AdminDashboardStatisticsResponse,
  AdminRecentActivity,
  AdminRecentUser
} from "@/features/admin/types/response";

export const getAdminDashboardStatistics =
  async (): Promise<AdminDashboardStatisticsResponse> => {
    const response = await api.get(
      "/admin/dashboard/statistics",
    );

    return response.data;
  };

export const getRecentAdminActivities = async (): Promise<
  AdminRecentActivity[]
> => {
  const response = await api.get<AdminRecentActivity[]>(
    "/admin/dashboard/recent-activities",
  );

  return response.data;
};

export const getRecentAdminUsers =
  async (): Promise<AdminRecentUser[]> => {
    const response = await api.get(
      "/admin/dashboard/recent-users",
    );

    return response.data;
  };
