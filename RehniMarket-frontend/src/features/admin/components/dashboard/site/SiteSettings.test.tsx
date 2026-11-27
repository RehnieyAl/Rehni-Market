// Configuración de la página web: solo el owner la ve y edita el contacto institucional; el admin no
// tiene la sección; validación y publicación selectiva coherentes con el backend.
import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { renderApp } from "@/test/renderApp";
import { apiError } from "@/test/http";

const EMPTY = {
  contactEmail: null,
  contactPhone: null,
  emailPublic: false,
  phonePublic: false,
  updatedAt: null,
  updatedByName: null,
};

afterEach(() => {
  localStorage.clear();
});

describe("Configuración de la página web", () => {
  it("el owner guarda correo y teléfono y elige qué se publica", async () => {
    const { http } = renderApp("/admin/dashboard?tab=site", {
      role: "owner",
      routes: {
        "GET /admin/platform-settings/contact": EMPTY,
        "PUT /admin/platform-settings/contact": (req: { body: Record<string, unknown> }) => ({
          ...EMPTY,
          ...req.body,
          updatedAt: "2026-11-25T20:00:00Z",
          updatedByName: "Owner",
        }),
      },
    });

    expect(await screen.findByRole("heading", { name: "Configuración de la página web" })).toBeTruthy();
    expect(await screen.findByText("Aún no se ha configurado.")).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Correo de contacto/), { target: { value: " soporte@rehni.test " } });
    fireEvent.change(screen.getByLabelText(/Teléfono de contacto/), { target: { value: "+57 601 555 0101" } });
    fireEvent.click(screen.getByRole("switch", { name: /Publicar el correo/ }));
    fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/ }));

    await waitFor(() => expect(http.calls("PUT /admin/platform-settings/contact")).toHaveLength(1));
    expect(http.calls("PUT /admin/platform-settings/contact")[0].body).toEqual({
      contactEmail: "soporte@rehni.test",
      contactPhone: "+57 601 555 0101",
      emailPublic: true,
      phonePublic: false,
    });
    expect(await screen.findByText("Información de contacto guardada.")).toBeTruthy();
    expect(screen.getByText(/Última actualización: .* · Owner/)).toBeTruthy();
  });

  it("no publica un dato vacío ni envía formatos inválidos", async () => {
    const { http } = renderApp("/admin/dashboard?tab=site", {
      role: "owner",
      routes: { "GET /admin/platform-settings/contact": EMPTY },
    });
    await screen.findByText("Aún no se ha configurado.");

    fireEvent.click(screen.getByRole("switch", { name: /Publicar el teléfono/ }));
    fireEvent.change(screen.getByLabelText(/Correo de contacto/), { target: { value: "no-es-correo" } });
    fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/ }));

    expect(await screen.findByText("Escribe un correo válido.")).toBeTruthy();
    expect(screen.getByText("Para publicar el teléfono primero debes escribirlo.")).toBeTruthy();
    expect(http.calls("PUT /admin/platform-settings/contact")).toHaveLength(0);
  });

  it("muestra el error del backend al guardar y permite reintentar la carga", async () => {
    let fail = true;
    renderApp("/admin/dashboard?tab=site", {
      role: "owner",
      routes: {
        "GET /admin/platform-settings/contact": () => (fail ? apiError(500, "INTERNAL_SERVER_ERROR", "x") : EMPTY),
        "PUT /admin/platform-settings/contact": apiError(403, "FORBIDDEN", "Solo el propietario puede gestionar la información de contacto de la plataforma."),
      },
    });

    expect(await screen.findByText("No se pudo cargar la información de contacto")).toBeTruthy();
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    await screen.findByText("Aún no se ha configurado.");
    fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/ }));
    expect(await screen.findByText(/Solo el propietario puede gestionar/)).toBeTruthy();
  });

  it("el admin no tiene la sección: ni en el menú ni por URL", async () => {
    const { http } = renderApp("/admin/dashboard?tab=site", { role: "admin", routes: { "GET /admin/dashboard/stats": {} } });

    await screen.findByText("Panel Administrador");
    expect(screen.queryByRole("button", { name: /Configuración web/ })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Configuración de la página web" })).toBeNull();
    expect(http.calls("GET /admin/platform-settings/contact")).toHaveLength(0);
  });

  it("el owner la ve en su menú", async () => {
    renderApp("/admin/dashboard", { role: "owner" });
    expect((await screen.findAllByText("Configuración web")).length).toBeGreaterThan(0);
  });
});
