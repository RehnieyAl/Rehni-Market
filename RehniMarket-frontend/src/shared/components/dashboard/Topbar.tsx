import { UserCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { getProfile } from "@/features/public/auth/api/authService";
import type { MeResponse } from "@/features/public/auth/types/response";

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
  const [user, setUser] = useState<MeResponse | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        setUser(data);
      } catch (error) {
        console.error("Error cargando perfil", error);
      }
    };

    loadProfile();
  }, []);

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

        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-gray-100">
          <UserCircle
            size={36}
            className="text-gray-400"
          />
        </div>

      </div>

    </header>
  );
}