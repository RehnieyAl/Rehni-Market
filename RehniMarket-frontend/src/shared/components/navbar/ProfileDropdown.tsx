
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Package,
  Users,
  Building2,
  User,
  Wallet,
  Settings,
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
    owner: "Propietario",
  };

  // OWNER reutiliza exactamente las mismas opciones del menú de ADMIN
  // (hereda todas sus capacidades). Las opciones exclusivas de OWNER se
  // agregarían aquí, aparte, cuando existan.
  const adminMenuItems = [
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
  ];

  const menu = {
    admin: adminMenuItems,

    owner: adminMenuItems,

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

    // El dashboard de comprador es una sola ruta (/user/dashboard) con
    // navegación interna por pestaña (ver pages/user/Dashboard.tsx) - no
    // existen /user/profile ni /user/wallet como rutas propias, así que
    // "Mi perfil"/"Configuración" y "Mi billetera" apuntan a esa misma
    // ruta real con ?tab=... en vez de inventar una ruta nueva. El
    // saldo de RehniCoin se muestra en la pestaña "Inicio" (ver
    // features/user/components/dashboard/Home.tsx > Resumen rápido), por
    // eso "Mi billetera" navega ahí.
    user: [
      {
        label: "Mi perfil",
        to: "/user/dashboard?tab=profile",
        icon: User,
      },
      {
        label: "Mi billetera",
        to: "/user/dashboard?tab=home",
        icon: Wallet,
      },
      {
        label: "Configuración",
        to: "/user/dashboard?tab=profile",
        icon: Settings,
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

        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#6D0F2D] text-sm font-bold text-white">
          {user?.profileImagen ? (
            <img
              src={user.profileImagen}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            initial
          )}
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

              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#6D0F2D] text-lg font-bold text-white">
                {user?.profileImagen ? (
                  <img
                    src={user.profileImagen}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initial
                )}
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

