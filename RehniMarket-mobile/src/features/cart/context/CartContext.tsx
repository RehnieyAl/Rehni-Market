import { createContext } from "react";

import type { Cart } from "@/types/cart";

export interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  pendingItemId: string | null;
  totalItems: number;

  refreshCart(): Promise<void>;
  addItem(productId: string, quantity: number, variantId?: string): Promise<void>;
  updateItem(itemId: string, quantity: number): Promise<void>;
  removeItem(itemId: string): Promise<void>;
  clear(): Promise<void>;
}

export const CartContext = createContext<CartContextValue | undefined>(undefined);
