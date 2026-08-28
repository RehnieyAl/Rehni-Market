// Utilidades de período para el módulo de liquidaciones (ver ALCANCE >
// Módulo de liquidaciones). El período de una liquidación es un mes
// calendario completo (period_start = día 1, period_end = último día,
// inclusivo - ver PayoutService._month_period en el backend).

export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

// "2026-08-01" -> "Agosto 2026". Se parsea el string a mano (year/month)
// en vez de `new Date("2026-08-01")` + toLocaleDateString: ese constructor
// interpreta la fecha en UTC, y en una zona horaria con offset negativo
// (ej. Colombia, UTC-5) el mes local puede quedar un día atrás - un bug
// clásico de JS, no una fecha real distinta a la que devolvió el backend.
export function formatPeriodStartLabel(periodStart: string): string {
  const [year, month] = periodStart.split("-").map(Number);

  return `${MONTH_NAMES[month - 1]} ${year}`;
}
