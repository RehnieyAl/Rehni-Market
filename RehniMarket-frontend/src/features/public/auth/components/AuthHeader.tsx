/** Cabecera de los formularios de acceso: icono contextual en círculo tonal, título y descripción centrados. */
import type { ReactNode } from "react";

interface AuthHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: ReactNode;
}

export default function AuthHeader({ icon, title, subtitle }: AuthHeaderProps) {
  return (
    <div className="text-center">
      <div
        aria-hidden="true"
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary/15 text-secondary sm:h-16 sm:w-16"
      >
        {icon}
      </div>
      <h1 className="mt-5 text-2xl font-semibold text-ink sm:text-3xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted sm:text-base">{subtitle}</p>
      )}
    </div>
  );
}
