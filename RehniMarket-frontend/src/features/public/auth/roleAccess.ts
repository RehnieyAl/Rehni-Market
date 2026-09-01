import type { Role } from "./types/auth";

export type AreaKey = "admin" | "company" | "user";

export const ROLE_HOME: Record<Role, string> = {
  admin: "/admin/dashboard",
  owner: "/admin/dashboard",
  company: "/company/dashboard",
  user: "/",
};

export const AREA_ROLES: Record<AreaKey, Role[]> = {
  admin: ["admin", "owner"],
  company: ["company"],
  user: ["user"],
};

const PROTECTED_PREFIXES: { prefix: string; area: AreaKey }[] = [
  { prefix: "/admin/dashboard", area: "admin" },
  { prefix: "/company/dashboard", area: "company" },
  { prefix: "/user/dashboard", area: "user" },
  { prefix: "/checkout", area: "user" },
];

export const resolveRoleHome = (role: Role): string => ROLE_HOME[role];

export const roleCanAccessArea = (role: Role, area: AreaKey): boolean =>
  AREA_ROLES[area].includes(role);

export const isPathAllowedForRole = (path: string, role: Role): boolean => {
  const match = PROTECTED_PREFIXES.find((entry) => path.startsWith(entry.prefix));

  if (!match) {
    return true;
  }

  return roleCanAccessArea(role, match.area);
};
