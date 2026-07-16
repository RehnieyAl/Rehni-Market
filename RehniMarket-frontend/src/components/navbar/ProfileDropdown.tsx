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
import { useAuth } from "../../context/useAuth";

export default function ProfileDropdown() {
  const { role, user, logout } = useAuth();

  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

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
      document.removeEventListener("mousedown", handleClick);
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
    logout();
    navigate("/");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 rounded-xl px-2 py-1 hover:bg-gray-100 transition"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6D0F2D] text-white font-bold">
          {(user?.name ?? roleName[role]).charAt(0).toUpperCase()}
        </div>

        <div className="text-left">
          <p className="font-semibold">
            {user?.name ?? "Cargando..."}
          </p>

          <p className="text-xs text-gray-500">
            {roleName[role]}
          </p>
        </div>

        <ChevronDown
          size={18}
          className={`transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border bg-white shadow-xl">

          <div className="border-b p-4">

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6D0F2D] text-white text-lg font-bold">
                {(user?.name ?? roleName[role]).charAt(0).toUpperCase()}
              </div>

              <div>
                <p className="font-semibold">
                  {user?.name ?? "Cargando..."}
                </p>

                <p className="text-sm text-gray-500">
                  {user?.email ?? ""}
                </p>

                <p className="text-xs text-[#6D0F2D] font-medium mt-1">
                  {roleName[role]}
                </p>
              </div>

            </div>

          </div>

          <div className="p-2">

            {menu[role].map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-gray-100 transition"
                  onClick={() => setOpen(false)}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}

            <hr className="my-2" />

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-red-600 hover:bg-red-50 transition"
            >
              <LogOut size={18} />
              Cerrar sesión
            </button>

          </div>

        </div>
      )}
    </div>
  );
}