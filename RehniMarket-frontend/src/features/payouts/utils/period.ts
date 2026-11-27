/** Etiquetas de periodos de liquidación ("Enero 2026") y de fechas sin hora ("7 oct 2026") a partir de
 * AAAA-MM-DD, sin pasar por UTC para que no se corran un día en Colombia. */
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

export function formatPeriodStartLabel(periodStart: string): string {
  const [year, month] = periodStart.split("-").map(Number);

  return `${MONTH_NAMES[month - 1]} ${year}`;
}

const dateOnlyFormat = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric" });

export function formatDateOnly(value: string): string {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);

  return dateOnlyFormat.format(new Date(year, month - 1, day));
}
