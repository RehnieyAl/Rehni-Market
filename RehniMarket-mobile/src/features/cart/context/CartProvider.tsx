import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "@/api/cartService";
import type { Cart } from "@/types/cart";

import { CartContext } from "./CartContext";

interface Props {
  children: ReactNode;
}

const CLEAR_KEY = "__clear__";

export function CartProvider({ children }: Props) {
  const { isUser, isLoading: authLoading } = useAuth();

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  const pendingRef = useRef<string | null>(null);
  const opSeqRef = useRef(0);

  const refreshCart = useCallback(async () => {
    if (!isUser) {
      setCart(null);
      return;
    }

    const seqAtStart = opSeqRef.current;

    try {
      setLoading(true);
      const data = await getCart();
      if (opSeqRef.current === seqAtStart) setCart(data);
    } catch (error) {
      console.error("Error cargando el carrito:", error);
    } finally {
      setLoading(false);
    }
  }, [isUser]);

  useEffect(() => {
    if (authLoading) return;

    if (!isUser) {
      setCart(null);
      return;
    }

    refreshCart();
  }, [authLoading, isUser, refreshCart]);

  const runItemOp = useCallback(
    async (key: string, operation: () => Promise<Cart>) => {
      if (pendingRef.current) return;

      pendingRef.current = key;
      setPendingItemId(key);

      try {
        const data = await operation();
        opSeqRef.current += 1;
        setCart(data);
      } catch (error) {
        console.error("Error actualizando el carrito:", error);
        throw error;
      } finally {
        pendingRef.current = null;
        setPendingItemId(null);
      }
    },
    [],
  );

  const addItem = useCallback(
    async (productId: string, quantity: number, variantId?: string) => {
      const data = await addToCart({ productId, quantity, variantId });
      opSeqRef.current += 1;
      setCart(data);
    },
    [],
  );

  const updateItem = useCallback(
    (itemId: string, quantity: number) =>
      runItemOp(itemId, () => updateCartItem(itemId, { quantity })),
    [runItemOp],
  );

  const removeItem = useCallback(
    (itemId: string) => runItemOp(itemId, () => removeCartItem(itemId)),
    [runItemOp],
  );

  const clear = useCallback(
    () => runItemOp(CLEAR_KEY, () => clearCart()),
    [runItemOp],
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        pendingItemId,
        totalItems: cart?.totalItems ?? 0,
        refreshCart,
        addItem,
        updateItem,
        removeItem,
        clear,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
