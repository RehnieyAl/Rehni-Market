/** Contacto institucional de Rehni Market: lectura pública de lo publicado y edición exclusiva del owner. */
import { api } from "@/api/Client";

export interface PublicPlatformContact {
  email: string | null;
  phone: string | null;
}

export interface PlatformContact {
  contactEmail: string | null;
  contactPhone: string | null;
  emailPublic: boolean;
  phonePublic: boolean;
  updatedAt: string | null;
  updatedByName: string | null;
}

export type PlatformContactUpdate = Pick<PlatformContact, "contactEmail" | "contactPhone" | "emailPublic" | "phonePublic">;

export const getPublicPlatformContact = async (): Promise<PublicPlatformContact> => {
  const res = await api.get("/public/platform-contact");
  return res.data;
};

export const getPlatformContact = async (): Promise<PlatformContact> => {
  const res = await api.get("/admin/platform-settings/contact");
  return res.data;
};

export const updatePlatformContact = async (data: PlatformContactUpdate): Promise<PlatformContact> => {
  const res = await api.put("/admin/platform-settings/contact", data);
  return res.data;
};
