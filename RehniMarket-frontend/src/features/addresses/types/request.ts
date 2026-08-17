export interface CreateAddressRequest {
  label: string;
  fullName: string;
  country: string;
  department: string;
  city: string;
  address: string;
  postalCode?: string;
  phone: string;
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
  postalCode?: string;
  phone?: string;
  additionalInstructions?: string;
}
