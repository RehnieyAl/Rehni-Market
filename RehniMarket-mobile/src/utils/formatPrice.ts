// Espejo exacto de RehniMarket-frontend/src/shared/utils/formatPrice.ts -
// mismo formato (pesos, sin decimales, separador de miles es-CO) en toda
// la app, para que un precio se vea igual en Home/Categorías/Producto/
// Carrito/Pedidos.
export function formatPrice(value: string | number): string {
  const amount = typeof value === "string" ? Number(value) : value;

  return `$${amount.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
}
