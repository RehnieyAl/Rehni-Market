
import {
  cloneElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "@/features/public/auth/context/useAuth";
import { Skeleton } from "@/shared/components/ui";
import { dashboardNavigation } from "@/shared/config/dashboardNavigation";
import type { SidebarItem } from "@/shared/components/dashboard/Sidebar";
import type { Role } from "@/features/public/auth/types/auth";

// Qué ids de dashboardNavigation se muestran en este dropdown por rol. Labels/iconos se heredan por id.
// admin/owner: gestión core + cuenta. company: las 6 pestañas. user: todas menos "addresses" (van en el checkout).
const ADMIN_DROPDOWN_CONFIG = {
  basePath: "/admin/dashboard",
  navIds: ["home", "companies", "users", "products", "payouts"],
  settingsId: "account",
};

const DROPDOWN_CONFIG: Record<
  Role,
  { basePath: string; navIds: string[]; settingsId: string }
> = {
  admin: ADMIN_DROPDOWN_CONFIG,

  owner: ADMIN_DROPDOWN_CONFIG,

  company: {
    basePath: "/company/dashboard",
    navIds: ["home", "products", "orders", "finance", "company"],
    settingsId: "profile",
  },

  user: {
    basePath: "/user/dashboard",
    navIds: ["home", "orders", "favorites", "wallet"],
    settingsId: "profile",
  },
};

// Mismo mecanismo que las páginas de dashboard: query param ?tab=, con "home" como caso especial.
const buildTabPath = (basePath: string, tabId: string) =>
  tabId === "home" ? basePath : `${basePath}?tab=${tabId}`;

const pickItems = (items: SidebarItem[], ids: string[]): SidebarItem[] =>
  ids
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is SidebarItem => Boolean(item));

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

  const config = DROPDOWN_CONFIG[role];
  const dashboardItems = dashboardNavigation[role];

  const navItems = pickItems(dashboardItems, config.navIds);
  const [settingsItem] = pickItems(dashboardItems, [config.settingsId]);

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

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-gray-100"
      >

        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold text-primary-fg">
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

        <div className="min-w-0 text-left">
          {user?.name ? (
            <p className="max-w-[150px] truncate text-sm font-semibold text-gray-900">
              {user.name}
            </p>
          ) : (
            <Skeleton className="h-3.5 w-20" />
          )}

          <p className="text-xs text-gray-500">{roleName[role]}</p>
        </div>

        <ChevronDown
          size={17}
          className={`shrink-0 text-gray-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-72 overflow-hidden rounded-2xl bg-white shadow-xl">

          <div className="bg-gray-50 p-4">
            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-lg font-bold text-primary-fg">
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
                {user?.name ? (
                  <p className="truncate font-semibold text-gray-900">{user.name}</p>
                ) : (
                  <Skeleton className="h-4 w-32" />
                )}

                <p className="truncate text-sm text-gray-500">
                  {user?.email ?? ""}
                </p>

                <p className="mt-1 text-xs font-medium text-primary">
                  {roleName[role]}
                </p>
              </div>

            </div>
          </div>

          {/* =================================================
              NAVEGACIÓN (pestañas del dashboard real, ver
              DROPDOWN_CONFIG más arriba)
          ================================================= */}

          <div className="p-2">

            {navItems.map((item) => (
              <Link
                key={item.id}
                to={buildTabPath(config.basePath, item.id)}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
              >
                {cloneElement(
                  item.icon as ReactElement<{ size?: number }>,
                  { size: 18 },
                )}

                <span>
                  {item.text}
                </span>
              </Link>
            ))}

            {/* =================================================
                CONFIGURACIÓN (separada de la navegación)
            ================================================= */}

            {settingsItem && (
              <>
                <div className="my-2 h-px bg-gray-100" />

                <Link
                  to={buildTabPath(config.basePath, settingsItem.id)}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
                >
                  {cloneElement(
                    settingsItem.icon as ReactElement<{ size?: number }>,
                    { size: 18 },
                  )}

                  <span>
                    {settingsItem.text}
                  </span>
                </Link>
              </>
            )}

            {/* =================================================
                CERRAR SESIÓN (separado de configuración)
            ================================================= */}

            <div className="my-2 h-px bg-gray-100" />

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-control px-3 py-3 text-sm font-medium text-danger transition hover:bg-danger-bg"
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
