export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

export function formatPeriodStartLabel(periodStart: string): string {
  const [year, month] = periodStart.split("-").map(Number);

  return `${MONTH_NAMES[month - 1]} ${year}`;
}
