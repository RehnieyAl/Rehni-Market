// Perfil público de empresa y página de categorías: contenedor único "Sobre" con contacto autorizado y Reportar,
// productos paginados, reputación en la cabecera, seguimiento de la tienda y filtros/orden de categorías.
import { describe, expect, it } from "vitest";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";

import { renderApp } from "@/test/renderApp";
import { apiError, reply } from "@/test/http";

const COMPANY = {
  id: "e1",
  name: "ACME",
  description: "Muebles hechos a mano",
  logo_url: null,
  banner_url: null,
  is_verified: true,
  created_at: "2024-03-01T00:00:00Z",
  total_products: 3,
  contact_email: null,
  contact_phone: null,
};

const card = (id: string, catalog: string) => ({
  id,
  name: `Producto ${id}`,
  image: null,
  company_name: "ACME",
  catalog_id: catalog,
  catalog_name: catalog,
  price: "1000",
  discount_enabled: false,
  discount_percentage: null,
  final_price: "1000",
  applies_tax: false,
  stock: 1,
  average_rating: null,
  review_count: 0,
});

const FOLLOWERS = (count: number) => ({ company_id: "e1", followers_count: count });
const STATUS = (count: number, following: boolean) => ({ ...FOLLOWERS(count), is_following: following });

function products(items: unknown[], extra = {}) {
  return { page: 1, limit: 12, total: items.length, total_pages: 1, products: items, ...extra };
}

describe("Perfil público de empresa", () => {
  it("muestra identidad verificada, calificación en la cabecera y productos directamente, sin secciones", async () => {
    renderApp("/company/e1", {
      routes: {
        "GET /public/company/:id": COMPANY,
        "GET /public/company/:id/rating": { average_rating: 4.25, total_reviews: 1 },
        "GET /public/company/:id/followers": FOLLOWERS(7),
        "GET /public/company/:id/products": products([card("a", "Sillas"), card("b", "Mesas"), card("c", "Sillas")]),
      },
    });
    expect(await screen.findByRole("heading", { name: "ACME" })).toBeTruthy();
    expect(screen.getAllByText("Empresa verificada").length).toBeGreaterThan(0);
    expect(await screen.findByText("Producto a")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Productos publicados/ })).toBeTruthy();
    const hero = screen.getByRole("region", { name: "ACME" });
    expect(await within(hero).findByText("4.3")).toBeTruthy();
    expect(within(hero).getByText("(1 reseña)", { exact: false })).toBeTruthy();

    expect(screen.queryByRole("navigation", { name: "Secciones de la tienda" })).toBeNull();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("link", { name: "Información" })).toBeNull();
    expect(screen.queryByText("Categorías de la tienda")).toBeNull();
  });

  it("sin descripción ni calificaciones; productos con error y reintento; paginación", async () => {
    let fail = true;
    const { http } = renderApp("/company/e1", {
      routes: {
        "GET /public/company/:id": { ...COMPANY, description: null, is_verified: false, total_products: 1 },
        "GET /public/company/:id/rating": reply(500),
        "GET /public/company/:id/products": () => (fail ? reply(500) : products([card("a", "Sillas")], { total: 13, total_pages: 2 })),
      },
    });
    expect(await screen.findByText("No se pudieron cargar los productos")).toBeTruthy();
    expect(screen.getByText("Esta tienda todavía no agregó una descripción.")).toBeTruthy();
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(await screen.findByText("Producto a")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Página 2" }));
    await waitFor(() => expect(http.calls("GET /public/company/:id/products").at(-1)?.params.page).toBe("2"));

  });

  it("visitante que reporta abre el login en un modal sin salir de la tienda", async () => {
    renderApp("/company/e1", {
      routes: {
        "GET /public/company/:id": COMPANY,
        "GET /public/company/:id/rating": { average_rating: null, total_reviews: 0 },
        "GET /public/company/:id/products": products([]),
      },
    });
    expect(await screen.findByText("Esta empresa todavía no tiene productos publicados.")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: /Reportar empresa/ })[0]);
    expect(await screen.findByRole("dialog", { name: "Iniciar sesión" })).toBeTruthy();
    expect(window.location.pathname).toBe("/company/e1");
  });

  it("comprador: el botón de reporte abre el formulario", async () => {
    renderApp("/company/e1", {
      role: "user",
      routes: {
        "GET /public/company/:id": COMPANY,
        "GET /public/company/:id/rating": { average_rating: null, total_reviews: 0 },
        "GET /public/company/:id/products": products([]),
      },
    });
    await screen.findByRole("button", { name: "Mi carrito" });
    fireEvent.click((await screen.findAllByRole("button", { name: /Reportar empresa/ }))[0]);
    expect(await screen.findByRole("heading", { name: "Reportar empresa" })).toBeTruthy();
  });

  it("empresa inexistente muestra el estado vacío", async () => {
    renderApp("/company/zz", {
      routes: { "GET /public/company/:id": reply(404), "GET /public/company/:id/products": products([]) },
    });
    expect(await screen.findByText("No encontramos esta empresa")).toBeTruthy();
  });
});

describe("Perfil público · Seguir tienda", () => {
  const BASE = {
    "GET /public/company/:id": COMPANY,
    "GET /public/company/:id/rating": { average_rating: 4.25, total_reviews: 2 },
    "GET /public/company/:id/products": products([card("a", "Sillas")]),
  };

  it("visitante: ve el contador real y al seguir abre el login sin salir de la tienda", async () => {
    const { http } = renderApp("/company/e1", { routes: { ...BASE, "GET /public/company/:id/followers": FOLLOWERS(1) } });
    expect(await screen.findByText("1 seguidor")).toBeTruthy();
    expect(http.calls("GET /company-follows/:id")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Seguir tienda" }));
    expect(await screen.findByRole("dialog", { name: "Iniciar sesión" })).toBeTruthy();
    expect(window.location.pathname).toBe("/company/e1");
    expect(http.calls("POST /company-follows/:id")).toHaveLength(0);
  });

  it("comprador: el estado sale de la API; seguir y dejar de seguir actualizan el contador", async () => {
    const { http } = renderApp("/company/e1", {
      role: "user",
      routes: {
        ...BASE,
        "GET /company-follows/:id": STATUS(4, false),
        "POST /company-follows/:id": STATUS(5, true),
        "DELETE /company-follows/:id": STATUS(4, false),
      },
    });
    expect(await screen.findByText("4 seguidores")).toBeTruthy();
    expect(http.calls("GET /public/company/:id/followers")).toHaveLength(0);

    fireEvent.click(await screen.findByRole("button", { name: "Seguir tienda" }));
    expect(await screen.findByRole("button", { name: /Siguiendo/ })).toBeTruthy();
    expect(screen.getByText("5 seguidores")).toBeTruthy();
    expect(http.calls("POST /company-follows/:id")[0].url).toBe("/company-follows/e1");

    fireEvent.click(screen.getByRole("button", { name: /Siguiendo/ }));
    expect(await screen.findByRole("button", { name: "Seguir tienda" })).toBeTruthy();
    expect(screen.getByText("4 seguidores")).toBeTruthy();
    expect(http.calls("DELETE /company-follows/:id")).toHaveLength(1);
  });

  it("comprador que ya sigue la tienda la ve como Siguiendo al entrar", async () => {
    renderApp("/company/e1", { role: "user", routes: { ...BASE, "GET /company-follows/:id": STATUS(9, true) } });
    expect(await screen.findByRole("button", { name: /Siguiendo/ })).toBeTruthy();
    expect(screen.getByText("9 seguidores")).toBeTruthy();
  });

  it("doble clic mientras la petición está en curso envía una sola solicitud y muestra la carga", async () => {
    let release: (value: unknown) => void = () => {};
    const { http } = renderApp("/company/e1", {
      role: "user",
      routes: {
        ...BASE,
        "GET /company-follows/:id": STATUS(0, false),
        "POST /company-follows/:id": () => new Promise((resolve) => (release = resolve)),
      },
    });
    const button = await screen.findByRole("button", { name: "Seguir tienda" });
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(button.getAttribute("aria-busy")).toBe("true"));
    expect(http.calls("POST /company-follows/:id")).toHaveLength(1);

    await act(async () => release(STATUS(1, true)));
    expect(await screen.findByText("1 seguidor")).toBeTruthy();
  });

  it("si la API rechaza la operación, conserva el estado anterior y muestra el mensaje", async () => {
    renderApp("/company/e1", {
      role: "user",
      routes: {
        ...BASE,
        "GET /company-follows/:id": STATUS(3, false),
        "POST /company-follows/:id": apiError(404, "COMPANY_NOT_FOUND", "Empresa no encontrada."),
      },
    });
    expect(await screen.findByText("3 seguidores")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Seguir tienda" }));
    expect((await screen.findAllByText("Empresa no encontrada.")).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Seguir tienda" })).toBeTruthy();
    expect(screen.getByText("3 seguidores")).toBeTruthy();
  });

  it.each(["company", "admin", "owner"] as const)("rol %s: ve el contador pero no puede seguir", async (role) => {
    const { http } = renderApp("/company/e1", {
      role,
      routes: { ...BASE, "GET /public/company/:id/followers": FOLLOWERS(2) },
    });
    expect(await screen.findByText("2 seguidores")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Seguir tienda" })).toBeNull();
    expect(http.calls("GET /company-follows/:id")).toHaveLength(0);
  });

  it("identidad: logo y banner propios, plantillas si faltan o fallan, y estadísticas reales", async () => {
    renderApp("/company/e1", {
      routes: {
        ...BASE,
        "GET /public/company/:id": { ...COMPANY, logo_url: "https://cdn.test/logo.png", banner_url: "https://cdn.test/banner.png" },
        "GET /public/company/:id/followers": FOLLOWERS(0),
      },
    });
    const logo = (await screen.findByAltText("Logo de ACME")) as HTMLImageElement;
    expect(logo.src).toBe("https://cdn.test/logo.png");
    fireEvent.error(logo);
    expect((screen.getByAltText("Logo de ACME") as HTMLImageElement).src).toContain("logo-default");

    const banner = document.querySelector('img[src="https://cdn.test/banner.png"]') as HTMLImageElement;
    expect(banner.getAttribute("fetchpriority")).toBe("high");

    expect(screen.getByText("0 seguidores")).toBeTruthy();
    expect(screen.getByText("3 productos publicados")).toBeTruthy();
    expect(screen.getByText(/^Desde \S+ de 2024$/)).toBeTruthy();
    expect(screen.getAllByText("(2 reseñas)", { exact: false })).toHaveLength(1);
  });

  it("un solo contenedor Sobre: descripción, antigüedad, productos, contacto y Reportar al final; Seguir en la cabecera", async () => {
    renderApp("/company/e1", { routes: { ...BASE, "GET /public/company/:id/followers": FOLLOWERS(0) } });
    const about = (await screen.findByRole("heading", { name: "Sobre ACME" })).closest("aside") as HTMLElement;

    expect(document.querySelectorAll("aside")).toHaveLength(1);
    expect(within(about).getByText("Muebles hechos a mano")).toBeTruthy();
    expect(within(about).getByText("En RehniMarket desde")).toBeTruthy();
    expect(within(about).getByText("Productos publicados").nextElementSibling?.textContent).toBe("3");
    expect(within(about).queryByText(/Calificaci/)).toBeNull();
    const report = within(about).getByRole("button", { name: /Reportar empresa/ });
    expect(about.lastElementChild?.contains(report)).toBe(true);
    expect(within(about).queryByRole("button", { name: /Seguir/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Seguir/ })).toBeTruthy();
  });

  it("contacto comercial autorizado: enlaces mailto y tel", async () => {
    renderApp("/company/e1", {
      routes: {
        ...BASE,
        "GET /public/company/:id": { ...COMPANY, contact_email: "ventas@acme.example", contact_phone: "+576045550000" },
        "GET /public/company/:id/followers": FOLLOWERS(0),
      },
    });
    const about = (await screen.findByRole("heading", { name: "Sobre ACME" })).closest("aside") as HTMLElement;

    expect(within(about).getByRole("link", { name: "ventas@acme.example" }).getAttribute("href")).toBe("mailto:ventas@acme.example");
    expect(within(about).getByRole("link", { name: "+576045550000" }).getAttribute("href")).toBe("tel:+576045550000");
  });

  it("sin contacto autorizado muestra No disponible y ningún enlace de contacto", async () => {
    renderApp("/company/e1", { routes: { ...BASE, "GET /public/company/:id/followers": FOLLOWERS(0) } });
    const about = (await screen.findByRole("heading", { name: "Sobre ACME" })).closest("aside") as HTMLElement;

    expect(within(about).getByText("Correo comercial").nextElementSibling?.textContent).toBe("No disponible");
    expect(within(about).getByText("Teléfono comercial").nextElementSibling?.textContent).toBe("No disponible");
    expect(document.querySelector('a[href^="mailto:"], a[href^="tel:"]')).toBeNull();
  });
});

describe("Perfil público · productos publicados y tarjeta lateral", () => {
  const ROUTES = {
    "GET /public/company/:id": COMPANY,
    "GET /public/company/:id/rating": { average_rating: 4.25, total_reviews: 2 },
    "GET /public/company/:id/followers": FOLLOWERS(3),
    "GET /public/company/:id/products": products([
      { ...card("a", "Sillas"), image: "https://cdn.test/a.png", discount_enabled: true, discount_percentage: 10, final_price: "900" },
    ]),
  };

  it("tarjetas compactas y oscuras: sin el nombre de la tienda, precio real y carrito como icono", async () => {
    renderApp("/company/e1", { role: "user", routes: ROUTES });
    const link = await screen.findByRole("link", { name: "Producto a" });
    const article = link.closest("article") as HTMLElement;

    expect(within(article).queryByText("ACME")).toBeNull();
    expect(within(article).getByText("-10%")).toBeTruthy();
    expect(within(article).getByText("$900")).toBeTruthy();
    const cart = within(article).getByRole("button", { name: "Agregar Producto a al carrito" });
    expect(cart.textContent).toBe("");
    const frame = (article.querySelector("img") as HTMLImageElement).parentElement as HTMLElement;
    expect(frame.className).toContain("bg-surface-2");
    expect(frame.className).not.toContain("bg-white");
  });

  it.each(["company", "admin", "owner"] as const)("rol %s: tarjetas sin carrito ni favoritos", async (role) => {
    renderApp("/company/e1", { role, routes: ROUTES });
    await screen.findByRole("link", { name: "Producto a" });
    expect(screen.queryByRole("button", { name: /al carrito/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /favoritos/ })).toBeNull();
  });

  it("tarjeta Sobre: antigüedad y productos reales sin repetir calificación, seguidores ni verificación", async () => {
    renderApp("/company/e1", { routes: ROUTES });
    const aside = (await screen.findByRole("heading", { name: "Sobre ACME" })).closest("aside") as HTMLElement;
    expect(within(aside).getByText("Productos publicados")).toBeTruthy();
    expect(within(aside).queryByText("4.3")).toBeNull();
    expect(within(aside).queryByText("Seguidores")).toBeNull();
    expect(within(aside).queryByText(/Verificad/)).toBeNull();
  });

  it("sin reseñas, la cabecera lo dice sin inventar una calificación", async () => {
    renderApp("/company/e1", {
      routes: { ...ROUTES, "GET /public/company/:id/rating": { average_rating: null, total_reviews: 0 } },
    });
    expect(await screen.findByText("Sin reseñas todavía")).toBeTruthy();
  });
});

describe("Página de categorías", () => {
  const CATS = Array.from({ length: 10 }, (_, i) => ({
    id: `k${i}`,
    name: `Categoría ${String.fromCharCode(65 + i)}`,
    product_count: i,
    image_url: null,
  }));

  it("busca, filtra, ordena y pagina en el cliente", async () => {
    const cards = () =>
      Array.from(document.querySelectorAll('a[href^="/products?catalog="]')).map((a) => a.getAttribute("href"));
    renderApp("/categories", { routes: { "GET /public/catalogs": CATS } });
    await waitFor(() => expect(cards()).toHaveLength(8));
    expect(cards()[0]).toBe("/products?catalog=k0");

    fireEvent.click(screen.getByRole("button", { name: "Página 2" }));
    expect(cards()).toEqual(["/products?catalog=k8", "/products?catalog=k9"]);

    fireEvent.change(screen.getByLabelText("Ordenar categorías"), { target: { value: "za" } });
    expect(cards()[0]).toBe("/products?catalog=k9");
    fireEvent.change(screen.getByLabelText("Ordenar categorías"), { target: { value: "products" } });
    expect(cards()[0]).toBe("/products?catalog=k9");
    fireEvent.change(screen.getByLabelText("Ordenar categorías"), { target: { value: "az" } });
    expect(cards()[0]).toBe("/products?catalog=k0");

    fireEvent.change(screen.getByLabelText("Filtrar por categoría"), { target: { value: "Categoría C" } });
    expect(cards()).toEqual(["/products?catalog=k2"]);
    fireEvent.change(screen.getByLabelText("Filtrar por categoría"), { target: { value: "" } });

    fireEvent.change(screen.getByLabelText("Buscar categoría"), { target: { value: "zzz" } });
    expect(screen.getByText("No hay categorías que coincidan con tu búsqueda.")).toBeTruthy();
  });

  it("encabezado alineado, imagen real del backend, cantidad real y enlace al listado filtrado", async () => {
    renderApp("/categories", {
      routes: {
        "GET /public/catalogs": [
          { id: "c1", name: "Laptops", product_count: 1, image_url: "https://cdn.test/laptops.png" },
          { id: "c2", name: "Monitores", product_count: 12, image_url: null },
        ],
      },
    });
    expect(await screen.findByRole("heading", { level: 1, name: "Explorar categorías" })).toBeTruthy();
    expect(screen.getByText("Encuentra productos increíbles en todas nuestras categorías.")).toBeTruthy();

    const laptops = (await screen.findByRole("heading", { name: "Laptops" })).closest("a") as HTMLAnchorElement;
    expect(laptops.getAttribute("href")).toBe("/products?catalog=c1");
    expect(within(laptops).getByText("1 producto")).toBeTruthy();
    const img = laptops.querySelector("img") as HTMLImageElement;
    expect(img.src).toBe("https://cdn.test/laptops.png");
    expect(img.getAttribute("loading")).toBe("lazy");
    fireEvent.error(img);
    expect(within(laptops).getByText("Imagen no disponible")).toBeTruthy();

    const monitores = screen.getByRole("heading", { name: "Monitores" }).closest("a") as HTMLAnchorElement;
    expect(within(monitores).getByText("12 productos")).toBeTruthy();
    expect(within(monitores).getByText("Imagen no disponible")).toBeTruthy();
    expect((screen.getByLabelText("Ordenar categorías") as HTMLSelectElement).value).toBe("featured");
    expect(screen.getByRole("option", { name: "Destacadas" })).toBeTruthy();
  });

  it("error con reintento y vacío", async () => {
    let fail = true;
    renderApp("/categories", { routes: { "GET /public/catalogs": () => (fail ? reply(500) : []) } });
    expect(await screen.findByText("No se pudieron cargar las categorías")).toBeTruthy();
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(await screen.findByText("Aún no hay categorías disponibles.")).toBeTruthy();
  });
});
