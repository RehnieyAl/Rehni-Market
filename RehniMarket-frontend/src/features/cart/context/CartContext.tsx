import { createContext } from "react";
import type { Cart } from "../types/response";

export interface CartContextType {
  cart: Cart | null;
  loading: boolean;

  refreshCart(): Promise<void>;
  addItem(productId: string, quantity: number, variantId?: string): Promise<void>;
  updateItem(itemId: string, quantity: number): Promise<void>;
  removeItem(itemId: string): Promise<void>;
  clear(): Promise<void>;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);
