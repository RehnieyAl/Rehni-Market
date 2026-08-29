// Utilidades de período para liquidaciones. El período es un mes calendario completo
// (period_start = día 1, period_end = último día, inclusivo).

export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

// "2026-08-01" -> "Agosto 2026". Se parsea a mano para evitar el desfase UTC de new Date("YYYY-MM-DD").
export function formatPeriodStartLabel(periodStart: string): string {
  const [year, month] = periodStart.split("-").map(Number);

  return `${MONTH_NAMES[month - 1]} ${year}`;
}
