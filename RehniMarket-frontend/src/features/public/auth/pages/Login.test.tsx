import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { AxiosError } from "axios";

import Login from "./Login";
import { AuthProvider } from "@/features/public/auth/context/AuthProvider";
import type { Role } from "@/features/public/auth/types/auth";
import { setPostLoginRedirect } from "@/api/session";

const loginUser = vi.fn();
const getProfile = vi.fn();

vi.mock("@/features/public/auth/api/authService", () => ({
  loginUser: (...args: unknown[]) => loginUser(...args),
  getProfile: (...args: unknown[]) => getProfile(...args),
}));

function axiosErr(status: number, detail: Record<string, unknown>) {
  const err = new AxiosError("request failed");
  err.response = { status, data: { detail } } as never;
  return err;
}

function renderLogin() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<p>STORE HOME</p>} />
          <Route path="/admin/dashboard" element={<p>ADMIN DASHBOARD</p>} />
          <Route path="/company/dashboard" element={<p>COMPANY DASHBOARD</p>} />
          <Route path="/user/dashboard" element={<p>USER DASHBOARD</p>} />
          <Route path="/checkout" element={<p>CHECKOUT</p>} />
          <Route path="/actualizar-certificado" element={<p>PÁGINA ACTUALIZAR</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

function fillAndSubmit(email = "empresa@rehni.co") {
  fireEvent.change(screen.getByLabelText(/^Correo electrónico/), {
    target: { value: email, name: "email" },
  });
  fireEvent.change(screen.getByLabelText(/^Contraseña/), {
    target: { value: "secret123", name: "password" },
  });
  fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));
}

async function submitLogin(role: Role) {
  loginUser.mockResolvedValue({
    access_token: `access-${role}`,
    refresh_token: `refresh-${role}`,
    role,
  });
  getProfile.mockResolvedValue({
    email: `${role}@rehni.test`,
    name: role,
    role,
    tell: "3000000000",
    profileImagen: null,
  });

  renderLogin();
  fillAndSubmit(`${role}@rehni.test`);
}

describe("Login — destino tras iniciar sesión", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  for (const role of ["user", "company", "admin", "owner"] as Role[]) {
    it(`${role}: login → Home (nunca al dashboard)`, async () => {
      await submitLogin(role);

      await waitFor(() => expect(screen.getByText("STORE HOME")).toBeTruthy());

      expect(screen.queryByText(/DASHBOARD/)).not.toBeTruthy();
      // sesión persistida
      expect(localStorage.getItem("accessToken")).toBe(`access-${role}`);
      expect(localStorage.getItem("refreshToken")).toBe(`refresh-${role}`);
    });
  }

  it("respeta un deep link guardado por RequireAuth (no lo fuerza al Home)", async () => {
    setPostLoginRedirect("/checkout");
    await submitLogin("user");

    await waitFor(() => expect(screen.getByText("CHECKOUT")).toBeTruthy());
  });

  it("ignora un deep link no permitido para el rol y cae al Home", async () => {
    setPostLoginRedirect("/admin/dashboard");
    await submitLogin("company");

    await waitFor(() => expect(screen.getByText("STORE HOME")).toBeTruthy());
  });

  describe("empresa NEEDS_UPDATE", () => {
    beforeEach(() => {
      loginUser.mockRejectedValue(
        axiosErr(403, {
          code: "COMPANY_CERTIFICATE_INVALID",
          message: "El certificado que presentaste no es válido.",
          reason: "El PDF está ilegible",
        }),
      );
    });

    it("muestra el modal con el motivo real, sin navegar ni autenticar", async () => {
      renderLogin();
      fillAndSubmit();

      await waitFor(() =>
        expect(screen.getByText("Certificado no válido")).toBeTruthy(),
      );
      expect(screen.getByText("El PDF está ilegible")).toBeTruthy();

      // sigue en /login, no hay Home ni dashboard
      expect(screen.queryByText("STORE HOME")).not.toBeTruthy();
      expect(screen.queryByText(/DASHBOARD/)).not.toBeTruthy();
      // sin sesión: nada en localStorage
      expect(localStorage.getItem("accessToken")).toBeNull();
      expect(localStorage.getItem("refreshToken")).toBeNull();
      expect(localStorage.getItem("role")).toBeNull();
      expect(getProfile).not.toHaveBeenCalled();
    });

    it("'Actualizar certificado' navega a /actualizar-certificado (sin sesión)", async () => {
      renderLogin();
      fillAndSubmit();

      await waitFor(() =>
        expect(screen.getByText("Certificado no válido")).toBeTruthy(),
      );
      fireEvent.click(screen.getByRole("button", { name: /actualizar certificado/i }));

      await waitFor(() =>
        expect(screen.getByText("PÁGINA ACTUALIZAR")).toBeTruthy(),
      );
      expect(localStorage.getItem("accessToken")).toBeNull();
    });

    it("cerrar el modal deja al usuario en /login sin autenticar", async () => {
      renderLogin();
      fillAndSubmit();

      await waitFor(() =>
        expect(screen.getByText("Certificado no válido")).toBeTruthy(),
      );
      fireEvent.click(screen.getByRole("button", { name: /cerrar/i }));

      expect(screen.queryByRole("dialog")).not.toBeTruthy();
      expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeTruthy();
      expect(localStorage.getItem("accessToken")).toBeNull();
    });
  });

  describe("empresa REJECTED", () => {
    beforeEach(() => {
      loginUser.mockRejectedValue(
        axiosErr(403, {
          code: "COMPANY_REJECTED",
          message: "Tu empresa fue rechazada.",
          reason: "No cumple los requisitos",
        }),
      );
    });

    it("muestra el modal terminal con el motivo, sin JWT y sin botón de actualizar", async () => {
      renderLogin();
      fillAndSubmit();

      await waitFor(() =>
        expect(screen.getByText("Empresa rechazada")).toBeTruthy(),
      );
      expect(screen.getByText("No cumple los requisitos")).toBeTruthy();
      expect(
        screen.queryByRole("button", { name: /actualizar certificado/i }),
      ).not.toBeTruthy();
      expect(screen.getByRole("button", { name: /entendido/i })).toBeTruthy();

      expect(screen.queryByText("STORE HOME")).not.toBeTruthy();
      expect(localStorage.getItem("accessToken")).toBeNull();
      expect(localStorage.getItem("refreshToken")).toBeNull();
      expect(getProfile).not.toHaveBeenCalled();
    });

    it("'Entendido' cierra el modal y deja al usuario en /login", async () => {
      renderLogin();
      fillAndSubmit();

      await waitFor(() =>
        expect(screen.getByText("Empresa rechazada")).toBeTruthy(),
      );
      fireEvent.click(screen.getByRole("button", { name: /entendido/i }));

      expect(screen.queryByRole("dialog")).not.toBeTruthy();
      expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeTruthy();
    });
  });
});
