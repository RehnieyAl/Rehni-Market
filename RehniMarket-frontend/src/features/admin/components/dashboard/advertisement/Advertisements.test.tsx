// Anuncios del Hero: listado, segmentación por tipo, edición, estado, vista previa y borrado.
import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import Advertisements from "./Advertisements";
import { renderWithProviders } from "@/test/renderApp";
import { formDataToObject, makeFile } from "@/test/http";

const MANUAL = {
  id: "ad1",
  image_url: "https://cdn.test/a.png",
  mobile_image_url: "https://cdn.test/m.png",
  button_link: "/offers",
  is_active: true,
  order: 2,
  created_at: "2026-11-01",
  target_type: null,
  target_product_id: null,
  target_catalog_id: null,
  target_company_id: null,
  minimum_discount: null,
  maximum_stock: null,
  max_age_days: null,
};
const CATEGORY = { ...MANUAL, id: "ad2", order: 1, is_active: false, button_link: null, target_type: "CATEGORY", target_catalog_id: "k1", minimum_discount: 20 };
const PRODUCT_AD = { ...MANUAL, id: "ad3", target_type: "PRODUCT", target_product_id: "p1" };
const COMPANY_AD = { ...MANUAL, id: "ad4", target_type: "COMPANY", target_company_id: "e1" };

function fileInputs() {
  return Array.from(document.querySelectorAll('input[type="file"]')) as HTMLInputElement[];
}

function selectTargetType(value: string) {
  fireEvent.change(screen.getByDisplayValue(/Manual|Producto específico|Categoría|Empresa/), { target: { value } });
}

describe("Admin · Anuncios", () => {
  it("lista ordenada por orden con tipo, estado, descuento y destino", async () => {
    renderWithProviders(<Advertisements />, { routes: { "GET /admin/dashboard/get-advertisements": [MANUAL, CATEGORY] } });
    expect(await screen.findByText("Banner manual")).toBeTruthy();
    expect(screen.getByText("Categoría")).toBeTruthy();
    expect(screen.getByText("Descuento: 20%")).toBeTruthy();
    expect(screen.getByText("Destino: /offers")).toBeTruthy();
    expect(screen.getByText("Inactivo")).toBeTruthy();
  });

  it("vacío invita a crear; descargar plantilla no rompe", async () => {
    renderWithProviders(<Advertisements />, { routes: { "GET /admin/dashboard/get-advertisements": [] } });
    expect(await screen.findByText("Aún no hay anuncios")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Plantilla web/ }));
    fireEvent.click(screen.getByRole("button", { name: /Plantilla móvil/ }));
  });

  it("crear un anuncio de promoción exige descuento y envía la segmentación", async () => {
    const { http } = renderWithProviders(<Advertisements />, {
      routes: {
        "GET /admin/dashboard/get-advertisements": [],
        "POST /admin/dashboard/create-advertisement": { ...MANUAL, id: "ad9", target_type: "PROMOTION" },
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Nuevo anuncio/ }));
    const image = makeFile("banner.webp", "image/webp");
    fireEvent.change(fileInputs()[0], { target: { files: [image] } });
    selectTargetType("PROMOTION");
    const save = screen.getByRole("button", { name: "Guardar" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.change(screen.getByPlaceholderText("20"), { target: { value: "25" } });
    expect(save.disabled).toBe(false);
    fireEvent.click(save);

    expect(await screen.findByText("Promoción")).toBeTruthy();
    const sent = formDataToObject(http.calls("POST /admin/dashboard/create-advertisement")[0].body);
    expect(sent).toMatchObject({ order: "0", is_active: "true", image, target_type: "PROMOTION", minimum_discount: "25" });
    expect(sent.button_link).toBeUndefined();
  });

  it("liquidación acepta stock máximo; nuevos lanzamientos exige días", async () => {
    const { http } = renderWithProviders(<Advertisements />, {
      routes: {
        "GET /admin/dashboard/get-advertisements": [],
        "POST /admin/dashboard/create-advertisement": (req: { body: unknown }) => ({
          ...MANUAL,
          id: String(Math.random()),
          target_type: formDataToObject(req.body).target_type,
        }),
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Nuevo anuncio/ }));
    fireEvent.change(fileInputs()[0], { target: { files: [makeFile("a.png", "image/png")] } });
    selectTargetType("LIQUIDATION");
    fireEvent.change(screen.getByPlaceholderText("5"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Liquidación")).toBeTruthy();
    expect(formDataToObject(http.calls("POST /admin/dashboard/create-advertisement")[0].body).maximum_stock).toBe("3");

    fireEvent.click(screen.getByRole("button", { name: /Nuevo anuncio/ }));
    fireEvent.change(fileInputs()[0], { target: { files: [makeFile("b.png", "image/png")] } });
    selectTargetType("NEW_RELEASE");
    const save = screen.getByRole("button", { name: "Guardar" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.change(screen.getByPlaceholderText("30"), { target: { value: "15" } });
    fireEvent.click(save);
    expect(await screen.findByText("Nuevos lanzamientos")).toBeTruthy();
    expect(formDataToObject(http.calls("POST /admin/dashboard/create-advertisement")[1].body).max_age_days).toBe("15");
  });

  it("segmentar por producto y por empresa usa los buscadores", async () => {
    const { http } = renderWithProviders(<Advertisements />, {
      routes: {
        "GET /admin/dashboard/get-advertisements": [],
        "GET /public/products": { products: [{ id: "p1", name: "Silla Roble", company_name: "ACME" }], total: 1 },
        "GET /admin/dashboard/get-companies": { items: [{ id: "e1", nameCompany: "ACME" }], next_cursor: null, has_next: false },
        "POST /admin/dashboard/create-advertisement": { ...PRODUCT_AD, id: "ad9" },
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Nuevo anuncio/ }));
    fireEvent.change(fileInputs()[0], { target: { files: [makeFile("a.png", "image/png")] } });

    selectTargetType("COMPANY");
    fireEvent.change(screen.getByPlaceholderText("Buscar empresa por nombre..."), { target: { value: "acm" } });
    fireEvent.click(await screen.findByRole("button", { name: /ACME/ }));
    expect(http.calls("GET /admin/dashboard/get-companies")[0].params).toEqual({ limit: "6", search: "acm" });

    selectTargetType("PRODUCT");
    fireEvent.change(screen.getByPlaceholderText("Buscar producto por nombre..."), { target: { value: "silla" } });
    fireEvent.click(await screen.findByRole("button", { name: /Silla Roble/ }));
    expect(http.calls("GET /public/products")[0].params).toEqual({ search: "silla", page: "1", limit: "6" });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(http.calls("POST /admin/dashboard/create-advertisement")).toHaveLength(1));
    const sent = formDataToObject(http.calls("POST /admin/dashboard/create-advertisement")[0].body);
    expect(sent).toMatchObject({ target_type: "PRODUCT", target_product_id: "p1" });
    expect(sent.target_company_id).toBeUndefined();
  });

  it("editar una categoría con descuento y quitar la imagen móvil", async () => {
    const { http } = renderWithProviders(<Advertisements />, {
      routes: {
        "GET /admin/dashboard/get-advertisements": [CATEGORY],
        "GET /public/catalogs": [{ id: "k1", name: "Ropa" }, { id: "k2", name: "Hogar" }],
        "PATCH /admin/dashboard/update-advertisement/:id": { ...CATEGORY, minimum_discount: 30 },
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Editar anuncio" }));
    expect(await screen.findByText("Editar anuncio")).toBeTruthy();
    await screen.findByRole("option", { name: "Hogar" });
    fireEvent.change(screen.getByDisplayValue("Ropa"), { target: { value: "k2" } });
    fireEvent.change(screen.getByDisplayValue("20"), { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: "Quitar" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(http.calls("PATCH /admin/dashboard/update-advertisement/:id")).toHaveLength(1));
    expect(formDataToObject(http.calls("PATCH /admin/dashboard/update-advertisement/:id")[0].body)).toMatchObject({
      remove_mobile_image: "true",
      target_type: "CATEGORY",
      target_catalog_id: "k2",
      minimum_discount: "30",
    });
  });

  it("pasar un anuncio segmentado a manual envía clear_target; los nombres de destino se cargan", async () => {
    const { http } = renderWithProviders(<Advertisements />, {
      routes: {
        "GET /admin/dashboard/get-advertisements": [PRODUCT_AD, COMPANY_AD],
        "GET /public/products/:id": { id: "p1", name: "Silla Roble" },
        "GET /admin/dashboard/get-company/:id": { id: "e1", nameCompany: "ACME" },
        "PATCH /admin/dashboard/update-advertisement/:id": { ...PRODUCT_AD, target_type: null },
      },
    });
    await screen.findByText("Producto específico");
    fireEvent.click(screen.getAllByRole("button", { name: "Editar anuncio" })[1]);
    expect(await screen.findByText("ACME")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Cerrar|Cancelar/ }));

    fireEvent.click(screen.getAllByRole("button", { name: "Editar anuncio" })[0]);
    expect(await screen.findByText("Silla Roble")).toBeTruthy();
    selectTargetType("");
    fireEvent.change(screen.getByPlaceholderText("/products"), { target: { value: " /new " } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(http.calls("PATCH /admin/dashboard/update-advertisement/:id")).toHaveLength(1));
    expect(formDataToObject(http.calls("PATCH /admin/dashboard/update-advertisement/:id")[0].body)).toMatchObject({
      button_link: "/new",
      clear_target: "true",
    });
  });

  it("vista previa, cambio de estado y eliminación confirmada", async () => {
    const { http } = renderWithProviders(<Advertisements />, {
      routes: {
        "GET /admin/dashboard/get-advertisements": [MANUAL],
        "PATCH /admin/dashboard/change-status-advertisement/:id": { ...MANUAL, is_active: false },
        "DELETE /admin/dashboard/delete-advertisement/:id": {},
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Ver anuncio" }));
    expect(await screen.findByText("Vista previa del anuncio")).toBeTruthy();
    const closeButtons = screen.getAllByRole("button", { name: /Cerrar/ });
    fireEvent.click(closeButtons[0]);

    fireEvent.click(screen.getByRole("button", { name: "Desactivar anuncio" }));
    expect(await screen.findByRole("button", { name: "Activar anuncio" })).toBeTruthy();
    expect(http.calls("PATCH /admin/dashboard/change-status-advertisement/:id")[0].body).toEqual({ is_active: false });

    fireEvent.click(screen.getByRole("button", { name: "Eliminar anuncio" }));
    const dialog = await screen.findByRole("dialog", { name: "Eliminar anuncio" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Eliminar anuncio" }));
    expect(await screen.findByText("Aún no hay anuncios")).toBeTruthy();
  });
});
