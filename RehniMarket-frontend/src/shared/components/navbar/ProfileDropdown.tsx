
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Package,
  Heart,
  ShoppingBag,
  Users,
  Building2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "@/features/public/auth/context/useAuth";

export default function ProfileDropdown() {
  const { role, user, logout } = useAuth();

  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClick,
      );
    };
  }, []);

  if (!role) return null;

  const roleName = {
    admin: "Administrador",
    company: "Empresa",
    user: "Usuario",
  };

  const menu = {
    admin: [
      {
        label: "Dashboard",
        to: "/admin/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Usuarios",
        to: "/admin/users",
        icon: Users,
      },
      {
        label: "Empresas",
        to: "/admin/companies",
        icon: Building2,
      },
    ],

    company: [
      {
        label: "Dashboard",
        to: "/company/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Productos",
        to: "/company/products",
        icon: Package,
      },
      {
        label: "Mi Empresa",
        to: "/company/profile",
        icon: Building2,
      },
    ],

    user: [
      {
        label: "Dashboard",
        to: "/user/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Pedidos",
        to: "/user/orders",
        icon: ShoppingBag,
      },
      {
        label: "Favoritos",
        to: "/user/favorites",
        icon: Heart,
      },
    ],
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate("/");
  };

  const displayName =
    user?.name ?? roleName[role];

  const initial =
    displayName.charAt(0).toUpperCase();

  return (
    <div
      ref={ref}
      className="relative"
    >
      {/* =====================================================
          BOTÓN PERFIL
      ===================================================== */}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-gray-100"
      >
        {/* AVATAR */}

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6D0F2D] text-sm font-bold text-white">
          {initial}
        </div>

        {/* INFORMACIÓN */}

        <div className="min-w-0 text-left">
          <p className="max-w-[150px] truncate text-sm font-semibold text-gray-900">
            {user?.name ?? "Cargando..."}
          </p>

          <p className="text-xs text-gray-500">
            {roleName[role]}
          </p>
        </div>

        <ChevronDown
          size={17}
          className={`shrink-0 text-gray-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* =====================================================
          DROPDOWN
      ===================================================== */}

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-72 overflow-hidden rounded-2xl bg-white shadow-xl">

          {/* =================================================
              INFORMACIÓN DEL USUARIO
          ================================================= */}

          <div className="bg-gray-50 p-4">
            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#6D0F2D] text-lg font-bold text-white">
                {initial}
              </div>

              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">
                  {user?.name ?? "Cargando..."}
                </p>

                <p className="truncate text-sm text-gray-500">
                  {user?.email ?? ""}
                </p>

                <p className="mt-1 text-xs font-medium text-[#6D0F2D]">
                  {roleName[role]}
                </p>
              </div>

            </div>
          </div>

          {/* =================================================
              OPCIONES
          ================================================= */}

          <div className="p-2">

            {menu[role].map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
                >
                  <Icon
                    size={18}
                    className="text-gray-500"
                  />

                  <span>
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* SEPARADOR SIN BORDE */}

            <div className="my-2 h-px bg-gray-100" />

            {/* CERRAR SESIÓN */}

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <LogOut size={18} />

              <span>
                Cerrar sesión
              </span>
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

