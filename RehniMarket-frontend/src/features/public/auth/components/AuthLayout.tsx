/** Marco de las pantallas de acceso independientes: fondo carbón, tarjeta tonal compacta con flecha de
 * regreso, cabecera centrada y un texto opcional bajo la tarjeta. */
import type { ReactNode } from "react";

import { cn } from "@/shared/utils/cn";

import AuthBackButton from "./AuthBackButton";
import AuthHeader from "./AuthHeader";

interface AuthLayoutProps {
  title: string;
  subtitle?: ReactNode;
  icon: ReactNode;
  children: ReactNode;
  belowCard?: ReactNode;
  size?: "md" | "lg";
  /** Destino de la flecha cuando no hay un paso anterior en el historial. */
  backFallback?: string;
}

export default function AuthLayout({
  title,
  subtitle,
  icon,
  children,
  belowCard,
  size = "md",
  backFallback = "/",
}: AuthLayoutProps) {
  return (
    <main className="flex min-h-dvh flex-col bg-canvas px-4 py-6 sm:py-12">
      <div
        className={cn(
          "mx-auto flex w-full flex-1 flex-col justify-center",
          size === "lg" ? "max-w-xl" : "max-w-md",
        )}
      >
        <div className="animate-fade-in relative rounded-[28px] border border-white/[0.06] bg-surface-1 px-5 pb-6 pt-16 sm:px-8 sm:pb-8 sm:pt-20">
          <AuthBackButton fallback={backFallback} />
          <AuthHeader icon={icon} title={title} subtitle={subtitle} />
          <div className="mt-7">{children}</div>
        </div>

        {belowCard && <div className="mt-6 text-center text-sm text-ink-muted">{belowCard}</div>}
      </div>
    </main>
  );
}
