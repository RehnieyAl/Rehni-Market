/** Acceso al contexto del carrito; falla si se usa fuera de CartProvider. */
import { useContext } from "react";
import { CartContext } from "./CartContext";

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart debe utilizarse dentro de CartProvider");
  }

  return context;
}
