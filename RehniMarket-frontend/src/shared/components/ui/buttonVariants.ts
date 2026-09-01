import { cn } from "@/shared/utils/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap " +
  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 " +
  "focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover",
  secondary: "bg-brand-50 text-primary hover:bg-brand-100",
  outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  ghost: "text-gray-700 hover:bg-gray-100",
  danger: "bg-danger text-white hover:brightness-95",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonClasses(
  opts: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {},
): string {
  const { variant = "primary", size = "md", className } = opts;
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}
