export function formatPrice(value: string | number): string {
  const amount = typeof value === "string" ? Number(value) : value;

  return `$${amount.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
}
