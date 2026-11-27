// Detalle público de producto: la variante es la unidad vendible (precio/stock/imágenes por
// combinación), carrito, IVA, reseñas, relacionados y reporte.
import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import { EMPTY_CART, renderApp } from "@/test/renderApp";
import { apiError, reply } from "@/test/http";

const variant = (id: string, color: string, hex: string, talla: string, stock: number, extra = {}) => ({
  id,
  name: `${color} / ${talla}`,
  sku: `SKU-${id}`,
  price: "100000",
  discount_enabled: false,
  discount_percentage: null,
  final_price: "100000",
  applies_tax: true,
  tax_amount: "19000",
  final_price_with_tax: "119000",
  stock,
  options: [
    { attribute: "Color", value: color, hex_color: hex },
    { attribute: "Talla", value: talla, hex_color: null },
  ],
  images: [],
  ...extra,
});

const PRODUCT = {
  id: "p1",
  name: "Camiseta",
  descripcion: "Algodón 100%",
  catalog_name: "Ropa",
  catalog_id: "k1",
  company_name: "ACME",
  company_id: "e1",
  company_logo: null,
  company_is_verified: true,
  is_active: true,
  price: "90000",
  discount_enabled: true,
  discount_percentage: 10,
  final_price: "81000",
  applies_tax: true,
  tax_rate: "0.19",
  tax_amount: "15390",
  price_with_tax: "96390",
  stock: 7,
  average_rating: 4,
  review_count: 4,
  rating_distribution: { five: 2, four: 1, three: 1, two: 0, one: 0 },
  images: [{ id: "img0", url: "https://cdn.test/base.png", is_main: true }],
  attributes: [{ attribute: "Marca", value: "Rimax" }],
  variants: [
    variant("v1", "Rojo", "#ff0000", "M", 3, {
      sku: "CAM-R-M",
      discount_enabled: true,
      discount_percentage: 20,
      final_price: "80000",
      images: [
        { id: "i1", url: "https://cdn.test/rojo1.png", is_main: false },
        { id: "i2", url: "https://cdn.test/rojo2.png", is_main: true },
      ],
    }),
    variant("v2", "Rojo", "#ff0000", "L", 0),
    variant("v3", "Azul", "#0000ff", "M", 2),
  ],
};

const REVIEW = (id: string, name: string) => ({
  id,
  productId: "p1",
  rating: 4,
  comment: `Opinión de ${name}`,
  createdAt: "2026-11-01T00:00:00Z",
  updatedAt: null,
  buyerName: name,
  buyerPhoto: null,
});

const RELATED = {
  page: 1,
  limit: 9,
  total: 4,
  total_pages: 1,
  products: ["p1", "r1", "r2", "r3"].map((id) => ({
    id,
    name: `Relacionado ${id}`,
    image: null,
    company_name: "ACME",
    catalog_id: "k1",
    catalog_name: "Ropa",
    price: "1000",
    discount_enabled: false,
    discount_percentage: null,
    final_price: "1000",
    applies_tax: false,
    stock: 1,
    average_rating: null,
    review_count: 0,
  })),
};

// Imagen principal = la de la miniatura activa (todas las diapositivas tienen texto alternativo).
function currentImage() {
  const active = document.querySelector('button[aria-current="true"][aria-label^="Ver imagen"]');
  return active?.querySelector("img")?.getAttribute("src");
}

function enabledStar(name: string) {
  return screen.getAllByRole("button", { name }).find((b) => !(b as HTMLButtonElement).disabled) as HTMLElement;
}

function routes(extra: Record<string, unknown> = {}) {
  return {
    "GET /public/products/:id": PRODUCT,
    "GET /public/products/:id/reviews": {
      items: [REVIEW("a", "Ana"), REVIEW("b", "Beto"), REVIEW("c", "Caro"), REVIEW("d", "Dani")],
      total: 4,
      page: 1,
      limit: 10,
      total_pages: 1,
    },
    "GET /public/products": RELATED,
    "GET /public/company/:id/rating": { company_id: "e1", average_rating: null, total_reviews: 0 },
    ...extra,
  };
}

describe("Producto · detalle y variantes", () => {
  it("visitante: muestra precio 'Desde', IVA, especificaciones, reseñas y relacionados", async () => {
    renderApp("/products/p1", { routes: routes() });
    expect(await screen.findByRole("heading", { name: "Camiseta" })).toBeTruthy();
    expect(screen.getByText("Desde")).toBeTruthy();
    expect(screen.getByText("IVA (19%):")).toBeTruthy();
    expect(screen.getByText("$96.390")).toBeTruthy();
    expect(screen.getByText("Selecciona una opción para ver el stock disponible.")).toBeTruthy();
    expect(screen.getByText("Selecciona todas las opciones antes de continuar.")).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Especificaciones" }));
    expect(screen.getByText("Rimax")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Opiniones (4)" }).getAttribute("href")).toBe("#opiniones");
    fireEvent.click(screen.getByRole("tab", { name: "Descripción" }));
    expect(screen.getByText("Algodón 100%")).toBeTruthy();

    expect(await screen.findByText("Opinión de Ana")).toBeTruthy();
    expect(screen.queryByText("Opinión de Dani")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Ver todas las opiniones/ }));
    expect(await screen.findByText("Opinión de Dani")).toBeTruthy();

    expect(await screen.findByText("Productos relacionados")).toBeTruthy();
    expect(screen.queryByText("Relacionado p1")).toBeNull();
    const related = screen.getByRole("region", { name: "Productos relacionados" });
    expect(within(related).getAllByRole("listitem")).toHaveLength(3);
    expect(within(related).queryByRole("button", { name: "Siguiente" })).toBeNull();
  });

  it("elegir color y talla resuelve la variante: precio, SKU, stock, imágenes y combinaciones agotadas", async () => {
    renderApp("/products/p1", { routes: routes() });
    await screen.findByRole("heading", { name: "Camiseta" });

    fireEvent.click(screen.getByTitle("Rojo"));
    expect(screen.getByText("Color: Rojo")).toBeTruthy();
    expect(currentImage()).toBe("https://cdn.test/rojo2.png");
    const tallaL = screen.getByRole("button", { name: "L" }) as HTMLButtonElement;
    expect(tallaL.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "M" }));

    expect(screen.getByText("CAM-R-M")).toBeTruthy();
    expect(screen.getByText("3 unidades disponibles")).toBeTruthy();
    expect(screen.getByText("$80.000")).toBeTruthy();
    expect(screen.queryByText("Desde")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Ver imagen 1 de Camiseta" }));
    expect(currentImage()).toBe("https://cdn.test/rojo1.png");

    const plus = screen.getByRole("button", { name: "Aumentar cantidad" });
    fireEvent.click(plus);
    fireEvent.click(plus);
    fireEvent.click(plus);
    expect((plus as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Disminuir cantidad" }));

    fireEvent.click(screen.getByTitle("Azul"));
    expect(screen.getByText("Talla")).toBeTruthy();
    expect(currentImage()).toBe("https://cdn.test/rojo2.png");
  });

  it("visitante que intenta reportar abre el login en un modal y sigue en el producto", async () => {
    renderApp("/products/p1?variant=blue", { routes: routes() });
    await screen.findByRole("heading", { name: "Camiseta" });
    fireEvent.click(screen.getByTitle("Reportar producto"));
    expect(await screen.findByRole("dialog", { name: "Iniciar sesión" })).toBeTruthy();
    expect(window.location.pathname + window.location.search).toBe("/products/p1?variant=blue");
  });

  it("comprador: agrega la variante elegida y 'Comprar ahora' lleva al carrito", async () => {
    const { http } = renderApp("/products/p1", {
      role: "user",
      routes: routes({
        "POST /cart/add": { ...EMPTY_CART, totalItems: 2 },
        "GET /reviews/eligibility/:id": { can_review: false, already_reviewed: false, my_review_id: null },
      }),
    });
    await screen.findByRole("heading", { name: "Camiseta" });
    await screen.findByRole("button", { name: "Mi carrito" });
    expect(await screen.findByText("Podrás reseñar este producto una vez que te sea entregado.")).toBeTruthy();

    fireEvent.click(screen.getByTitle("Azul"));
    fireEvent.click(screen.getByRole("button", { name: "M" }));
    fireEvent.click(screen.getByRole("button", { name: "Aumentar cantidad" }));
    fireEvent.click(screen.getByRole("button", { name: /Agregar al carrito/ }));
    await waitFor(() => expect(http.calls("POST /cart/add")).toHaveLength(1));
    expect(http.calls("POST /cart/add")[0].body).toEqual({ productId: "p1", quantity: 2, variantId: "v3" });

    fireEvent.click(screen.getByRole("button", { name: "Comprar ahora" }));
    await waitFor(() => expect(window.location.pathname).toBe("/cart"));
  });

  it("stock agotado en carrito muestra el mensaje de cantidad máxima", async () => {
    renderApp("/products/p1", {
      role: "user",
      routes: routes({
        "POST /cart/add": reply(400, { detail: { code: "INSUFFICIENT_STOCK" } }),
        "GET /reviews/eligibility/:id": { can_review: false, already_reviewed: false, my_review_id: null },
      }),
    });
    await screen.findByRole("heading", { name: "Camiseta" });
    await screen.findByRole("button", { name: "Mi carrito" });
    fireEvent.click(screen.getByTitle("Azul"));
    fireEvent.click(screen.getByRole("button", { name: "M" }));
    fireEvent.click(screen.getByRole("button", { name: /Agregar al carrito/ }));
    expect(await screen.findByText("Ya tienes la cantidad máxima disponible en tu carrito.")).toBeTruthy();
  });

  it("empresa o admin no pueden comprar", async () => {
    renderApp("/products/p1", { role: "company", routes: routes() });
    expect(await screen.findByText("Las cuentas de empresa o administración no pueden realizar compras.")).toBeTruthy();
    expect(screen.queryByTitle("Reportar producto")).toBeNull();
  });

  it("producto sin variantes ni IVA y sin especificaciones; no encontrado", async () => {
    renderApp("/products/p1", {
      routes: routes({
        "GET /public/products/:id": { ...PRODUCT, variants: [], attributes: [], applies_tax: false, stock: 0 },
        "GET /public/products/:id/reviews": { items: [], total: 0, page: 1, limit: 10, total_pages: 1 },
        "GET /public/products": { ...RELATED, products: [] },
      }),
    });
    expect(await screen.findByText("No aplica")).toBeTruthy();
    expect(screen.getAllByText("Sin stock").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("tab", { name: "Especificaciones" }));
    expect(screen.getByText("Este producto no tiene especificaciones registradas.")).toBeTruthy();
    expect(await screen.findByText("Este producto todavía no tiene reseñas")).toBeTruthy();
  });

  it("un producto inexistente muestra el estado vacío", async () => {
    renderApp("/products/zz", { routes: { "GET /public/products/:id": reply(404) } });
    expect(await screen.findByText("No encontramos este producto")).toBeTruthy();
  });
});

describe("Producto · reseñas y reporte (comprador)", () => {
  it("comprador elegible: valida estrellas y publica la reseña", async () => {
    let eligibility = { can_review: true, already_reviewed: false, my_review_id: null as string | null };
    const { http } = renderApp("/products/p1", {
      role: "user",
      routes: routes({
        "GET /reviews/eligibility/:id": () => eligibility,
        "POST /reviews": () => {
          eligibility = { can_review: false, already_reviewed: true, my_review_id: "rv1" };
          return REVIEW("rv1", "Yo");
        },
        "DELETE /reviews/:id": {},
      }),
    });
    fireEvent.click(await screen.findByRole("button", { name: "Enviar reseña" }));
    expect(await screen.findByText("Selecciona una calificación antes de enviar tu reseña.")).toBeTruthy();

    fireEvent.click(enabledStar("5 estrellas"));
    fireEvent.change(screen.getByPlaceholderText(/Cuéntale a otros compradores/), { target: { value: "  Excelente  " } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar reseña" }));
    expect(await screen.findByText("Reseña publicada")).toBeTruthy();
    expect(http.calls("POST /reviews")[0].body).toEqual({ productId: "p1", rating: 5, comment: "Excelente" });

    fireEvent.click(await screen.findByRole("button", { name: "Eliminar mi reseña" }));
    fireEvent.click(within(await screen.findByRole("dialog", { name: "Eliminar reseña" })).getByRole("button", { name: "Eliminar" }));
    expect(await screen.findByText("Tu reseña fue eliminada.")).toBeTruthy();
    expect(http.calls("DELETE /reviews/:id")[0].url).toBe("/reviews/rv1");
  });

  it("un error al reseñar muestra el mensaje del backend", async () => {
    renderApp("/products/p1", {
      role: "user",
      routes: routes({
        "GET /reviews/eligibility/:id": { can_review: true, already_reviewed: false, my_review_id: null },
        "POST /reviews": apiError(409, "REVIEW_EXISTS", "Ya existe una reseña tuya."),
      }),
    });
    await screen.findByRole("button", { name: "Enviar reseña" });
    fireEvent.click(enabledStar("3 estrellas"));
    fireEvent.click(screen.getByRole("button", { name: "Enviar reseña" }));
    expect((await screen.findAllByText("Ya existe una reseña tuya.")).length).toBeGreaterThan(0);
  });

  it("reportar abre el modal de reporte para el producto", async () => {
    renderApp("/products/p1", {
      role: "user",
      routes: routes({ "GET /reviews/eligibility/:id": { can_review: false, already_reviewed: false, my_review_id: null } }),
    });
    await screen.findByRole("heading", { name: "Camiseta" });
    await screen.findByRole("button", { name: "Mi carrito" });
    fireEvent.click(screen.getByTitle("Reportar producto"));
    expect(await screen.findByRole("heading", { name: "Reportar producto" })).toBeTruthy();
    expect(screen.getByText(/Un administrador revisará tu reporte/)).toBeTruthy();
  });
});
