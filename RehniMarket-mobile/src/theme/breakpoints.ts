export const breakpoints = {
  xs: 0,
  sm: 400,
  md: 600,
  lg: 840,
  xl: 1100,
} as const;

export type Breakpoint = keyof typeof breakpoints;

export const breakpointOrder: Breakpoint[] = ["xs", "sm", "md", "lg", "xl"];
