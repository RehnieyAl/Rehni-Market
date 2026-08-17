export interface AddCartItemRequest {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CheckoutRequest {
  addressId?: string;
}
