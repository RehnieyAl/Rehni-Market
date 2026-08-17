export interface CartItemColor {
  name: string;
  hex_color: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string | null;
  image: string | null;
  color: CartItemColor | null;
  companyId: string;
  companyName: string;
  // Pydantic serializa Decimal como string en JSON.
  unitPrice: string;
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
