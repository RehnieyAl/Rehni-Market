// Gestión de usuarios del admin: listado, búsqueda, paginación por cursor, bloqueo y edición.
import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import Users from "./Users";
import { renderWithProviders } from "@/test/renderApp";
import { reply } from "@/test/http";

const ANA = {
  id: "u1",
  fullName: "Ana Gómez",
  email: "ana@rehni.test",
  tell: "3001112233",
  profileImagen: null as string | null,
  role: "user",
  isActive: true,
  created_at: "2026-01-10T00:00:00Z",
};
const ADMIN = { ...ANA, id: "u2", fullName: "Beto Admin", email: "beto@rehni.test", role: "admin" };
const COMPANY = { ...ANA, id: "u3", fullName: "Tienda Uno", email: "t@rehni.test", role: "company", isActive: false };
const OWNER = { ...ANA, id: "u4", fullName: "Dueño", email: "owner@rehni.test", role: "owner", profileImagen: "https://cdn.test/o.png" };

function page(items: unknown[], extra = {}) {
  return { items, next_cursor: null, previous_cursor: null, has_next: false, has_previous: false, ...extra };
}

describe("Admin · Usuarios", () => {
  it("lista usuarios con su rol y estado; la cuenta owner no tiene botón de bloqueo", async () => {
    const { http } = renderWithProviders(<Users />, {
      routes: { "GET /admin/dashboard/get-users": page([ANA, ADMIN, COMPANY, OWNER]) },
    });

    expect(await screen.findByText("Ana Gómez")).toBeTruthy();
    expect(screen.getByText("4 usuarios")).toBeTruthy();
    expect(screen.getByText("Propietario")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Bloquear Ana Gómez" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Desbloquear Tienda Uno" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Bloquear Dueño" })).toBeNull();
    // Solo los compradores reciben recargas de RehniCoin.
    expect(screen.getByRole("button", { name: "Recargar RehniCoin de Ana Gómez" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Recargar RehniCoin de Beto Admin" })).toBeNull();

    expect(http.calls("GET /admin/dashboard/get-users")[0].params).toEqual({ limit: "10" });
  });

  it("buscar reenvía el término y la paginación usa los cursores del backend", async () => {
    const { http } = renderWithProviders(<Users />, {
      routes: {
        "GET /admin/dashboard/get-users": (req: { params: Record<string, string> }) => {
          if (req.params.cursor === "c2") return page([ADMIN], { previous_cursor: "p1", has_previous: true });
          if (req.params.before_cursor === "p1") return page([ANA], { next_cursor: "c2", has_next: true });
          if (req.params.search === "ana") return page([ANA]);
          return page([ANA], { next_cursor: "c2", has_next: true });
        },
      },
    });

    await screen.findByText("Ana Gómez");
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(await screen.findByText("Beto Admin")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(await screen.findByText("Ana Gómez")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Buscar usuarios"), { target: { value: "ana" } });
    await waitFor(() =>
      expect(http.calls("GET /admin/dashboard/get-users").some((r) => r.params.search === "ana")).toBe(true),
    );
    const calls = http.calls("GET /admin/dashboard/get-users");
    expect(calls.some((r) => r.params.cursor === "c2")).toBe(true);
    expect(calls.some((r) => r.params.before_cursor === "p1")).toBe(true);
  });

  it("muestra vacío y error con reintento", async () => {
    let fail = true;
    renderWithProviders(<Users />, {
      routes: {
        "GET /admin/dashboard/get-users": () => (fail ? reply(500) : page([])),
      },
    });

    expect(await screen.findByText("No pudimos cargar los usuarios")).toBeTruthy();
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/i }));
    expect(await screen.findByText("No se encontraron usuarios")).toBeTruthy();
  });

  it("bloquear pide confirmación y actualiza la fila con la respuesta", async () => {
    const { http } = renderWithProviders(<Users />, {
      routes: {
        "GET /admin/dashboard/get-users": page([ANA]),
        "PATCH /admin/dashboard/user/update-information/status/:id": { ...ANA, isActive: false },
      },
    });

    fireEvent.click(await screen.findByRole("button", { name: "Bloquear Ana Gómez" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/perderá el acceso/)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Bloquear usuario" }));

    expect(await screen.findByRole("button", { name: "Desbloquear Ana Gómez" })).toBeTruthy();
    expect(http.calls("PATCH /admin/dashboard/user/update-information/status/:id")[0].url).toBe(
      "/admin/dashboard/user/update-information/status/u1",
    );
  });

  it("cancelar el bloqueo no llama al backend", async () => {
    const { http } = renderWithProviders(<Users />, {
      routes: { "GET /admin/dashboard/get-users": page([ANA]) },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Bloquear Ana Gómez" }));
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(http.calls("PATCH /admin/dashboard/user/update-information/status/:id")).toHaveLength(0);
  });
});

describe("Admin · Detalle de usuario", () => {
  async function openDetail(user: typeof ANA, extraRoutes = {}) {
    const result = renderWithProviders(<Users />, {
      routes: {
        "GET /admin/dashboard/get-users": page([user]),
        "GET /admin/dashboard/get-user/:id": user,
        ...extraRoutes,
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: `Ver ${user.fullName}` }));
    await screen.findByText("Detalle de usuario");
    return result;
  }

  it("promover un usuario a admin avisa del cambio y envía solo los campos cambiados", async () => {
    const { http } = await openDetail(ANA, {
      "PATCH /admin/dashboard/user/update-information/:id": { ...ANA, email: "nueva@rehni.test", role: "admin" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Editar información/ }));
    expect(screen.getByText("Editar información")).toBeTruthy();

    fireEvent.change(screen.getByDisplayValue("ana@rehni.test"), { target: { value: "  nueva@rehni.test " } });
    fireEvent.change(screen.getByDisplayValue("Usuario"), { target: { value: "admin" } });
    expect(screen.getByText(/dejará de poder\s+realizar nuevas compras/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/ }));
    await screen.findByText("Detalle de usuario");
    expect(http.calls("PATCH /admin/dashboard/user/update-information/:id")[0].body).toEqual({
      email: "nueva@rehni.test",
      role: "admin",
    });
    expect(screen.getAllByText("nueva@rehni.test").length).toBeGreaterThan(0);
  });

  it("guardar sin cambios no llama al backend; volver a usuario muestra su aviso", async () => {
    const { http } = await openDetail(ADMIN);

    fireEvent.click(screen.getByRole("button", { name: /Editar información/ }));
    fireEvent.change(screen.getByDisplayValue("Administrador"), { target: { value: "user" } });
    expect(screen.getByText(/recuperará\s+la posibilidad de realizar compras/)).toBeTruthy();
    fireEvent.change(screen.getByDisplayValue("Usuario"), { target: { value: "admin" } });

    fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/ }));
    await screen.findByText("Detalle de usuario");
    expect(http.calls("PATCH /admin/dashboard/user/update-information/:id")).toHaveLength(0);
  });

  it("el rol de una empresa está protegido y la cuenta owner no es editable", async () => {
    await openDetail(COMPANY);
    fireEvent.click(screen.getByRole("button", { name: /Editar información/ }));
    expect(screen.getByText("Rol protegido")).toBeTruthy();
    expect(screen.queryByRole("combobox")).toBeNull();
    // El botón inferior cancela la edición en lugar de cerrar.
    const cancelButtons = screen.getAllByRole("button", { name: /Cancelar/ });
    fireEvent.click(cancelButtons[cancelButtons.length - 1]);
    expect(await screen.findByText("Detalle de usuario")).toBeTruthy();
  });

  it("owner: sin edición, con aviso de gestión exclusiva", async () => {
    await openDetail(OWNER);
    expect(screen.getByText("Solo un Owner puede gestionar esta cuenta.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Editar información/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    await waitFor(() => expect(screen.queryByText("Detalle de usuario")).toBeNull());
  });

  it("si el detalle falla lo informa", async () => {
    renderWithProviders(<Users />, {
      routes: {
        "GET /admin/dashboard/get-users": page([ANA]),
        "GET /admin/dashboard/get-user/:id": reply(500),
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Ver Ana Gómez" }));
    expect(await screen.findByText("No se pudo cargar la información del usuario.")).toBeTruthy();
  });
});
