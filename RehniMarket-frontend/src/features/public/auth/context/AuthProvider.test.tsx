import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";

import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./useAuth";
import type { AuthUser } from "@/features/public/auth/types/auth";

const delays: Record<string, number> = {};

vi.mock("@/features/public/auth/api/authService", () => ({
  getProfile: () => {
    const token = localStorage.getItem("accessToken");

    const profiles: Record<string, AuthUser> = {
      "admin-token": {
        email: "admin@rehni.test",
        name: "Admin",
        role: "admin",
        tell: "3000000000",
        profileImagen: null,
      },
      "company-token": {
        email: "empresa@rehni.test",
        name: "Empresa",
        role: "company",
        tell: "3000000001",
        profileImagen: null,
      },
    };

    const profile = token ? profiles[token] : undefined;

    if (!profile) {
      return Promise.reject(new Error("sin perfil"));
    }

    return new Promise<AuthUser>((resolve) => {
      setTimeout(() => resolve(profile), delays[token] ?? 0);
    });
  },
}));

function Probe() {
  const { status, role, user, login, logout } = useAuth();

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="role">{role ?? "none"}</span>
      <span data-testid="email">{user?.email ?? "none"}</span>
      <button
        type="button"
        onClick={() =>
          login({
            access_token: "admin-token",
            refresh_token: "admin-refresh",
            role: "admin",
          })
        }
      >
        login-admin
      </button>
      <button
        type="button"
        onClick={() =>
          login({
            access_token: "company-token",
            refresh_token: "company-refresh",
            role: "company",
          })
        }
      >
        login-company
      </button>
      <button type="button" onClick={() => logout()}>
        logout
      </button>
    </div>
  );
}

const click = async (name: string) => {
  await act(async () => {
    screen.getByText(name).click();
  });
};

beforeEach(() => {
  for (const key of Object.keys(delays)) delete delays[key];
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("AuthProvider session rebuild", () => {
  it("rebuilds role and identity when switching admin -> empresa", async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await click("login-admin");
    await waitFor(() =>
      expect(screen.getByTestId("role").textContent).toBe("admin"),
    );
    expect(screen.getByTestId("email").textContent).toBe("admin@rehni.test");

    await click("logout");
    expect(screen.getByTestId("status").textContent).toBe("unauthenticated");
    expect(screen.getByTestId("role").textContent).toBe("none");
    expect(localStorage.getItem("accessToken")).toBeNull();

    await click("login-company");
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("authenticated"),
    );

    expect(screen.getByTestId("role").textContent).toBe("company");
    expect(screen.getByTestId("email").textContent).toBe("empresa@rehni.test");
  });

  it("ignores a stale profile response from the previous session", async () => {
    delays["admin-token"] = 80;
    delays["company-token"] = 0;

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await click("login-admin");
    await click("login-company");

    await waitFor(() =>
      expect(screen.getByTestId("role").textContent).toBe("company"),
    );

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(screen.getByTestId("role").textContent).toBe("company");
    expect(screen.getByTestId("email").textContent).toBe("empresa@rehni.test");
  });

  it("clears the persisted session on logout", async () => {
    sessionStorage.setItem("postLoginRedirect", "/admin/dashboard");

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await click("login-admin");
    await waitFor(() =>
      expect(screen.getByTestId("role").textContent).toBe("admin"),
    );

    await click("logout");

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(localStorage.getItem("role")).toBeNull();
    expect(sessionStorage.getItem("postLoginRedirect")).toBeNull();
  });
});
