import { api } from "./client";

import type { AddCartItemRequest, Cart, UpdateCartItemRequest } from "@/types/cart";

export async function getCart(): Promise<Cart> {
  const { data } = await api.get<Cart>("/cart");
  return data;
}

export async function addToCart(payload: AddCartItemRequest): Promise<Cart> {
  const { data } = await api.post<Cart>("/cart/add", payload);
  return data;
}

export async function updateCartItem(
  itemId: string,
  payload: UpdateCartItemRequest,
): Promise<Cart> {
  const { data } = await api.patch<Cart>(`/cart/item/${itemId}`, payload);
  return data;
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  const { data } = await api.delete<Cart>(`/cart/item/${itemId}`);
  return data;
}

export async function clearCart(): Promise<Cart> {
  const { data } = await api.delete<Cart>("/cart/clear");
  return data;
}
