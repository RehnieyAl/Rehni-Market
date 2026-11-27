/** Servicios del perfil público de empresa: perfil, productos, reputación y seguimiento. */
import { api } from "@/api/Client";

import type {
  PublicCompanyProfile,
  PublicCompanyProductsResponse,
  CompanyRating,
  CompanyFollowers,
  CompanyFollowStatus,
} from "../types/response";

export async function getPublicCompanyProfile(
  companyId: string,
): Promise<PublicCompanyProfile> {
  const { data } = await api.get<PublicCompanyProfile>(`/public/company/${companyId}`);

  return data;
}

export async function getCompanyRating(companyId: string): Promise<CompanyRating> {
  const { data } = await api.get<CompanyRating>(`/public/company/${companyId}/rating`);

  return data;
}

export async function getPublicCompanyProducts(
  companyId: string,
  page = 1,
  limit = 12,
): Promise<PublicCompanyProductsResponse> {
  const { data } = await api.get<PublicCompanyProductsResponse>(
    `/public/company/${companyId}/products`,
    { params: { page, limit } },
  );

  return data;
}

export async function getCompanyFollowers(companyId: string): Promise<CompanyFollowers> {
  const { data } = await api.get<CompanyFollowers>(`/public/company/${companyId}/followers`);

  return data;
}

export async function getCompanyFollowStatus(companyId: string): Promise<CompanyFollowStatus> {
  const { data } = await api.get<CompanyFollowStatus>(`/company-follows/${companyId}`);

  return data;
}

export async function followCompany(companyId: string): Promise<CompanyFollowStatus> {
  const { data } = await api.post<CompanyFollowStatus>(`/company-follows/${companyId}`);

  return data;
}

export async function unfollowCompany(companyId: string): Promise<CompanyFollowStatus> {
  const { data } = await api.delete<CompanyFollowStatus>(`/company-follows/${companyId}`);

  return data;
}
