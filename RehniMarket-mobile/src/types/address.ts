export interface Address {
  id: string;
  label: string | null;
  fullName: string | null;
  country: string;
  department: string;
  city: string;
  address: string;
  postalCode: string | null;
  phone: string;
  additionalInstructions: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateAddressRequest {
  label: string;
  fullName: string;
  country: string;
  department: string;
  city: string;
  address: string;
  phone: string;
  postalCode?: string;
  additionalInstructions?: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  label?: string;
  fullName?: string;
  country?: string;
  department?: string;
  city?: string;
  address?: string;
  phone?: string;
  postalCode?: string;
  additionalInstructions?: string;
}
