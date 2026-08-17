import { api } from "@/api/Client";

import type { Address } from "../types/response";
import type { CreateAddressRequest, UpdateAddressRequest } from "../types/request";

export async function getAddresses(): Promise<Address[]> {
  const { data } = await api.get<Address[]>("/addresses");
  return data;
}

export async function createAddress(payload: CreateAddressRequest): Promise<Address> {
  const { data } = await api.post<Address>("/addresses", payload);
  return data;
}

export async function updateAddress(
  addressId: string,
  payload: UpdateAddressRequest,
): Promise<Address> {
  const { data } = await api.patch<Address>(`/addresses/${addressId}`, payload);
  return data;
}

export async function deleteAddress(addressId: string): Promise<{ message: string }> {
  const { data } = await api.delete(`/addresses/${addressId}`);
  return data;
}

export async function setDefaultAddress(addressId: string): Promise<Address> {
  const { data } = await api.patch<Address>(`/addresses/${addressId}/set-default`);
  return data;
}
