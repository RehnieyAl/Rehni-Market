// Escala de 4px, igual a la que ya usa la web vía Tailwind (p-1=4, p-2=8,
// p-4=16, p-6=24, p-8=32...) - mantiene la misma jerarquía visual al
// portar cada pantalla.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;
