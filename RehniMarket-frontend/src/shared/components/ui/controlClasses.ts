import { cn } from "@/shared/utils/cn";

const CONTROL_BASE =
  "h-11 w-full rounded-control border bg-white text-sm text-gray-900 outline-none transition " +
  "placeholder:text-gray-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

export function controlClasses(invalid?: boolean): string {
  return cn(
    CONTROL_BASE,
    invalid
      ? "border-danger focus:border-danger focus:ring-danger/30"
      : "border-gray-300 focus:border-brand-600 focus:ring-brand-600/25",
  );
}
