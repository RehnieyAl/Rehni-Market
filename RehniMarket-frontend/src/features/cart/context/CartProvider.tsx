import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { useAuth } from "@/features/public/auth/context/useAuth";

import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../api/cartService";

import { CartContext } from "./CartContext";
import type { Cart } from "../types/response";

interface Props {
  children: ReactNode;
}

export function CartProvider({ children }: Props) {
  const { role, user } = useAuth();
  const identity = user?.email ?? null;

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (role !== "user") {
      setCart(null);
      return;
    }

    try {
      setLoading(true);
      const data = await getCart();
      setCart(data);
    } catch (error) {
      console.error("Error cargando el carrito:", error);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    const loadCart = async () => {
      if (role !== "user") {
        setCart(null);
        return;
      }

      try {
        setLoading(true);
        const data = await getCart();
        setCart(data);
      } catch (error) {
        console.error("Error cargando el carrito:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [role, identity]);

  const addItem = async (productId: string, quantity: number, variantId?: string) => {
    const data = await addToCart({ productId, quantity, variantId });
    setCart(data);
  };

  const updateItem = async (itemId: string, quantity: number) => {
    const data = await updateCartItem(itemId, { quantity });
    setCart(data);
  };

  const removeItem = async (itemId: string) => {
    const data = await removeCartItem(itemId);
    setCart(data);
  };

  const clear = async () => {
    const data = await clearCart();
    setCart(data);
  };

  return (
    <CartContext.Provider
      value={{ cart, loading, refreshCart, addItem, updateItem, removeItem, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}
