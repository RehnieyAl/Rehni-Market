import type { CartItem } from "../types/response";

export function isCartItemUnavailable(item: CartItem): boolean {
  return item.availableStock <= 0 || item.quantity > item.availableStock;
}

export function cartItemExceedsStock(item: CartItem): boolean {
  return item.availableStock > 0 && item.quantity > item.availableStock;
}

export function cartHasUnavailableItems(items: CartItem[]): boolean {
  return items.some(isCartItemUnavailable);
}
