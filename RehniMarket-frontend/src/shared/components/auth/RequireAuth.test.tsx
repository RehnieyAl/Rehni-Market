import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import RequireAuth from "./RequireAuth";
import { AuthContext } from "@/features/public/auth/context/AuthContext";
import type { AuthContextType } from "@/features/public/auth/types/auth";

const baseValue: AuthContextType = {
  status: "unauthenticated",
  accessToken: null,
  refreshToken: null,
  role: null,
  user: null,
  login: async () => {},
  logout: () => {},
  refreshProfile: async () => {},
};

function renderAt(path: string, value: Partial<AuthContextType>) {
  return render(
    <AuthContext.Provider value={{ ...baseValue, ...value }}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<p>STORE HOME</p>} />
          <Route path="/login" element={<p>LOGIN PAGE</p>} />
          <Route
            path="/admin/dashboard"
            element={
              <RequireAuth area="admin">
                <p>ADMIN AREA</p>
              </RequireAuth>
            }
          />
          <Route
            path="/company/dashboard"
            element={
              <RequireAuth area="company">
                <p>COMPANY AREA</p>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("RequireAuth", () => {
  it("shows a loading state while the session is being resolved", () => {
    renderAt("/admin/dashboard", { status: "loading" });

    expect(screen.getByRole("status")).toBeDefined();
    expect(screen.queryByText("ADMIN AREA")).toBeNull();
  });

  it("sends an unauthenticated visitor to the login page", () => {
    renderAt("/admin/dashboard", { status: "unauthenticated", role: null });

    expect(screen.getByText("LOGIN PAGE")).toBeDefined();
  });

  it("renders the area when the role matches", () => {
    renderAt("/admin/dashboard", {
      status: "authenticated",
      role: "admin",
      accessToken: "t",
    });

    expect(screen.getByText("ADMIN AREA")).toBeDefined();
  });

  it("bounces a company session out of the admin area to its own dashboard", () => {
    renderAt("/admin/dashboard", {
      status: "authenticated",
      role: "company",
      accessToken: "t",
    });

    expect(screen.getByText("COMPANY AREA")).toBeDefined();
    expect(screen.queryByText("ADMIN AREA")).toBeNull();
  });

  it("bounces an admin session out of the company area", () => {
    renderAt("/company/dashboard", {
      status: "authenticated",
      role: "admin",
      accessToken: "t",
    });

    expect(screen.queryByText("COMPANY AREA")).toBeNull();
  });

  it("sends a buyer that hits the admin area back to the store home", () => {
    renderAt("/admin/dashboard", {
      status: "authenticated",
      role: "user",
      accessToken: "t",
    });

    expect(screen.getByText("STORE HOME")).toBeDefined();
  });
});
