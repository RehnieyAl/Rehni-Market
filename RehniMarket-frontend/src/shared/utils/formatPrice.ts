// Formato de moneda usado en el storefront público (pesos, sin
// decimales, separador de miles) - mismo criterio que
// `product.price.toLocaleString()` ya usado en el dashboard de empresa
// (Products.tsx), aplicado de forma consistente en Home/Productos del día.
export function formatPrice(value: string | number): string {
  const amount = typeof value === "string" ? Number(value) : value;

  return `$${amount.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
}
