// Paleta real de RehniMarket, extraída del código fuente de la web
// (RehniMarket-frontend, clases Tailwind arbitrarias `bg-[#6D0F2D]` /
// `hover:bg-[#530A20]` repetidas en Login/Register/ProductDetail/Cart/
// Checkout/etc.) - no son colores inventados a partir de la captura de
// references/ux-user.png, son los valores reales que ya usa el producto.
export const colors = {
  // Marca (marroon/vinotinto)
  primary: "#6D0F2D",
  primaryDark: "#530A20",
  // Fondo tenue de marca (equivalente a los `bg-[#6D0F2D]/10` de la web)
  primaryMuted: "#6D0F2D1A",

  success: "#16A34A",
  successMuted: "#DCFCE7",

  danger: "#DC2626",
  dangerMuted: "#FEE2E2",

  warning: "#D97706",
  warningMuted: "#FEF3C7",

  background: "#FFFFFF",
  surface: "#FFFFFF",

  border: "#E5E7EB",
  borderStrong: "#D1D5DB",

  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  textOnPrimary: "#FFFFFF",

  overlay: "#00000080",
} as const;
