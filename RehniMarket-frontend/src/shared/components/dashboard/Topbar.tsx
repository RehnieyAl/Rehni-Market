/** Encabezado de los paneles: menú en móvil, título y descripción de la sección, nombre, rol y avatar de la cuenta. */
import { Menu, UserCircle } from "lucide-react";

import { useAuth } from "@/features/public/auth/context/useAuth";
import { Skeleton } from "@/shared/components/ui";

interface TopbarProps {
  title: string;
  description: string;
  roleName: string;
  onMenuClick: () => void;
}

export default function Topbar({ title, description, roleName, onMenuClick }: TopbarProps) {
  const { user } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-hairline bg-surface-1 px-4 sm:h-[72px] sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir menú de navegación"
        className="-ml-1 rounded-control p-2 text-ink-muted transition hover:bg-white/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-secondary lg:hidden"
      >
        <Menu size={22} />
      </button>

      <div className="min-w-0 flex-1">
        {/* Texto, no h1: el único h1 de cada pantalla es el título de la sección (DashboardPageHeader). */}
        <p className="truncate text-lg font-semibold text-ink sm:text-xl">{title}</p>
        <p className="hidden truncate text-sm text-ink-muted sm:block">{description}</p>
      </div>

      <div className="hidden text-right sm:block">
        {user?.name ? (
          <p className="max-w-[160px] truncate text-sm font-semibold text-gray-900">
            {user.name}
          </p>
        ) : (
          <Skeleton className="ml-auto h-4 w-24" />
        )}
        <p className="text-xs text-gray-500">{roleName}</p>
      </div>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-secondary/70 bg-surface-2 sm:h-11 sm:w-11">
        {user?.profileImagen ? (
          <img
            src={user.profileImagen}
            alt={user.name ?? "Tu perfil"}
            className="h-full w-full object-cover"
          />
        ) : (
          <UserCircle size={28} aria-hidden="true" className="text-ink-muted" />
        )}
      </div>
    </header>
  );
}
