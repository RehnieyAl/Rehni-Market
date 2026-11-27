// Catálogo del admin: CRUD de categorías (multipart al backend) y atributos/opciones por categoría.
import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import CatalogManagement from "../CatalogManagement";
import { renderWithProviders } from "@/test/renderApp";
import { formDataToObject, makeFile, reply } from "@/test/http";

const ROPA = { id: "k1", name: "Ropa", description: "Prendas", image_url: "https://cdn.test/ropa.png", display_order: 2, is_active: true, product_count: 5 };
const HOGAR = { id: "k2", name: "Hogar", description: null, image_url: null, display_order: 1, is_active: false, product_count: 0 };

const ATTR_COLOR = {
  id: "a1",
  catalog_id: "k1",
  name: "Color",
  role: "variant",
  input_type: "color",
  unit: null,
  is_active: true,
  position: 0,
  options: [{ id: "o1", value: "Rojo", hex_color: "#ff0000", position: 0 }],
};
const ATTR_RAM = { ...ATTR_COLOR, id: "a2", name: "RAM", role: "product", input_type: "number", unit: "GB", is_active: false, options: [] };

describe("Admin · Categorías", () => {
  it("ordena por display_order y muestra estado, productos e imagen", async () => {
    renderWithProviders(<CatalogManagement />, { routes: { "GET /admin/dashboard/get-catalogs": [ROPA, HOGAR] } });

    await screen.findByText("Ropa");
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0].textContent).toContain("Hogar");
    expect(rows[1].textContent).toContain("Ropa");
    expect(screen.getByText("Inactiva")).toBeTruthy();
    expect(screen.getByAltText("Ropa")).toBeTruthy();
  });

  it("sin categorías muestra el estado vacío", async () => {
    renderWithProviders(<CatalogManagement />, { routes: { "GET /admin/dashboard/get-catalogs": [] } });
    expect(await screen.findByText("Aún no hay categorías")).toBeTruthy();
  });

  it("crear una categoría con imagen la envía en multipart y la agrega a la tabla", async () => {
    const { http, container } = renderWithProviders(<CatalogManagement />, {
      routes: {
        "GET /admin/dashboard/get-catalogs": [],
        "POST /admin/dashboard/created-catalogs": { ...ROPA, id: "k9", name: "Mascotas" },
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Nueva categoría/ }));
    fireEvent.change(screen.getByPlaceholderText("Ej: Computadoras"), { target: { value: "Mascotas" } });
    const image = makeFile("gato.png", "image/png");
    const input = container.ownerDocument.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [image] } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Mascotas")).toBeTruthy();
    const sent = formDataToObject(http.calls("POST /admin/dashboard/created-catalogs")[0].body);
    expect(sent.name).toBe("Mascotas");
    expect(sent.image).toBe(image);
  });

  it("editar envía PUT con los cambios y reemplaza la fila", async () => {
    const { http } = renderWithProviders(<CatalogManagement />, {
      routes: {
        "GET /admin/dashboard/get-catalogs": [ROPA],
        "PUT /admin/dashboard/update-catalogs/:id": { ...ROPA, name: "Ropa y moda" },
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Editar Ropa" }));
    fireEvent.change(screen.getByDisplayValue("Ropa"), { target: { value: "Ropa y moda" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Ropa y moda")).toBeTruthy();
    const sent = formDataToObject(http.calls("PUT /admin/dashboard/update-catalogs/:id")[0].body);
    expect(sent.name).toBe("Ropa y moda");
    expect(sent.image).toBeUndefined();
  });

  it("activar/desactivar y eliminar (con confirmación)", async () => {
    const { http } = renderWithProviders(<CatalogManagement />, {
      routes: {
        "GET /admin/dashboard/get-catalogs": [ROPA],
        "PATCH /admin/dashboard/change-status-catalog/:id": { ...ROPA, is_active: false },
        "DELETE /admin/dashboard/delete-catalogs/:id": reply(204, null),
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Desactivar Ropa" }));
    expect(await screen.findByRole("button", { name: "Activar Ropa" })).toBeTruthy();
    expect(http.calls("PATCH /admin/dashboard/change-status-catalog/:id")[0].body).toEqual({ is_active: false });

    fireEvent.click(screen.getByRole("button", { name: "Eliminar Ropa" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/no se puede deshacer/)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Eliminar catálogo" }));
    await waitFor(() => expect(screen.queryByText("Ropa")).toBeNull());
    expect(http.calls("DELETE /admin/dashboard/delete-catalogs/:id")[0].url).toBe("/admin/dashboard/delete-catalogs/k1");
  });
});

describe("Admin · Atributos de categoría", () => {
  async function openAttributes(routes: Record<string, unknown>) {
    const result = renderWithProviders(<CatalogManagement />, {
      routes: { "GET /admin/dashboard/get-catalogs": [ROPA], ...routes },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Atributos de Ropa" }));
    await screen.findByText("Atributos y variantes");
    return result;
  }

  it("lista atributos con rol, tipo, unidad y opciones de color", async () => {
    await openAttributes({ "GET /admin/dashboard/catalogs/:id/catalog-attributes": [ATTR_COLOR, ATTR_RAM] });
    expect(await screen.findByText("Eje de variante · Color")).toBeTruthy();
    expect(screen.getByText("Atributo de producto · Número")).toBeTruthy();
    expect(screen.getByText(/RAM\s*\(GB\)/)).toBeTruthy();
    expect(screen.getByText("Inactivo")).toBeTruthy();
    expect(screen.getByText("Rojo")).toBeTruthy();
  });

  it("crear un atributo numérico envía la unidad y la posición, y recarga", async () => {
    let attrs: unknown[] = [];
    const { http } = await openAttributes({
      "GET /admin/dashboard/catalogs/:id/catalog-attributes": () => attrs,
      "POST /admin/dashboard/catalogs/:id/catalog-attributes": () => {
        attrs = [ATTR_RAM];
        return ATTR_RAM;
      },
    });
    await screen.findByText("Esta categoría todavía no tiene atributos");

    fireEvent.change(screen.getByPlaceholderText("Ej: Color, Talla, Marca"), { target: { value: " RAM " } });
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "product" } });
    fireEvent.change(selects[1], { target: { value: "number" } });
    fireEvent.change(screen.getByPlaceholderText("Ej: GB, cm"), { target: { value: " GB " } });
    fireEvent.click(screen.getByRole("button", { name: /Agregar/ }));

    expect(await screen.findByText(/RAM\s*\(GB\)/)).toBeTruthy();
    expect(http.calls("POST /admin/dashboard/catalogs/:id/catalog-attributes")[0].body).toEqual({
      name: "RAM",
      role: "product",
      input_type: "number",
      unit: "GB",
      position: 0,
    });
  });

  it("agregar y quitar opciones de color; cambiar estado y eliminar atributo", async () => {
    const { http } = await openAttributes({
      "GET /admin/dashboard/catalogs/:id/catalog-attributes": [ATTR_COLOR],
      "POST /admin/dashboard/catalog-attributes/:id/options": {},
      "DELETE /admin/dashboard/catalog-attribute-options/:id": {},
      "PATCH /admin/dashboard/catalog-attributes/:id/status": {},
      "DELETE /admin/dashboard/catalog-attributes/:id": {},
    });
    await screen.findByText("Rojo");

    fireEvent.change(screen.getByPlaceholderText("Nuevo valor"), { target: { value: " Azul " } });
    const picker = document.querySelector('input[type="color"]') as HTMLInputElement;
    fireEvent.change(picker, { target: { value: "#0000ff" } });
    const addButtons = screen.getAllByRole("button", { name: "Agregar" });
    fireEvent.click(addButtons[addButtons.length - 1]);
    await waitFor(() =>
      expect(http.calls("POST /admin/dashboard/catalog-attributes/:id/options")[0].body).toEqual({
        value: "Azul",
        hex_color: "#0000ff",
        position: 0,
      }),
    );

    const chip = screen.getByText("Rojo").parentElement as HTMLElement;
    await waitFor(() => expect((within(chip).getByRole("button") as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(within(chip).getByRole("button"));
    await waitFor(() => expect(http.calls("DELETE /admin/dashboard/catalog-attribute-options/:id")[0].url).toBe("/admin/dashboard/catalog-attribute-options/o1"));

    await waitFor(() => expect((screen.getByTitle("Desactivar") as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByTitle("Desactivar"));
    await waitFor(() => expect(http.calls("PATCH /admin/dashboard/catalog-attributes/:id/status")[0].body).toEqual({ is_active: false }));

    await waitFor(() => expect((screen.getByTitle("Eliminar atributo") as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByTitle("Eliminar atributo"));
    await waitFor(() => expect(http.calls("DELETE /admin/dashboard/catalog-attributes/:id")).toHaveLength(1));
  });

  it("un fallo al eliminar muestra el motivo de negocio", async () => {
    await openAttributes({
      "GET /admin/dashboard/catalogs/:id/catalog-attributes": [ATTR_COLOR],
      "DELETE /admin/dashboard/catalog-attributes/:id": reply(409, { detail: { message: "En uso" } }),
    });
    fireEvent.click(await screen.findByTitle("Eliminar atributo"));
    expect(await screen.findByText("No se pudo eliminar: hay productos o variantes que lo usan.")).toBeTruthy();
  });

  it("si la carga falla lo informa y Cerrar oculta el modal", async () => {
    await openAttributes({ "GET /admin/dashboard/catalogs/:id/catalog-attributes": reply(500) });
    expect(await screen.findByText("No se pudieron cargar los atributos.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    await waitFor(() => expect(screen.queryByText("Atributos y variantes")).toBeNull());
  });
});
