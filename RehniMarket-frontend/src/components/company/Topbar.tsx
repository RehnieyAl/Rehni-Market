import { UserCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { getProfile } from "../../services/authService";
import type { MeResponse } from "../../types/auth";

export default function Topbar() {

  const [user, setUser] = useState<MeResponse | null>(null);


  useEffect(() => {

    const loadProfile = async () => {
      try {
        const data = await getProfile();
        setUser(data);

      } catch (error) {
        console.error(
          "Error cargando perfil",
          error
        );
      }
    };


    loadProfile();

  }, []);



  return (

    <header className="h-20 border-b border-gray-200 bg-white flex items-center justify-between px-8">

      {/* Izquierda */}
      <div>

        <h1 className="text-2xl font-bold text-gray-900">
          Panel Empresa
        </h1>

        <p className="text-sm text-gray-500">
          Administra tu negocio
        </p>

      </div>



      {/* Derecha */}
      <div className="flex items-center gap-4">


        <div className="text-right">

          <p className="font-semibold text-gray-900">
            {user?.name ?? "Usuario Empresa"}
          </p>


          <p className="text-sm text-gray-500">
            Empresa
          </p>


        </div>



        {/* Avatar temporal */}
        <div className="h-12 w-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">

          <UserCircle
            size={36}
            className="text-gray-400"
          />

        </div>


      </div>


    </header>

  );
}