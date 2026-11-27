// Catálogo de bancos en administración: pestaña dentro de Catálogo, listado con logo y estado, registro con
// logo y vista previa, validaciones, edición, activación, errores y acceso según el rol.
import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import CatalogManagement from "../CatalogManagement";
import { renderApp, renderWithProviders } from "@/test/renderApp";
import { apiError, formDataToObject, makeFile, reply } from "@/test/http";

const BANCOLOMBIA = {
  id: "k1",
  name: "Bancolombia",
  logoUrl: "https://cdn.test/bancolombia.png",
  isActive: true,
  accountsCount: 2,
  createdAt: "2026-11-01",
  updatedAt: null,
};
const CERRADO = { ...BANCOLOMBIA, id: "k2", name: "Banco Cerrado", logoUrl: null, isActive: false, accountsCount: 0 };

function openBanks(routes: Record<string, unknown>) {
  const result = renderWithProviders(<CatalogManagement />, {
    routes: { "GET /admin/dashboard/get-catalogs": [], ...routes },
  });
  fireEvent.click(screen.getByRole("button", { name: "Bancos" }));
  return result;
}

describe("Admin · catálogo de bancos", () => {
  it("lista logo, nombre, estado y cuentas enlazadas; sin logo usa el icono", async () => {
    openBanks({ "GET /admin/dashboard/banks": [BANCOLOMBIA, CERRADO] });
    const items = await screen.findAllByRole("listitem");

    expect(within(items[0]).getByAltText("Logo de Bancolombia")).toBeTruthy();
    expect(within(items[0]).getByText("2 cuentas enlazadas")).toBeTruthy();
    expect(within(items[0]).getByText("Activo")).toBeTruthy();
    expect(within(items[1]).getByLabelText("Banco Cerrado (sin logo)")).toBeTruthy();
    expect(within(items[1]).getByText("Inactivo")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Eliminar/ })).toBeNull();
  });

  it("registra un banco con logo: valida el nombre y el archivo, y muestra la vista previa", async () => {
    let banks: unknown[] = [];
    const { http } = openBanks({
      "GET /admin/dashboard/banks": () => banks,
      "POST /admin/dashboard/banks": () => {
        banks = [BANCOLOMBIA];
        return BANCOLOMBIA;
      },
    });
    expect(await screen.findByText("Aún no hay bancos registrados")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Registrar banco/ }));
    const dialog = await screen.findByRole("dialog", { name: "Registrar banco" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar banco" }));
    expect(within(dialog).getByText("Escribe el nombre del banco (mínimo 2 caracteres).")).toBeTruthy();

    const input = dialog.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile("logo.gif", "image/gif")] } });
    expect((await screen.findAllByText(/Logo del banco: solo se admite/)).length).toBeGreaterThan(0);

    const logo = makeFile("logo.png", "image/png");
    fireEvent.change(input, { target: { files: [logo] } });
    expect((within(dialog).getByAltText(/^Logo de/) as HTMLImageElement).src).toContain("blob:");

    fireEvent.change(within(dialog).getByLabelText(/Nombre/), { target: { value: "  Bancolombia  " } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar banco" }));

    await waitFor(() => expect(http.calls("POST /admin/dashboard/banks")).toHaveLength(1));
    expect(formDataToObject(http.calls("POST /admin/dashboard/banks")[0].body)).toEqual({
      name: "Bancolombia",
      is_active: "true",
      logo,
    });
    expect(await screen.findByText("Banco registrado.")).toBeTruthy();
    expect(await screen.findByText("Bancolombia")).toBeTruthy();
  });

  it("un nombre duplicado muestra el mensaje de la API en el campo", async () => {
    openBanks({
      "GET /admin/dashboard/banks": [],
      "POST /admin/dashboard/banks": apiError(409, "BANK_ALREADY_EXISTS", "Ya existe un banco con ese nombre."),
    });
    fireEvent.click(await screen.findByRole("button", { name: /Registrar banco/ }));
    const dialog = await screen.findByRole("dialog", { name: "Registrar banco" });
    fireEvent.change(within(dialog).getByLabelText(/Nombre/), { target: { value: "BANCOLOMBIA" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar banco" }));

    expect((await within(dialog).findAllByText("Ya existe un banco con ese nombre.")).length).toBeGreaterThan(0);
  });

  it("editar precarga los datos y envía solo lo que cambió", async () => {
    const { http } = openBanks({
      "GET /admin/dashboard/banks": [BANCOLOMBIA],
      "PATCH /admin/dashboard/banks/:id": { ...BANCOLOMBIA, name: "Bancolombia S.A." },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Editar Bancolombia" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar banco" });
    expect((within(dialog).getByLabelText(/Nombre/) as HTMLInputElement).value).toBe("Bancolombia");
    expect(within(dialog).getByText("Reemplazar logo")).toBeTruthy();

    fireEvent.change(within(dialog).getByLabelText(/Nombre/), { target: { value: "Bancolombia S.A." } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar banco" }));

    await waitFor(() => expect(http.calls("PATCH /admin/dashboard/banks/:id")).toHaveLength(1));
    expect(http.calls("PATCH /admin/dashboard/banks/:id")[0].url).toBe("/admin/dashboard/banks/k1");
    expect(formDataToObject(http.calls("PATCH /admin/dashboard/banks/:id")[0].body)).toEqual({ name: "Bancolombia S.A." });
  });

  it("activar y desactivar sin borrar", async () => {
    let banks = [BANCOLOMBIA];
    const { http } = openBanks({
      "GET /admin/dashboard/banks": () => banks,
      "PATCH /admin/dashboard/banks/:id": () => {
        banks = [{ ...BANCOLOMBIA, isActive: false }];
        return banks[0];
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Desactivar Bancolombia" }));

    await waitFor(() => expect(http.calls("PATCH /admin/dashboard/banks/:id")).toHaveLength(1));
    expect(formDataToObject(http.calls("PATCH /admin/dashboard/banks/:id")[0].body)).toEqual({ is_active: "false" });
    expect(await screen.findByRole("button", { name: "Activar Bancolombia" })).toBeTruthy();
  });

  it("error al cargar con reintento", async () => {
    let fail = true;
    openBanks({ "GET /admin/dashboard/banks": () => (fail ? reply(500) : [CERRADO]) });
    expect(await screen.findByText("No se pudo cargar el catálogo de bancos")).toBeTruthy();
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(await screen.findByText("Banco Cerrado")).toBeTruthy();
  });

  it.each(["admin", "owner"] as const)("el rol %s llega a Bancos desde Catálogo", async (role) => {
    renderApp("/admin/dashboard?tab=products", {
      role,
      routes: { "GET /admin/dashboard/get-catalogs": [], "GET /admin/dashboard/banks": [BANCOLOMBIA] },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Bancos" }));
    expect(await screen.findByText("Bancolombia")).toBeTruthy();
  });
});
