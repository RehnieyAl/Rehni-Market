/** Carrito del comprador en sesión: una sola fuente para el navbar, el desplegable, la página del carrito y el
 * checkout. Al cambiar de usuario se recarga y se descartan respuestas del anterior. */
import { useCallback, useEffect, useRef, useState } from "react";
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
  const requestRef = useRef(0);

  const refreshCart = useCallback(async () => {
    const request = ++requestRef.current;

    if (role !== "user") {
      setCart(null);
      return;
    }

    try {
      setLoading(true);
      const data = await getCart();
      if (request === requestRef.current) setCart(data);
    } catch (error) {
      console.error("Error cargando el carrito:", error);
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, [role]);

  // identity recarga al cambiar de comprador sin cambiar de rol; diferido como el resto de cargas iniciales.
  useEffect(() => {
    const timeout = setTimeout(() => void refreshCart());
    return () => clearTimeout(timeout);
  }, [refreshCart, identity]);

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
