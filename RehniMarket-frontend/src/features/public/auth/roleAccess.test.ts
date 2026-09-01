import { describe, expect, it } from "vitest";

import {
  isPathAllowedForRole,
  resolveRoleHome,
  roleCanAccessArea,
} from "./roleAccess";
import type { Role } from "./types/auth";

const ROLES: Role[] = ["admin", "owner", "company", "user"];

describe("roleCanAccessArea", () => {
  it("only admin and owner reach the admin area", () => {
    expect(roleCanAccessArea("admin", "admin")).toBe(true);
    expect(roleCanAccessArea("owner", "admin")).toBe(true);
    expect(roleCanAccessArea("company", "admin")).toBe(false);
    expect(roleCanAccessArea("user", "admin")).toBe(false);
  });

  it("only company reaches the company area", () => {
    expect(roleCanAccessArea("company", "company")).toBe(true);
    expect(roleCanAccessArea("admin", "company")).toBe(false);
    expect(roleCanAccessArea("owner", "company")).toBe(false);
    expect(roleCanAccessArea("user", "company")).toBe(false);
  });

  it("only user reaches the user area", () => {
    expect(roleCanAccessArea("user", "user")).toBe(true);
    expect(roleCanAccessArea("admin", "user")).toBe(false);
    expect(roleCanAccessArea("company", "user")).toBe(false);
  });
});

describe("resolveRoleHome", () => {
  it("maps every role to its own landing route", () => {
    expect(resolveRoleHome("admin")).toBe("/admin/dashboard");
    expect(resolveRoleHome("owner")).toBe("/admin/dashboard");
    expect(resolveRoleHome("company")).toBe("/company/dashboard");
    expect(resolveRoleHome("user")).toBe("/");
  });
});

describe("isPathAllowedForRole", () => {
  it("keeps public paths open for every role", () => {
    for (const role of ROLES) {
      expect(isPathAllowedForRole("/", role)).toBe(true);
      expect(isPathAllowedForRole("/products/123", role)).toBe(true);
      expect(isPathAllowedForRole("/company/abc-profile", role)).toBe(true);
    }
  });

  it("blocks a stored admin path for a non-admin session", () => {
    expect(isPathAllowedForRole("/admin/dashboard?tab=users", "company")).toBe(false);
    expect(isPathAllowedForRole("/admin/dashboard", "user")).toBe(false);
    expect(isPathAllowedForRole("/admin/dashboard", "admin")).toBe(true);
    expect(isPathAllowedForRole("/admin/dashboard", "owner")).toBe(true);
  });

  it("blocks the company dashboard for everyone except company", () => {
    expect(isPathAllowedForRole("/company/dashboard", "company")).toBe(true);
    expect(isPathAllowedForRole("/company/dashboard", "admin")).toBe(false);
    expect(isPathAllowedForRole("/company/dashboard", "user")).toBe(false);
  });

  it("treats checkout as a buyer-only area", () => {
    expect(isPathAllowedForRole("/checkout", "user")).toBe(true);
    expect(isPathAllowedForRole("/checkout", "company")).toBe(false);
    expect(isPathAllowedForRole("/checkout", "admin")).toBe(false);
  });
});

describe("role transition matrix", () => {
  const transitions: [Role, Role][] = [
    ["admin", "company"],
    ["admin", "user"],
    ["company", "admin"],
    ["company", "user"],
    ["user", "admin"],
    ["user", "company"],
  ];

  it("the incoming role never inherits the previous role's dashboard", () => {
    for (const [previous, next] of transitions) {
      const previousHome = resolveRoleHome(previous);

      if (previousHome === "/") continue;

      expect(isPathAllowedForRole(previousHome, next)).toBe(false);
    }
  });
});
