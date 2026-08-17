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

// El carrito es exclusivo del rol USER (ver ALCANCE > Restricciones de
// compra) - este provider solo pide /cart cuando hay sesión de comprador,
// para no disparar un 403 en cualquier otro rol o visitante anónimo.
export function CartProvider({ children }: Props) {
  const { role } = useAuth();

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
  }, [role]);

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
