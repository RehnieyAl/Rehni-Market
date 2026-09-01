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
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 sm:h-[72px] sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir menú de navegación"
        className="-ml-1 rounded-control p-2 text-gray-600 transition hover:bg-gray-100 lg:hidden"
      >
        <Menu size={22} />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl">{title}</h1>
        <p className="hidden truncate text-sm text-gray-500 sm:block">{description}</p>
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

      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 sm:h-11 sm:w-11">
        {user?.profileImagen ? (
          <img
            src={user.profileImagen}
            alt={user.name ?? "Tu perfil"}
            className="h-full w-full object-cover"
          />
        ) : (
          <UserCircle size={28} className="text-gray-400" />
        )}
      </div>
    </header>
  );
}
