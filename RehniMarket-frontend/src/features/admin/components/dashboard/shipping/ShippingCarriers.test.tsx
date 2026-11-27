// Transportadoras del admin: catálogo global, validación del formulario y activación.
import { describe, expect, it } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";

import ShippingCarriers from "./ShippingCarriers";
import { renderWithProviders } from "@/test/renderApp";
import { reply } from "@/test/http";

const SERVI = { id: "s1", name: "Servientrega", tracking_url: "https://servi.co/?g={tracking}", is_active: true, created_at: "2026-01-01" };
const ENVIA = { id: "s2", name: "Envía", tracking_url: "https://envia.co", is_active: false, created_at: "2026-01-01" };

describe("Admin · Transportadoras", () => {
  it("lista con estado; error con reintento", async () => {
    let fail = true;
    renderWithProviders(<ShippingCarriers />, {
      routes: { "GET /admin/dashboard/shipping-carriers": () => (fail ? reply(500) : [SERVI, ENVIA]) },
    });
    expect(await screen.findByText("No se pudieron cargar las transportadoras")).toBeTruthy();
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(await screen.findByText("Servientrega")).toBeTruthy();
    expect(screen.getByText("Inactiva")).toBeTruthy();
  });

  it("vacío invita a crear la primera", async () => {
    renderWithProviders(<ShippingCarriers />, { routes: { "GET /admin/dashboard/shipping-carriers": [] } });
    expect(await screen.findByText("Aún no hay transportadoras")).toBeTruthy();
  });

  it("crear valida nombre y URL, envía el payload recortado y ordena alfabéticamente", async () => {
    const { http } = renderWithProviders(<ShippingCarriers />, {
      routes: {
        "GET /admin/dashboard/shipping-carriers": [SERVI],
        "POST /admin/dashboard/shipping-carriers": { ...ENVIA, id: "s3", name: "Coordinadora", is_active: false },
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Nueva transportadora/ }));
    const dialog = await screen.findByRole("dialog");
    const create = within(dialog).getByRole("button", { name: "Crear transportadora" }) as HTMLButtonElement;
    expect(create.disabled).toBe(true);

    fireEvent.change(within(dialog).getByLabelText(/Nombre/), { target: { value: "C" } });
    expect(within(dialog).getByText("Mínimo 2 caracteres.")).toBeTruthy();
    fireEvent.change(within(dialog).getByLabelText(/URL de seguimiento/), { target: { value: "ab" } });
    expect(within(dialog).getByText("URL inválida.")).toBeTruthy();

    fireEvent.change(within(dialog).getByLabelText(/Nombre/), { target: { value: "  Coordinadora " } });
    fireEvent.change(within(dialog).getByLabelText(/URL de seguimiento/), { target: { value: " https://coord.co/{tracking} " } });
    fireEvent.change(within(dialog).getByLabelText(/Estado/), { target: { value: "inactive" } });
    fireEvent.click(create);

    expect(await screen.findByText("Transportadora creada.")).toBeTruthy();
    expect(http.calls("POST /admin/dashboard/shipping-carriers")[0].body).toEqual({
      name: "Coordinadora",
      tracking_url: "https://coord.co/{tracking}",
      is_active: false,
    });
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0].textContent).toContain("Coordinadora");
  });

  it("editar usa PUT y reemplaza la fila; el interruptor cambia el estado", async () => {
    const { http } = renderWithProviders(<ShippingCarriers />, {
      routes: {
        "GET /admin/dashboard/shipping-carriers": [SERVI],
        "PUT /admin/dashboard/shipping-carriers/:id": { ...SERVI, name: "Servientrega SA" },
        "PATCH /admin/dashboard/shipping-carriers/:id/status": { ...SERVI, name: "Servientrega SA", is_active: false },
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Editar Servientrega" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByDisplayValue("Servientrega"), { target: { value: "Servientrega SA" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Transportadora actualizada.")).toBeTruthy();
    expect(await screen.findByText("Servientrega SA")).toBeTruthy();
    expect(http.calls("PUT /admin/dashboard/shipping-carriers/:id")[0].url).toBe("/admin/dashboard/shipping-carriers/s1");

    fireEvent.click(screen.getByRole("button", { name: "Desactivar Servientrega SA" }));
    expect(await screen.findByRole("button", { name: "Activar Servientrega SA" })).toBeTruthy();
    expect(http.calls("PATCH /admin/dashboard/shipping-carriers/:id/status")[0].body).toEqual({ is_active: false });
  });
});
