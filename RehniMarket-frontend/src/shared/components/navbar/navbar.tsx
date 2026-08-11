import { Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/public/auth/context/useAuth";
import ProfileDropdown from "./ProfileDropdown";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { role } = useAuth();
  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="max-w-[1600px] mx-auto h-20 px-4 lg:px-8 flex items-center justify-between">

        <Link to="/" className="flex items-center gap-3">
          <img
            src="src/assets/logo.png"
            alt="logo"
            className="w-35 h-35 object-cover"
          />
          
        </Link>

        <nav className="hidden lg:flex gap-8 font-medium">
          <Link to="/">Inicio</Link>
          <Link to="/categories">Categorías</Link>
          <Link to="/products">Productos</Link>
        </nav>

        <div className="hidden xl:block relative w-96">
          <input
            type="text"
            placeholder="Buscar productos..."
            className="w-full border rounded-full py-3 pl-5 pr-12 outline-none focus:border-[#6D0F2D]"
          />

          <Search
            size={20}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500"
          />
        </div>

        <div className="hidden lg:flex gap-5 items-center">
          {role == null ? (
            <>
              <Link to="/login" className="font-medium">
                Iniciar sesión
              </Link>
              <Link to="/register-user" className="bg-[#6D0F2D] hover:bg-[#530A20] text-white px-6 py-3 rounded-xl transition">
                Registrarse
              </Link>
            </>
            ) : (
              <ProfileDropdown />
            )
          }
        </div>
        <button

          onClick={() => setOpen(!open)}
          className="lg:hidden"
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>

      </div>


{open && (
  <div className="lg:hidden border-t border-gray-200 bg-white">
    <div className="p-5">

      {/* BUSCADOR MÓVIL */}
      <div className="relative mb-5">
        <input
          type="text"
          placeholder="Buscar productos..."
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-11 text-sm outline-none transition focus:border-[#6D0F2D] focus:bg-white"
        />

        <Search
          size={18}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
      </div>

      {/* NAVEGACIÓN */}
      <nav className="flex flex-col gap-1">

        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="rounded-xl px-4 py-3.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
        >
          Inicio
        </Link>

        <Link
          to="/categories"
          onClick={() => setOpen(false)}
          className="rounded-xl px-4 py-3.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
        >
          Categorías
        </Link>

        <Link
          to="/products"
          onClick={() => setOpen(false)}
          className="rounded-xl px-4 py-3.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
        >
          Productos
        </Link>

      </nav>

      {/* SEPARADOR */}
      <div className="my-4 border-t border-gray-200" />

      {/* AUTENTICACIÓN */}
      {role == null ? (
        <div className="flex flex-col gap-3">

          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Iniciar sesión
          </Link>

          <Link
            to="/register-user"
            onClick={() => setOpen(false)}
            className="rounded-xl bg-[#6D0F2D] px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-[#530A20]"
          >
            Registrarse
          </Link>

        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">

          <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-gray-400">
            Mi cuenta
          </p>

          <ProfileDropdown />

        </div>
      )}

    </div>
  </div>
)}

    </header>
  );
}