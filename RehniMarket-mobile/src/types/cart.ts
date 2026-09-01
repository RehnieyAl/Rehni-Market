export interface AddCartItemRequest {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CartItemColor {
  name: string;
  hex_color: string;
}

export interface CartItemOption {
  attribute: string;
  value: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string | null;
  sku: string | null;
  image: string | null;
  color: CartItemColor | null;
  options: CartItemOption[];
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
