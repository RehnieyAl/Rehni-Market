// Productos de la empresa: producto = identidad; la variante es la unidad vendible (precio,
// stock, descuento, imágenes). Cubre listado, creación, edición, variantes y combinaciones.
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import Products from "./Products";
import VariantModal from "./VariantModal";
import { discountToLocalState, localStateToDiscountInput } from "./discountForm";
import { renderWithProviders } from "@/test/renderApp";
import { apiError, formDataToObject, makeFile, reply } from "@/test/http";

const CATALOGS = [{ id: "k1", name: "Muebles" }, { id: "k2", name: "Hogar" }];
const ATTRIBUTES = {
  product_attributes: [
    { id: "pa1", name: "Marca", input_type: "text", unit: null, position: 0, options: [] },
    { id: "pa2", name: "Material", input_type: "select", unit: null, position: 1, options: [{ id: "m1", value: "Roble", hex_color: null, position: 0 }] },
    { id: "pa3", name: "Peso", input_type: "number", unit: "kg", position: 2, options: [] },
  ],
  variant_attributes: [
    {
      id: "va1",
      name: "Color",
      input_type: "color",
      unit: null,
      position: 0,
      options: [
        { id: "c1", value: "Rojo", hex_color: "#ff0000", position: 0 },
        { id: "c2", value: "Azul", hex_color: "#0000ff", position: 1 },
      ],
    },
    { id: "va2", name: "Talla", input_type: "select", unit: null, position: 1, options: [{ id: "t1", value: "M", hex_color: null, position: 0 }] },
  ],
};

const SILLA = { id: "p1", name: "Silla", description: "De madera", category: "Muebles", price: 120000, stock: 4, image: null, is_active: true, deleted_at: null };
const MESA = { ...SILLA, id: "p2", name: "Mesa", is_active: false, image: "https://cdn.test/mesa.png" };
const VIEJO = { ...SILLA, id: "p3", name: "Viejo", deleted_at: "2026-10-01" };

const DETAIL = {
  id: "p1",
  name: "Silla",
  applies_tax: true,
  has_variants: true,
  descripcion: "De madera",
  is_active: true,
  created_at: "2026-01-01",
  deleted_at: null,
  catalog_id: "k1",
  catalog_name: "Muebles",
  attributes: [{ attribute_id: "pa1", attribute_name: "Marca", value: "Rimax" }],
};

const VARIANT = {
  id: "v1",
  name: "Rojo / M",
  sku: "S-R-M",
  price: "120000",
  stock: 4,
  combo_key: "c1|t1",
  deleted_at: null,
  discount_enable: true,
  discount_value: "10",
  discount_type: "percent",
  discount_starts_at: null,
  discount_ends_at: null,
  effective_price: "108000",
  discount_percentage: 10,
  discount_source: "product",
  product_id: "p1",
  options: [
    { attribute_id: "va1", attribute_name: "Color", option_id: "c1", value: "Rojo", hex_color: "#ff0000" },
    { attribute_id: "va2", attribute_name: "Talla", option_id: "t1", value: "M", hex_color: null },
  ],
  main_image_url: null,
  images: [
    { id: "i1", url: "https://cdn.test/1.png", is_main: true },
    { id: "i2", url: "https://cdn.test/2.png", is_main: false },
  ],
  attribute_values: [],
};

function field(label: string, root: ParentNode = document) {
  const el = Array.from(root.querySelectorAll("label")).find((node) => node.textContent?.trim().startsWith(label));
  if (!el) throw new Error(`Sin campo: ${label}`);
  return el.parentElement!.querySelector("input, select, textarea") as HTMLInputElement;
}

function page(products: unknown[], extra = {}) {
  return { page: 1, limit: 5, total: products.length, total_pages: 1, products, ...extra };
}

const BASE_ROUTES = {
  "GET /company/dashboard/products-summary": { total: 3, active: 1, out_of_stock: 1, hidden: 1 },
  "GET /public/catalogs": CATALOGS,
  "GET /public/catalogs/:id/attributes": ATTRIBUTES,
};

describe("Empresa · Productos (listado)", () => {
  it("muestra resumen, estados y acciones según el producto", async () => {
    renderWithProviders(<Products />, {
      routes: { ...BASE_ROUTES, "GET /company/dashboard/get-my-products": page([SILLA, MESA, VIEJO]) },
    });
    expect(await screen.findByText("Silla")).toBeTruthy();
    expect(screen.getByText("Activo")).toBeTruthy();
    expect(screen.getByText("Inactivo")).toBeTruthy();
    expect(screen.getByText("Eliminado")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Eliminar Viejo" })).toBeNull();
    expect(screen.getByRole("button", { name: "Editar Viejo" })).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("buscar reinicia la página y pagina con el backend", async () => {
    const { http } = renderWithProviders(<Products />, {
      routes: {
        ...BASE_ROUTES,
        "GET /company/dashboard/get-my-products": (req: { params: Record<string, string> }) =>
          req.params.search === "zzz" ? page([]) : page([SILLA], { total_pages: 2, page: Number(req.params.page) }),
      },
    });
    await screen.findByText("Silla");
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await waitFor(() => expect(http.requests.at(-1)?.params).toEqual({ page: "2", limit: "5", search: "" }));
    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));

    fireEvent.change(screen.getByLabelText("Buscar producto"), { target: { value: "zzz" } });
    expect(await screen.findByText("No se encontraron productos")).toBeTruthy();
    expect(http.requests.at(-1)?.params).toEqual({ page: "1", limit: "5", search: "zzz" });
  });

  it("ocultar/mostrar y eliminar con confirmación; los errores avisan", async () => {
    let failStatus = false;
    const { http } = renderWithProviders(<Products />, {
      routes: {
        ...BASE_ROUTES,
        "GET /company/dashboard/get-my-products": page([SILLA]),
        "PATCH /company/dashboard/change-status-my-product/:id": () => (failStatus ? reply(500) : {}),
        "DELETE /company/dashboard/delete-my-product/:id": {},
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Desactivar Silla" }));
    expect(await screen.findByRole("button", { name: "Activar Silla" })).toBeTruthy();
    expect(http.calls("PATCH /company/dashboard/change-status-my-product/:id")[0].body).toEqual({ is_active: false });

    failStatus = true;
    fireEvent.click(screen.getByRole("button", { name: "Activar Silla" }));
    expect(await screen.findByText("No se pudo cambiar el estado del producto.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Eliminar Silla" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Eliminar" }));
    expect(await screen.findByText("Producto eliminado correctamente.")).toBeTruthy();
    await waitFor(() => expect(screen.queryByText("Silla")).toBeNull());
  });

  it("si falla eliminar lo informa", async () => {
    renderWithProviders(<Products />, {
      routes: {
        ...BASE_ROUTES,
        "GET /company/dashboard/get-my-products": page([SILLA]),
        "DELETE /company/dashboard/delete-my-product/:id": reply(500),
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Eliminar Silla" }));
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Eliminar" }));
    expect(await screen.findByText("No se pudo eliminar el producto.")).toBeTruthy();
  });
});

describe("Empresa · Crear producto", () => {
  it("valida campos obligatorios, crea con especificaciones y abre la edición para variantes", async () => {
    const { http } = renderWithProviders(<Products />, {
      routes: {
        ...BASE_ROUTES,
        "GET /company/dashboard/get-my-products": page([]),
        "POST /company/dashboard/create-product": { product_id: "p1", name: "Silla", catalog: "Muebles" },
        "GET /company/dashboard/get-my-product/:id": DETAIL,
        "GET /company/dashboard/products/:id/variants": [],
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Nuevo producto/ }));
    expect(await screen.findByText("Crear nuevo producto")).toBeTruthy();
    expect(screen.getByText("Selecciona una categoría para ver sus atributos.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Crear y agregar variantes" }));
    expect(screen.getByText("Completa nombre, categoría y descripción.")).toBeTruthy();

    fireEvent.change(field("Nombre del producto"), { target: { value: "Silla" } });
    await screen.findByRole("option", { name: "Muebles" });
    fireEvent.change(field("Categoría"), { target: { value: "k1" } });
    fireEvent.change(field("Descripción"), { target: { value: "De madera" } });
    fireEvent.click(screen.getByLabelText(/aplica IVA/));

    fireEvent.change(await waitFor(() => field("Marca")), { target: { value: "Rimax" } });
    fireEvent.change(field("Material"), { target: { value: "Roble" } });
    fireEvent.change(field("Peso"), { target: { value: "3" } });
    fireEvent.change(field("Peso"), { target: { value: "" } });

    fireEvent.click(screen.getByRole("button", { name: "Crear y agregar variantes" }));

    expect(await screen.findByText("Editar producto")).toBeTruthy();
    const sent = formDataToObject(http.calls("POST /company/dashboard/create-product")[0].body);
    expect(sent).toMatchObject({ nameProduct: "Silla", catalogId: "k1", appliesTax: "false", priceProduct: "0", stockProduct: "0" });
    expect(JSON.parse(sent.technicalSpecProduct as string)).toEqual([
      { attributeId: "pa1", value: "Rimax" },
      { attributeId: "pa2", value: "Roble" },
    ]);
    expect(await screen.findByText("Este producto todavía no tiene variantes")).toBeTruthy();
  });

  it("si el backend falla muestra el error y Cancelar cierra", async () => {
    renderWithProviders(<Products />, {
      routes: {
        ...BASE_ROUTES,
        "GET /company/dashboard/get-my-products": page([]),
        "POST /company/dashboard/create-product": reply(500),
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Nuevo producto/ }));
    fireEvent.change(field("Nombre del producto"), { target: { value: "Silla" } });
    await screen.findByRole("option", { name: "Muebles" });
    fireEvent.change(field("Categoría"), { target: { value: "k1" } });
    fireEvent.change(field("Descripción"), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear y agregar variantes" }));
    expect(await screen.findByText("No se pudo crear el producto. Intenta de nuevo.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByText("Crear nuevo producto")).toBeNull();
  });

  it("descarga la plantilla de imagen 1200×900 sin salir del formulario", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderWithProviders(<Products />, {
      routes: { ...BASE_ROUTES, "GET /company/dashboard/get-my-products": page([]) },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Nuevo producto/ }));
    const dialog = await screen.findByRole("dialog", { name: "Crear nuevo producto" });
    expect(within(dialog).getByText(/1200 × 900 px \(4:3\) · JPEG, PNG o WEBP · máximo 5 MB/)).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: "Descargar plantilla" }));

    expect(click).toHaveBeenCalledTimes(1);
    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.download).toBe("plantilla-imagen-producto-1200x900.png");
    expect(link.getAttribute("href")).toContain("product-image-template");
    expect(document.body.contains(link)).toBe(false);
    expect(screen.getByRole("dialog", { name: "Crear nuevo producto" })).toBeTruthy();
    click.mockRestore();
  });
});

describe("Empresa · Editar producto y variantes", () => {
  async function openEdit(routes: Record<string, unknown> = {}) {
    const result = renderWithProviders(<Products />, {
      routes: {
        ...BASE_ROUTES,
        "GET /company/dashboard/get-my-products": page([SILLA]),
        "GET /company/dashboard/get-my-product/:id": DETAIL,
        "GET /company/dashboard/products/:id/variants": [VARIANT],
        ...routes,
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Editar Silla" }));
    await screen.findByText("Editar producto");
    await screen.findByDisplayValue("Silla");
    return result;
  }

  it("envía solo lo cambiado (incluidas especificaciones) y lista variantes con descuento", async () => {
    const { http } = await openEdit({ "PATCH /company/dashboard/update-my-product/:id": {} });
    expect(await screen.findByText("Rojo / M")).toBeTruthy();
    expect(screen.getByText("Color: Rojo")).toBeTruthy();
    expect(screen.getByText("SKU: S-R-M")).toBeTruthy();
    expect(screen.getByText("$108.000")).toBeTruthy();
    expect(screen.getByText(/-10%\s*\(producto\)/)).toBeTruthy();

    fireEvent.change(field("Nombre"), { target: { value: "Silla Pro" } });
    fireEvent.change(await waitFor(() => field("Marca")), { target: { value: "Rimax 2" } });
    fireEvent.click(screen.getByLabelText(/aplica IVA/));
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(screen.queryByText("Editar producto")).toBeNull());
    const sent = formDataToObject(http.calls("PATCH /company/dashboard/update-my-product/:id")[0].body);
    expect(sent).toEqual({
      nameProduct: "Silla Pro",
      appliesTax: "false",
      technicalSpecProduct: JSON.stringify([{ attributeId: "pa1", value: "Rimax 2" }]),
    });
  });

  it("sin cambios no llama al backend; con campos vacíos avisa", async () => {
    const { http } = await openEdit();
    fireEvent.change(field("Descripción"), { target: { value: "  " } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(screen.getByText("Completa nombre, categoría y descripción.")).toBeTruthy();

    fireEvent.change(field("Descripción"), { target: { value: "De madera" } });
    await waitFor(() => field("Marca"));
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(screen.queryByText("Editar producto")).toBeNull());
    expect(http.calls("PATCH /company/dashboard/update-my-product/:id")).toHaveLength(0);
  });

  it("si el detalle no carga lo informa", async () => {
    renderWithProviders(<Products />, {
      routes: {
        ...BASE_ROUTES,
        "GET /company/dashboard/get-my-products": page([SILLA]),
        "GET /company/dashboard/get-my-product/:id": reply(500),
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Editar Silla" }));
    expect(await screen.findByText("No se pudo cargar la información del producto.")).toBeTruthy();
  });

  it("eliminar una variante; un rechazo del backend muestra su motivo; ver eliminadas", async () => {
    let fail = false;
    const { http } = await openEdit({
      "DELETE /company/dashboard/products/:p/variants/:v": () =>
        fail ? apiError(409, "LAST_VARIANT", "No puedes eliminar la última variante activa.") : {},
    });
    fireEvent.click(await screen.findByRole("button", { name: "Eliminar variante Rojo / M" }));
    fireEvent.click(within(await screen.findByRole("dialog", { name: "Eliminar variante" })).getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(http.calls("DELETE /company/dashboard/products/:p/variants/:v")).toHaveLength(1));

    fail = true;
    fireEvent.click(await screen.findByRole("button", { name: "Eliminar variante Rojo / M" }));
    fireEvent.click(within(await screen.findByRole("dialog", { name: "Eliminar variante" })).getByRole("button", { name: "Eliminar" }));
    expect((await screen.findAllByText("No puedes eliminar la última variante activa.")).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByLabelText("Mostrar variantes eliminadas"));
    await waitFor(() =>
      expect(http.calls("GET /company/dashboard/products/:id/variants").some((r) => r.params.include_deleted === "true")).toBe(true),
    );
  });

  it("generar combinaciones crea solo las nuevas con precio y stock base", async () => {
    const combos = [
      { combo_key: "c1|t1", exists: true, options: VARIANT.options },
      { combo_key: "c2|t1", exists: false, options: [{ ...VARIANT.options[0], option_id: "c2", value: "Azul" }, VARIANT.options[1]] },
    ];
    const { http } = await openEdit({
      "POST /company/dashboard/products/:id/variants/generate": combos,
      "POST /company/dashboard/products/:id/variants": { ...VARIANT, id: "v2" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Generar/ }));
    expect(await screen.findByText("Generar combinaciones")).toBeTruthy();
    fireEvent.click(await screen.findByRole("button", { name: "Talla (1)" }));
    fireEvent.click(screen.getByRole("button", { name: "Talla (1)" }));
    fireEvent.click(screen.getByRole("button", { name: "Ver combinaciones" }));

    expect(await screen.findByText("ya existe")).toBeTruthy();
    expect(http.calls("POST /company/dashboard/products/:id/variants/generate")[0].body).toEqual({ attribute_ids: ["va1", "va2"] });

    fireEvent.click(screen.getByRole("button", { name: "Crear seleccionadas" }));
    expect(await screen.findByText("Ingresa un precio y un stock base válidos.")).toBeTruthy();

    fireEvent.change(field("Precio base"), { target: { value: "99000" } });
    fireEvent.change(field("Stock base"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear seleccionadas" }));
    expect(await screen.findByText("1 variante(s) creada(s).")).toBeTruthy();
    expect(http.calls("POST /company/dashboard/products/:id/variants")[0].body).toMatchObject({
      name: "Azul / M",
      price: 99000,
      stock: 2,
      option_ids: ["c2", "t1"],
      discount_enable: false,
    });
  });

  it("generar: sin combinaciones nuevas o con error del backend lo informa", async () => {
    await openEdit({
      "POST /company/dashboard/products/:id/variants/generate": apiError(400, "NO_AXES", "Selecciona ejes válidos."),
    });
    fireEvent.click(screen.getByRole("button", { name: /Generar/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Ver combinaciones" }));
    expect((await screen.findAllByText("Selecciona ejes válidos.")).length).toBeGreaterThan(0);
  });
});

describe("Empresa · Variante (modal)", () => {
  function renderVariant(variantId: string | null, routes: Record<string, unknown> = {}) {
    let succeeded = 0;
    const result = renderWithProviders(
      <VariantModal
        isOpen
        onClose={() => {}}
        onSuccess={() => {
          succeeded += 1;
        }}
        productId="p1"
        catalogId="k1"
        variantId={variantId}
      />,
      { routes: { "GET /public/catalogs/:id/attributes": ATTRIBUTES, ...routes } },
    );
    return { ...result, succeeded: () => succeeded };
  }

  it("ofrece la misma plantilla de imagen junto a Agregar imágenes", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderVariant(null);
    fireEvent.click(await screen.findByRole("button", { name: "Descargar plantilla" }));
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe("plantilla-imagen-producto-1200x900.png");
    expect(screen.getByRole("button", { name: "Agregar imágenes" })).toBeTruthy();
    click.mockRestore();
  });

  it("crear: valida precio/stock, exige cada eje, sugiere nombre y sube imágenes nuevas", async () => {
    const { http } = renderVariant(null, {
      "POST /company/dashboard/products/:id/variants": { ...VARIANT, id: "v9" },
      "POST /company/dashboard/products/:p/variants/:v/images": VARIANT,
    });
    expect(await screen.findByText("Agregar variante")).toBeTruthy();
    fireEvent.change(field("Precio"), { target: { value: "-1" } });
    fireEvent.change(field("Stock"), { target: { value: "1.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear variante" }));
    expect(screen.getByText("Ingresa un precio válido (un número mayor o igual a 0).")).toBeTruthy();
    expect(screen.getByText(/stock válida/)).toBeTruthy();

    fireEvent.change(field("Precio"), { target: { value: "50000" } });
    fireEvent.change(field("Stock"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear variante" }));
    expect(screen.getByText("Asigna un nombre o elige las opciones de la variante.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Azul" }));
    expect(screen.getByText("Se usará: Azul")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Crear variante" }));
    expect(screen.getByText("Selecciona una opción para cada eje de variante.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "M" }));

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile("doc.pdf", "application/pdf")] } });
    expect(await screen.findByText("Imagen de la variante: solo se admite JPEG, PNG, WEBP.")).toBeTruthy();
    const a = makeFile("a.png", "image/png");
    const b = makeFile("b.jpg", "image/jpeg");
    fireEvent.change(input, { target: { files: [a, b] } });
    expect(screen.getAllByText("Principal")).toHaveLength(1);

    fireEvent.click(screen.getByRole("checkbox", { name: /descuento propio/ }));
    fireEvent.change(field("Porcentaje de descuento"), { target: { value: "150" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear variante" }));
    expect(screen.getByText("El porcentaje de descuento no puede superar 100.")).toBeTruthy();
    fireEvent.change(field("Tipo"), { target: { value: "fixed" } });
    fireEvent.change(field("Monto de descuento"), { target: { value: "5000" } });

    fireEvent.change(field("SKU"), { target: { value: " AZ-M " } });
    fireEvent.click(screen.getByRole("button", { name: "Crear variante" }));

    await waitFor(() => expect(http.calls("POST /company/dashboard/products/:p/variants/:v/images")).toHaveLength(1));
    expect(http.calls("POST /company/dashboard/products/:id/variants")[0].body).toEqual({
      name: "Azul / M",
      sku: "AZ-M",
      price: 50000,
      stock: 3,
      option_ids: ["c2", "t1"],
      attribute_values: [],
      discount_enable: true,
      discount_value: 5000,
      discount_type: "fixed",
      discount_starts_at: null,
      discount_ends_at: null,
    });
    expect(formDataToObject(http.calls("POST /company/dashboard/products/:p/variants/:v/images")[0].body)).toEqual({ imagesVariant: [a, b] });
  });

  it("editar: carga la variante, envía solo los cambios y gestiona imágenes existentes", async () => {
    const view = renderVariant("v1", {
      "GET /company/dashboard/products/:p/variants/:v": VARIANT,
      "PATCH /company/dashboard/products/:p/variants/:v": VARIANT,
      "PATCH /company/dashboard/products/:p/variants/:v/images/:i/main": { ...VARIANT, images: [{ ...VARIANT.images[1], is_main: true }] },
      "DELETE /company/dashboard/products/:p/variants/:v/images/:i": { ...VARIANT, images: [] },
      "POST /company/dashboard/products/:p/variants/:v/images": VARIANT,
    });
    const { http } = view;
    expect(await screen.findByDisplayValue("Rojo / M")).toBeTruthy();
    expect((field("Porcentaje de descuento") as HTMLInputElement).value).toBe("10");

    const images = document.querySelectorAll("img");
    fireEvent.click(images[1].parentElement as HTMLElement);
    await waitFor(() => expect(http.calls("PATCH /company/dashboard/products/:p/variants/:v/images/:i/main")).toHaveLength(1));

    const trash = (document.querySelector("img")!.parentElement as HTMLElement).querySelector("button") as HTMLButtonElement;
    fireEvent.click(trash);
    fireEvent.click(within(await screen.findByRole("dialog", { name: "Eliminar imagen" })).getByRole("button", { name: "Eliminar" }));
    expect(await screen.findByText("No has agregado imágenes.")).toBeTruthy();

    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [makeFile("n.webp", "image/webp")] },
    });
    await waitFor(() => expect(http.calls("POST /company/dashboard/products/:p/variants/:v/images")).toHaveLength(1));

    fireEvent.change(field("Stock"), { target: { value: "9" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /descuento propio/ }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(http.calls("PATCH /company/dashboard/products/:p/variants/:v")).toHaveLength(1));
    expect(http.calls("PATCH /company/dashboard/products/:p/variants/:v")[0].body).toEqual({
      stock: 9,
      option_ids: ["c1", "t1"],
      discount_enable: false,
      discount_value: 0,
      discount_type: null,
      discount_starts_at: null,
      discount_ends_at: null,
    });
    expect(view.succeeded()).toBeGreaterThanOrEqual(4);
  });

  it("una variante eliminada es de solo lectura; un error de guardado muestra el motivo", async () => {
    renderVariant("v1", {
      "GET /company/dashboard/products/:p/variants/:v": { ...VARIANT, deleted_at: "2026-10-01" },
    });
    expect(await screen.findByText(/Esta variante fue eliminada/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Guardar cambios" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("si no carga la variante lo informa", async () => {
    renderVariant("v1", { "GET /company/dashboard/products/:p/variants/:v": reply(500) });
    expect(await screen.findByText("No se pudo cargar la información de la variante.")).toBeTruthy();
  });

  it("SKU repetido: el mensaje del backend se muestra en el formulario", async () => {
    renderVariant("v1", {
      "GET /company/dashboard/products/:p/variants/:v": VARIANT,
      "PATCH /company/dashboard/products/:p/variants/:v": apiError(409, "SKU_EXISTS", "El SKU ya está en uso."),
    });
    await screen.findByDisplayValue("Rojo / M");
    fireEvent.change(field("SKU"), { target: { value: "OTRO" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect((await screen.findAllByText("El SKU ya está en uso.")).length).toBeGreaterThan(0);
  });
});

describe("discountForm", () => {
  it("convierte el descuento del backend a estado de formulario y viceversa", () => {
    expect(discountToLocalState(null)).toEqual({ enabled: false, type: "percent", value: "", startsAt: "", endsAt: "" });
    const state = discountToLocalState({
      discount_enable: true,
      discount_value: "15",
      discount_type: "fixed",
      discount_starts_at: "2026-11-01T10:00:00Z",
      discount_ends_at: "fecha-mala",
    });
    expect(state).toMatchObject({ enabled: true, type: "fixed", value: "15", endsAt: "" });
    expect(state.startsAt).toMatch(/^2026-11-01T\d{2}:00$/);
  });

  it("valida valor, tope de porcentaje y orden de fechas", () => {
    const base = { enabled: true, type: "percent" as const, value: "10", startsAt: "", endsAt: "" };
    expect(localStateToDiscountInput({ ...base, value: "0" })).toEqual({ error: "Para activar el descuento, ingresa un valor mayor a 0." });
    expect(localStateToDiscountInput({ ...base, startsAt: "2026-11-10T10:00", endsAt: "2026-11-01T10:00" })).toEqual({
      error: "La fecha de fin debe ser posterior a la de inicio.",
    });
    const ok = localStateToDiscountInput({ ...base, startsAt: "2026-11-01T10:00", endsAt: "2026-11-10T10:00" });
    expect("value" in ok && ok.value.discount_enable).toBe(true);
  });
});
