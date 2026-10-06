import type { ReactNode } from "react";

import { cn } from "@/shared/utils/cn";

interface AuthLayoutProps {
  title: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  belowCard?: ReactNode;
  size?: "md" | "lg";
}

export default function AuthLayout({
  title,
  subtitle,
  icon,
  children,
  belowCard,
  size = "md",
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-gray-50 px-4 py-8 sm:py-12">
      <div
        className={cn(
          "mx-auto flex w-full flex-1 flex-col justify-center",
          size === "lg" ? "max-w-xl" : "max-w-md",
        )}
      >
        <div className="animate-fade-in rounded-card border border-gray-200 bg-surface-1 p-6 shadow-card sm:p-8">
          {icon && (
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-primary">
              {icon}
            </div>
          )}

          <h1 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-relaxed text-gray-500">
              {subtitle}
            </p>
          )}

          <div className="mt-7">{children}</div>
        </div>

        {belowCard && (
          <div className="mt-6 text-center text-sm text-gray-500">{belowCard}</div>
        )}
      </div>
    </div>
  );
}
