import { UserCircle } from "lucide-react";

import { useAuth } from "@/features/public/auth/context/useAuth";

interface TopbarProps {
  title: string;
  description: string;
  roleName: string;
}

export default function Topbar({
  title,
  description,
  roleName,
}: TopbarProps) {
  // Reutiliza el perfil ya cargado en AuthContext (antes este componente
  // hacía su propio GET /auth/me por separado, duplicando la misma
  // llamada) - así también se actualiza automáticamente cuando
  // "Configuración de cuenta" llama a refreshProfile() tras editar el
  // nombre o la foto de perfil.
  const { user } = useAuth();

  return (
    <header className="flex h-20 items-center justify-between border-b border-gray-200 bg-white px-8">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {title}
        </h1>

        <p className="text-sm text-gray-500">
          {description}
        </p>
      </div>

      <div className="flex items-center gap-4">

        <div className="text-right">
          <p className="font-semibold text-gray-900">
            {user?.name ?? "Cargando..."}
          </p>

          <p className="text-sm text-gray-500">
            {roleName}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100">
          {user?.profileImagen ? (
            <img
              src={user.profileImagen}
              alt={user.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <UserCircle
              size={36}
              className="text-gray-400"
            />
          )}
        </div>

      </div>

    </header>
  );
}
