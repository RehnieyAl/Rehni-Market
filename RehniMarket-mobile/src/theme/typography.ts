// Escala de tamaños igual a la de Tailwind ya usada en la web
// (text-xs..text-3xl) y los mismos pesos (font-medium/semibold/bold).
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;
