import type { CSSProperties } from "react";

import { cn } from "@/shared/utils/cn";

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

export default function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={cn("animate-pulse rounded-md bg-gray-200/80", className)}
    />
  );
}
