// Enlaces de cuenta por rol (secciones del panel y configuración) que comparten el menú de
// perfil de escritorio y el menú móvil.
import { dashboardNavigation } from "@/shared/config/dashboardNavigation";
import type { SidebarItem } from "@/shared/components/dashboard/Sidebar";
import type { Role } from "@/features/public/auth/types/auth";

const ADMIN_BASE = {
  basePath: "/admin/dashboard",
  navIds: ["home", "companies", "users", "products"],
  settingsId: "account",
};

const ACCOUNT_CONFIG: Record<Role, { basePath: string; navIds: string[]; settingsId: string }> = {
  admin: ADMIN_BASE,
  owner: { ...ADMIN_BASE, navIds: [...ADMIN_BASE.navIds, "payouts"] },
  company: {
    basePath: "/company/dashboard",
    navIds: ["home", "products", "orders", "finance"],
    settingsId: "profile",
  },
  user: {
    basePath: "/user/dashboard",
    navIds: ["home", "orders", "favorites", "wallet"],
    settingsId: "profile",
  },
};

export const ROLE_NAME: Record<Role, string> = {
  admin: "Administrador",
  company: "Empresa",
  user: "Usuario",
  owner: "Propietario",
};

export interface AccountLink extends SidebarItem {
  to: string;
}

function buildTabPath(basePath: string, tabId: string) {
  return tabId === "home" ? basePath : `${basePath}?tab=${tabId}`;
}

function pick(role: Role, ids: string[]): AccountLink[] {
  const { basePath } = ACCOUNT_CONFIG[role];
  return ids
    .map((id) => dashboardNavigation[role].find((item) => item.id === id))
    .filter((item): item is SidebarItem => Boolean(item))
    .map((item) => ({ ...item, to: buildTabPath(basePath, item.id) }));
}

export function getAccountLinks(role: Role) {
  const config = ACCOUNT_CONFIG[role];
  return {
    basePath: config.basePath,
    sections: pick(role, config.navIds),
    settings: pick(role, [config.settingsId])[0] ?? null,
  };
}
