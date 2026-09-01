import type { AttributePair } from "@/shared/utils/formatAttributes";

export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string | null;
  sku: string | null;
  image: string | null;
  options: AttributePair[];
  companyId: string;
  companyName: string;
  basePrice: string;
  unitPrice: string;
  discountPercentage: number | null;
  appliesTax: boolean;
  taxAmount: string;
  quantity: number;
  subtotal: string;
  availableStock: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: string;
  tax: string;
  total: string;
  totalItems: number;
}
