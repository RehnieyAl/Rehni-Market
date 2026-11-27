/** Servicios del catálogo de bancos para administración: listar, registrar y editar (con logo opcional). */
import { api } from "@/api/Client";

import type { AdminBank } from "@/features/payouts/types/response";

const BASE = "/admin/dashboard/banks";

export interface BankFormPayload {
  name?: string;
  isActive?: boolean;
  logo?: File | null;
}

function toFormData({ name, isActive, logo }: BankFormPayload): FormData {
  const form = new FormData();
  if (name !== undefined) form.append("name", name);
  if (isActive !== undefined) form.append("is_active", String(isActive));
  if (logo) form.append("logo", logo);
  return form;
}

export async function getAdminBanks(): Promise<AdminBank[]> {
  const { data } = await api.get<AdminBank[]>(BASE);
  return data;
}

export async function createBank(payload: BankFormPayload): Promise<AdminBank> {
  const { data } = await api.post<AdminBank>(BASE, toFormData(payload));
  return data;
}

export async function updateBank(bankId: string, payload: BankFormPayload): Promise<AdminBank> {
  const { data } = await api.patch<AdminBank>(`${BASE}/${bankId}`, toFormData(payload));
  return data;
}
