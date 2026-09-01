import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

import { breakpoints, breakpointOrder, spacing } from "@/theme";
import type { Breakpoint } from "@/theme";

interface ColumnsOptions {
  min?: number;
  max?: number;
  target?: number;
  gutter?: number;
}

export interface Responsive {
  width: number;
  height: number;
  bp: Breakpoint;
  isTablet: boolean;
  isLandscape: boolean;
  gutter: number;
  contentMaxWidth: number;
  atLeast: (bp: Breakpoint) => boolean;
  columns: (options?: ColumnsOptions) => number;
}

function resolveBreakpoint(width: number): Breakpoint {
  let current: Breakpoint = "xs";

  for (const bp of breakpointOrder) {
    if (width >= breakpoints[bp]) current = bp;
  }

  return current;
}

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();

  return useMemo<Responsive>(() => {
    const bp = resolveBreakpoint(width);
    const isTablet = width >= breakpoints.md;
    const isLandscape = width > height;
    const gutter = isTablet ? spacing.lg : spacing.md;
    const contentMaxWidth =
      width >= breakpoints.xl ? 1200 : width >= breakpoints.lg ? 960 : width;

    const atLeast = (target: Breakpoint) =>
      breakpointOrder.indexOf(bp) >= breakpointOrder.indexOf(target);

    const columns = (options: ColumnsOptions = {}) => {
      const { min = 2, max = 6, target = 180 } = options;
      const columnGutter = options.gutter ?? gutter;
      const usable = Math.min(width, contentMaxWidth) - columnGutter * 2;
      const raw = Math.round((usable + columnGutter) / (target + columnGutter));

      return Math.max(min, Math.min(max, raw || min));
    };

    return {
      width,
      height,
      bp,
      isTablet,
      isLandscape,
      gutter,
      contentMaxWidth,
      atLeast,
      columns,
    };
  }, [width, height]);
}
