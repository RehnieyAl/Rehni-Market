import { Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
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
        <div className="lg:hidden border-t bg-white">

          <div className="p-4">

            <div className="relative mb-5">

              <input
                placeholder="Buscar..."
                className="w-full border rounded-full py-3 pl-5 pr-12"
              />

              <Search
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              />

            </div>

            <nav className="flex flex-col gap-4">

              <a href="#">Inicio</a>
              <a href="#">Categorías</a>
              <a href="#">Productos</a>

              <hr />

              <button className="text-left">
                Iniciar sesión
              </button>

              <Link to="/register-user" className="bg-[#6D0F2D] text-white rounded-xl py-3">
                Registrarse
              </Link>

            </nav>

          </div>

        </div>
      )}
    </header>
  );
}