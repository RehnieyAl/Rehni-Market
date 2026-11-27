// Tienda pública: Home (hero, categorías, novedades, ofertas), navbar con búsqueda y acciones
// de comprador en las tarjetas (carrito, favoritos, login requerido).
import { describe, expect, it } from "vitest";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";

import { EMPTY_CART, renderApp } from "@/test/renderApp";
import { apiError, reply } from "@/test/http";

const CARD = {
  id: "p1",
  name: "Silla Roble",
  image: "https://cdn.test/silla.png",
  company_name: "ACME",
  catalog_id: "k1",
  catalog_name: "Muebles",
  price: "100000",
  discount_enabled: true,
  discount_percentage: 20,
  final_price: "80000",
  applies_tax: true,
  stock: 5,
  average_rating: 4.5,
  review_count: 3,
};
const CARD_2 = { ...CARD, id: "p2", name: "Mesa Pino", image: null, discount_enabled: false, discount_percentage: null, average_rating: null, review_count: 0 };

function page(products: unknown[], extra = {}) {
  return { page: 1, limit: 12, total: products.length, total_pages: 1, products, ...extra };
}

const ADS = [
  { id: "ad1", image_url: "https://cdn.test/a.png", mobile_image_url: "https://cdn.test/am.png", button_link: "/offers", is_active: true, order: 0, created_at: "", target_type: null, target_catalog_id: null, minimum_discount: null },
  { id: "ad2", image_url: "https://cdn.test/b.png", mobile_image_url: null, button_link: "https://externo.test", is_active: true, order: 1, created_at: "", target_type: null, target_catalog_id: null, minimum_discount: null },
  { id: "ad3", image_url: "https://cdn.test/c.png", mobile_image_url: null, button_link: null, is_active: true, order: 2, created_at: "", target_type: null, target_catalog_id: null, minimum_discount: null },
];

const HOME_ROUTES = {
  "GET /public/advertisements": ADS,
  "GET /public/catalogs": [{ id: "k1", name: "Muebles", product_count: 4, image_url: null }],
  "GET /public/products/new": page([CARD_2]),
  "GET /public/products/offers": page([CARD]),
  "GET /public/products/daily": [CARD, CARD_2],
};

describe("Tienda · Home", () => {
  it("visitante: hero navegable, categorías, novedades con badge Nuevo y ofertas con precio tachado", async () => {
    renderApp("/", { routes: HOME_ROUTES });
    expect(await screen.findByRole("link", { name: "Iniciar sesión" })).toBeTruthy();
    expect(await screen.findByText("Explorar categorías")).toBeTruthy();
    expect(await screen.findByText("Muebles")).toBeTruthy();

    expect(await screen.findByText("Mesa Pino")).toBeTruthy();
    expect(screen.getAllByText("Nuevo").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Sin reseñas")).toBeTruthy();
    expect(await screen.findByText("Silla Roble")).toBeTruthy();
    expect(screen.getByText("-20%")).toBeTruthy();
    expect(screen.getByText("$80.000")).toBeTruthy();
    expect(screen.getAllByText("$100.000")).toHaveLength(2);

    const next = await screen.findByRole("button", { name: "Siguiente anuncio" }, { timeout: 2000 });
    const dot = (n: number) => screen.getByRole("button", { name: `Ir al anuncio ${n} de 3` });
    expect(dot(1).getAttribute("aria-current")).toBe("true");
    fireEvent.click(next);
    expect(dot(2).getAttribute("aria-current")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Anuncio anterior" }));
    fireEvent.click(screen.getByRole("button", { name: "Anuncio anterior" }));
    expect(dot(3).getAttribute("aria-current")).toBe("true");
    fireEvent.click(dot(1));

    const slides = document.querySelectorAll("div[aria-hidden]");
    const carousel = slides[0].parentElement as HTMLElement;
    fireEvent.touchStart(carousel, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 100 }] });
    expect(dot(2).getAttribute("aria-current")).toBe("true");
    fireEvent.touchStart(carousel, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 200 }] });
    expect(dot(1).getAttribute("aria-current")).toBe("true");
    fireEvent.mouseEnter(carousel);
    fireEvent.mouseLeave(carousel);

    expect(document.querySelector('a[href="https://externo.test"]')).toBeTruthy();
  });

  it("si fallan categorías y secciones, se informa o se ocultan sin romper la página", async () => {
    renderApp("/", {
      routes: {
        "GET /public/advertisements": reply(500),
        "GET /public/catalogs": reply(500),
        "GET /public/products/new": page([]),
        "GET /public/products/offers": reply(500),
      },
    });
    expect(await screen.findByText("No se pudieron cargar las categorías.")).toBeTruthy();
    expect(await screen.findByText("No hay novedades disponibles en este momento.")).toBeTruthy();
  });

  it("visitante que agrega al carrito abre el login en un modal sin salir del inicio", async () => {
    renderApp("/", { routes: HOME_ROUTES });
    fireEvent.click(await screen.findByRole("button", { name: "Agregar Silla Roble al carrito" }));
    expect(await screen.findByRole("dialog", { name: "Iniciar sesión" })).toBeTruthy();
    expect(window.location.pathname).toBe("/");
  });

  it("comprador: agrega al carrito (contador en el navbar) y alterna favoritos", async () => {
    const cartWithItem = { ...EMPTY_CART, totalItems: 1 };
    const { http } = renderApp("/", {
      role: "user",
      routes: {
        ...HOME_ROUTES,
        "POST /cart/add": cartWithItem,
        "POST /favorites": { message: "ok" },
        "DELETE /favorites/:id": { message: "ok" },
      },
    });
    const add = await screen.findByRole("button", { name: "Agregar Silla Roble al carrito" });
    await screen.findByRole("button", { name: "Mi carrito" });
    fireEvent.click(add);
    expect(await screen.findByText('"Silla Roble" se agregó a tu carrito.')).toBeTruthy();
    expect(http.calls("POST /cart/add")[0].body).toEqual({ productId: "p1", quantity: 1 });
    expect(within(screen.getByRole("button", { name: "Mi carrito" })).getByText("1")).toBeTruthy();

    const fav = screen.getAllByRole("button", { name: "Agregar a favoritos" })[0];
    fireEvent.click(fav);
    await waitFor(() => expect(http.calls("POST /favorites")).toHaveLength(1));
    const remove = await screen.findByRole("button", { name: "Quitar de favoritos" });
    fireEvent.click(remove);
    await waitFor(() => expect(http.calls("DELETE /favorites/:id")).toHaveLength(1));
  });

  it("comprador sin stock suficiente ve el motivo del backend", async () => {
    renderApp("/", {
      role: "user",
      routes: { ...HOME_ROUTES, "POST /cart/add": apiError(400, "INSUFFICIENT_STOCK", "No hay stock suficiente.") },
    });
    await screen.findByRole("button", { name: "Mi carrito" });
    fireEvent.click(await screen.findByRole("button", { name: "Agregar Silla Roble al carrito" }));
    expect((await screen.findAllByText("No hay stock suficiente.")).length).toBeGreaterThan(0);
  });
});

describe("Tienda · Navbar", () => {
  it("la búsqueda sugiere productos, Enter lleva a resultados y elegir abre el detalle", async () => {
    const { http } = renderApp("/", { routes: { ...HOME_ROUTES, "GET /public/products": page([CARD]) } });
    const input = screen.getAllByPlaceholderText("Buscar productos, marcas o categorías…")[0];
    fireEvent.change(input, { target: { value: "silla" } });
    const dropdown = await screen.findByRole("button", { name: /Silla Roble.*ACME/ }, { timeout: 2000 });
    expect(http.calls("GET /public/products/daily")[0].params).toEqual({ limit: "24" });

    fireEvent.change(input, { target: { value: "zzz" } });
    expect(await screen.findByText("No se encontraron productos")).toBeTruthy();
    fireEvent.change(input, { target: { value: "" } });
    expect(dropdown.isConnected).toBe(false);

    fireEvent.change(input, { target: { value: "silla" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(window.location.pathname + window.location.search).toBe("/products?search=silla"));
    expect(await screen.findByText('Resultados para "silla"')).toBeTruthy();
  });

  it("menú móvil abre, navega y se cierra con Escape", async () => {
    renderApp("/", { routes: HOME_ROUTES });
    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    const menu = document.getElementById("mobile-menu") as HTMLElement;
    expect(within(menu).getByRole("link", { name: "Registrarse" })).toBeTruthy();
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(document.getElementById("mobile-menu")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    fireEvent.click(within(document.getElementById("mobile-menu") as HTMLElement).getByRole("link", { name: "Ofertas" }));
    expect(await screen.findByText("Productos con descuento vigente en alguna de sus variantes disponibles.")).toBeTruthy();
  });

  it("menú de perfil por rol y cerrar sesión limpia los tokens", async () => {
    renderApp("/", { role: "company", routes: HOME_ROUTES });
    const trigger = await screen.findByRole("button", { name: /Cuenta company/ });
    fireEvent.click(trigger);
    expect(screen.getByRole("link", { name: /Finanzas/ }).getAttribute("href")).toBe("/company/dashboard?tab=finance");
    expect(screen.getByRole("link", { name: /Configuración de cuenta/ }).getAttribute("href")).toBe("/company/dashboard?tab=profile");
    fireEvent.click(screen.getByRole("button", { name: /Cerrar sesión/ }));
    await waitFor(() => expect(localStorage.getItem("accessToken")).toBeNull());
    expect(await screen.findByRole("link", { name: "Iniciar sesión" })).toBeTruthy();
  });

  it("el propietario ve Liquidaciones en su menú", async () => {
    renderApp("/", { role: "owner", routes: HOME_ROUTES });
    fireEvent.click(await screen.findByRole("button", { name: /Cuenta owner/ }));
    expect(screen.getByRole("link", { name: /Liquidaciones/ }).getAttribute("href")).toBe("/admin/dashboard?tab=payouts");
    expect(screen.queryByRole("button", { name: "Agregar Silla Roble al carrito" })).toBeNull();
  });
});

describe("Tienda · Catálogo, ofertas y novedades", () => {
  it("filtros del catálogo se reflejan en la URL y en la consulta al backend", async () => {
    const { http } = renderApp("/products", {
      routes: {
        "GET /public/catalogs": [{ id: "k1", name: "Muebles", product_count: 4, image_url: null }],
        "GET /public/products": page([CARD, CARD_2], { total: 30, total_pages: 3 }),
      },
    });
    expect(await screen.findByText("30 productos encontrados")).toBeTruthy();
    expect(screen.getByText("Mostrando 1–12 de 30 productos")).toBeTruthy();
    await screen.findAllByRole("option", { name: "Muebles (4)" });

    const [catalogSelect] = screen.getAllByLabelText("Categoría");
    fireEvent.change(catalogSelect, { target: { value: "k1" } });
    expect(await screen.findByRole("heading", { name: "Muebles" })).toBeTruthy();
    await waitFor(() => expect(http.calls("GET /public/products").at(-1)?.params.catalog_id).toBe("k1"));

    fireEvent.change(screen.getAllByPlaceholderText("Ej. Muebles…")[0], { target: { value: "silla" } });
    await waitFor(() => expect(window.location.search).toContain("search=silla"), { timeout: 2000 });
    fireEvent.click(screen.getAllByRole("button", { name: "Limpiar búsqueda" })[0]);

    fireEvent.click(screen.getAllByLabelText("Solo con descuento")[0]);
    fireEvent.click(screen.getAllByLabelText("Solo disponibles")[0]);
    fireEvent.change(screen.getAllByLabelText("Ordenar por")[0], { target: { value: "price_asc" } });
    fireEvent.change(screen.getAllByPlaceholderText("Mínimo")[0], { target: { value: "1000" } });
    fireEvent.change(screen.getAllByPlaceholderText("Máximo")[0], { target: { value: "90000" } });
    await waitFor(
      () =>
        expect(http.calls("GET /public/products").at(-1)?.params).toMatchObject({
          catalog_id: "k1",
          discount: "true",
          in_stock: "true",
          sort: "price_asc",
          min_price: "1000",
          max_price: "90000",
        }),
      { timeout: 2000 },
    );

    fireEvent.click(screen.getByRole("button", { name: "Página 3" }));
    await waitFor(() => expect(http.calls("GET /public/products").at(-1)?.params.page).toBe("3"));

    fireEvent.click(screen.getAllByRole("button", { name: /Limpiar/ })[0]);
    await waitFor(() => expect(window.location.search).toBe(""));
  });

  it("modal de filtros en móvil y error al cargar", async () => {
    renderApp("/products?minDiscount=10&maxStock=5&days=7", {
      routes: { "GET /public/catalogs": [], "GET /public/products": reply(500) },
    });
    expect(await screen.findByText("No se pudieron cargar los productos")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^Filtros/ }));
    const dialog = await screen.findByRole("dialog", { name: "Filtros" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Limpiar" }));
    await waitFor(() => expect(window.location.search).toBe(""));
  });

  it("ofertas: pide solo descuentos vigentes con stock, ordena por descuento y pagina", async () => {
    const { http } = renderApp("/offers", {
      routes: {
        "GET /public/catalogs": [{ id: "k1", name: "Muebles", product_count: 4, image_url: null }],
        "GET /public/products": page([CARD], { total: 24, total_pages: 2 }),
      },
    });
    expect(await screen.findByRole("heading", { name: "Ofertas" })).toBeTruthy();
    expect(await screen.findByText("Silla Roble")).toBeTruthy();
    const storeNav = screen.getAllByRole("navigation", { name: "Tienda" })[0];
    expect(within(storeNav).getByRole("link", { name: "Ofertas" }).getAttribute("aria-current")).toBe("page");
    expect(within(storeNav).getByRole("link", { name: "Inicio" }).getAttribute("aria-current")).toBeNull();
    expect(screen.getByText("-20%")).toBeTruthy();
    expect(screen.getByText("Mostrando 1–12 de 24 ofertas")).toBeTruthy();
    expect(http.calls("GET /public/products")[0].params).toEqual({
      discount: "true",
      in_stock: "true",
      sort: "discount",
      page: "1",
      limit: "12",
    });

    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    await waitFor(() => expect(http.calls("GET /public/products").at(-1)?.params.page).toBe("2"));
    fireEvent.click(await screen.findByRole("button", { name: "Página anterior" }));
    await waitFor(() => expect(window.location.search).toBe(""));
  });

  it("ofertas: búsqueda, categoría, orden y tamaño de página viajan a la API y a la URL", async () => {
    const { http } = renderApp("/offers", {
      routes: {
        "GET /public/catalogs": [{ id: "k1", name: "Muebles", product_count: 4, image_url: null }],
        "GET /public/products": (req: { params: Record<string, string> }) =>
          req.params.search === "zzz" ? page([]) : page([CARD]),
      },
    });
    await screen.findByText("Silla Roble");
    const last = () => http.calls("GET /public/products").at(-1)?.params ?? {};

    fireEvent.change(await screen.findByLabelText("Filtrar ofertas por categoría"), { target: { value: "k1" } });
    await waitFor(() => expect(last().catalog_id).toBe("k1"));
    expect(window.location.search).toContain("catalog=k1");

    fireEvent.change(screen.getByLabelText("Ordenar ofertas"), { target: { value: "price_asc" } });
    await waitFor(() => expect(last().sort).toBe("price_asc"));
    fireEvent.change(screen.getByLabelText("Ordenar ofertas"), { target: { value: "recent" } });
    await waitFor(() => expect(last().sort).toBeUndefined());
    expect(last().discount).toBe("true");

    fireEvent.change(screen.getByLabelText("Ofertas por página"), { target: { value: "24" } });
    await waitFor(() => expect(last().limit).toBe("24"));

    fireEvent.change(screen.getByLabelText("Buscar en ofertas"), { target: { value: "zzz" } });
    await waitFor(() => expect(last().search).toBe("zzz"), { timeout: 2000 });
    expect(await screen.findByText("No hay ofertas que coincidan con tu búsqueda.")).toBeTruthy();
    expect(screen.getByRole("option", { name: "Más relevantes" })).toBeTruthy();
  });

  it("tarjeta: un solo enlace al detalle, acciones fuera del enlace y aviso si la foto no carga", async () => {
    renderApp("/offers", { routes: { "GET /public/catalogs": [], "GET /public/products": page([CARD, CARD_2]) } });
    const link = await screen.findByRole("link", { name: "Silla Roble" });
    const article = link.closest("article") as HTMLElement;
    expect(link.getAttribute("href")).toBe("/products/p1");
    expect(link.querySelector("button")).toBeNull();
    expect(within(article).getByRole("button", { name: "Agregar Silla Roble al carrito" })).toBeTruthy();
    expect(within(article).getByText("ACME")).toBeTruthy();
    expect(within(article).getByText("4.5")).toBeTruthy();

    const img = article.querySelector("img") as HTMLImageElement;
    expect(img.getAttribute("loading")).toBe("lazy");
    fireEvent.error(img);
    expect(within(article).getByText("Imagen no disponible")).toBeTruthy();

    const noImage = screen.getByRole("link", { name: "Mesa Pino" }).closest("article") as HTMLElement;
    expect(within(noImage).getByText("Imagen no disponible")).toBeTruthy();
    expect(within(noImage).queryByText(/^-\d+%$/)).toBeNull();
  });

  it("ofertas: error con reintento y estado vacío sin filtros", async () => {
    let fail = true;
    renderApp("/offers", {
      routes: {
        "GET /public/catalogs": reply(500),
        "GET /public/products": () => (fail ? reply(500) : page([])),
      },
    });
    expect(await screen.findByText("No se pudieron cargar los productos")).toBeTruthy();
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(await screen.findByText("No hay ofertas disponibles en este momento.")).toBeTruthy();
  });

  it("ofertas: empresa y administración ven las tarjetas sin acciones de compra", async () => {
    renderApp("/offers", {
      role: "company",
      routes: { "GET /public/catalogs": [], "GET /public/products": page([CARD]) },
    });
    expect(await screen.findByText("Silla Roble")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Agregar Silla Roble al carrito" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Agregar a favoritos" })).toBeNull();
    expect(screen.getByRole("link", { name: "Silla Roble" }).getAttribute("href")).toBe("/products/p1");
  });

  it("novedades: error con reintento", async () => {
    let fail = true;
    renderApp("/new", {
      routes: { "GET /public/products/new": () => (fail ? reply(500) : page([])) },
    });
    expect(await screen.findByText("No se pudieron cargar los productos")).toBeTruthy();
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(await screen.findByText(/No hay/)).toBeTruthy();
  });
});
