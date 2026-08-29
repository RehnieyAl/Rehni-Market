import type { AttributePair } from "@/shared/utils/formatAttributes";

export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string | null;
  sku: string | null;
  image: string | null;
  // Opciones legibles de la variante (Color: Negro, Talla: 40).
  options: AttributePair[];
  companyId: string;
  companyName: string;
  // Pydantic serializa Decimal como string en JSON.
  basePrice: string;
  unitPrice: string;
  discountPercentage: number | null;
  quantity: number;
  subtotal: string;
  availableStock: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: string;
  totalItems: number;
}
