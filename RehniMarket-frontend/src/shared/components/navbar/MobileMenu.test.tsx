// Navbar móvil: búsqueda bajo la barra, menú de altura completa con cuenta por rol y accesos rápidos.
import { describe, expect, it } from "vitest";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";

import { EMPTY_CART, renderApp } from "@/test/renderApp";

const ROUTES = {
  "GET /public/advertisements": [],
  "GET /public/catalogs": [],
  "GET /public/products/new": { page: 1, limit: 6, total: 0, total_pages: 1, products: [] },
  "GET /public/products/offers": { page: 1, limit: 6, total: 0, total_pages: 1, products: [] },
};

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
  return screen.getByRole("dialog", { name: "Menú principal" });
}

describe("Navbar móvil · búsqueda", () => {
  it("la búsqueda móvil está fuera del menú y lleva a los resultados", async () => {
    const product = {
      id: "p1",
      name: "Silla Roble",
      image: null,
      company_name: "ACME",
      catalog_id: "k1",
      catalog_name: "Muebles",
      price: "1000",
      discount_enabled: false,
      discount_percentage: null,
      final_price: "1000",
      applies_tax: false,
      stock: 1,
      average_rating: null,
      review_count: 0,
    };
    renderApp("/", { routes: { ...ROUTES, "GET /public/products/daily": [product], "GET /public/products": { ...ROUTES["GET /public/products/new"], products: [product], total: 1 } } });

    const mobileSearch = screen.getByPlaceholderText("Buscar productos…");
    expect(document.getElementById("mobile-menu")).toBeNull();

    fireEvent.change(mobileSearch, { target: { value: "silla" } });
    const suggestion = await screen.findByRole("button", { name: /Silla Roble.*ACME/ }, { timeout: 2000 });
    expect(screen.getAllByRole("button", { name: /Silla Roble.*ACME/ })).toHaveLength(1);
    expect(mobileSearch.parentElement?.contains(suggestion)).toBe(true);

    fireEvent.click(screen.getAllByRole("button", { name: "Buscar" })[1]);
    await waitFor(() => expect(window.location.pathname + window.location.search).toBe("/products?search=silla"));

    const menu = openMenu();
    expect(within(menu).queryByRole("searchbox")).toBeNull();
  });
});

describe("Navbar móvil · menú", () => {
  it("visitante: navegación con la página activa, acceso a login/registro y sin accesos rápidos", () => {
    renderApp("/offers", { routes: { "GET /public/products/offers": ROUTES["GET /public/products/offers"] } });
    const menu = openMenu();

    expect(within(menu).getByRole("link", { name: "Ofertas" }).getAttribute("aria-current")).toBe("page");
    for (const label of ["Inicio", "Categorías", "Productos", "Novedades"]) {
      expect(within(menu).getByRole("link", { name: label })).toBeTruthy();
    }
    expect(within(menu).getByRole("link", { name: "Iniciar sesión" })).toBeTruthy();
    expect(within(menu).queryByRole("navigation", { name: "Accesos rápidos" })).toBeNull();
  });

  it("bloquea el scroll, enfoca cerrar y al cerrar devuelve el foco a la hamburguesa", () => {
    renderApp("/", { routes: ROUTES });
    const trigger = screen.getByRole("button", { name: "Abrir menú" });
    openMenu();

    expect(document.body.style.overflow).toBe("hidden");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cerrar menú" }));
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Cerrar menú" }));
    expect(screen.queryByRole("dialog", { name: "Menú principal" })).toBeNull();
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(trigger);

    openMenu();
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(screen.queryByRole("dialog", { name: "Menú principal" })).toBeNull();

    // En tablet el panel es un cajón lateral: tocar el fondo lo cierra, tocar el panel no.
    const overlay = openMenu();
    fireEvent.click(within(overlay).getByRole("navigation", { name: "Tienda" }));
    expect(screen.getByRole("dialog", { name: "Menú principal" })).toBeTruthy();
    fireEvent.click(overlay);
    expect(screen.queryByRole("dialog", { name: "Menú principal" })).toBeNull();
  });

  it("navegar desde el menú lo cierra", async () => {
    renderApp("/", { routes: { ...ROUTES, "GET /public/products": ROUTES["GET /public/products/new"] } });
    const menu = openMenu();
    fireEvent.click(within(menu).getByRole("link", { name: "Productos" }));
    await waitFor(() => expect(window.location.pathname).toBe("/products"));
    expect(screen.queryByRole("dialog", { name: "Menú principal" })).toBeNull();
  });

  it("comprador: perfil en acordeón con sus secciones y accesos rápidos con el carrito", async () => {
    renderApp("/", { role: "user", routes: { ...ROUTES, "GET /cart": { ...EMPTY_CART, totalItems: 3 } } });
    await waitFor(() => within(screen.getByRole("button", { name: "Mi carrito" })).getByText("3"));
    const menu = openMenu();

    const profile = within(menu).getByRole("button", { name: /Cuenta user\s*Usuario/ });
    expect(profile.getAttribute("aria-expanded")).toBe("false");
    expect(within(menu).queryByRole("link", { name: "Mis pedidos" })).toBeNull();

    fireEvent.click(profile);
    expect(profile.getAttribute("aria-expanded")).toBe("true");
    const links = within(menu).getByRole("link", { name: "Mis pedidos" });
    expect(links.getAttribute("href")).toBe("/user/dashboard?tab=orders");
    expect(within(menu).getByRole("link", { name: "RehniCoin" }).getAttribute("href")).toBe("/user/dashboard?tab=wallet");
    expect(within(menu).getByRole("link", { name: "Configuración de cuenta" }).getAttribute("href")).toBe("/user/dashboard?tab=profile");

    const quick = within(menu).getByRole("navigation", { name: "Accesos rápidos" });
    expect(within(quick).getByRole("link", { name: /Carrito\s*3/ }).getAttribute("href")).toBe("/cart");
    expect(within(quick).getByRole("link", { name: "Favoritos" })).toBeTruthy();
    expect(within(quick).getByRole("link", { name: "Mi cuenta" }).getAttribute("href")).toBe("/user/dashboard");

    fireEvent.click(profile);
    expect(within(menu).queryByRole("link", { name: "Mis pedidos" })).toBeNull();
  });

  it("propietario: secciones de administración y liquidaciones, sin carrito ni favoritos", async () => {
    renderApp("/", { role: "owner", routes: ROUTES });
    await screen.findAllByRole("button", { name: /Cuenta owner/ });
    const menu = openMenu();
    fireEvent.click(within(menu).getByRole("button", { name: /Cuenta owner\s*Propietario/ }));
    expect(within(menu).getByRole("link", { name: "Liquidaciones" }).getAttribute("href")).toBe("/admin/dashboard?tab=payouts");
    expect(within(menu).getByRole("link", { name: "Empresas" })).toBeTruthy();
    expect(within(menu).getByRole("link", { name: "Panel de inicio" }).getAttribute("href")).toBe("/admin/dashboard");

    const quick = within(menu).getByRole("navigation", { name: "Accesos rápidos" });
    expect(within(quick).queryByRole("link", { name: /Carrito/ })).toBeNull();
    expect(within(quick).getByRole("link", { name: "Mi panel" }).getAttribute("href")).toBe("/admin/dashboard");
  });

  it("empresa: cerrar sesión desde el menú limpia la sesión y vuelve a la tienda", async () => {
    renderApp("/", { role: "company", routes: ROUTES });
    await screen.findAllByRole("button", { name: /Cuenta company/ });
    const menu = openMenu();
    fireEvent.click(within(menu).getByRole("button", { name: /Cuenta company\s*Empresa/ }));
    expect(within(menu).getByRole("link", { name: "Finanzas" }).getAttribute("href")).toBe("/company/dashboard?tab=finance");

    fireEvent.click(within(menu).getByRole("button", { name: "Cerrar sesión" }));
    await waitFor(() => expect(localStorage.getItem("accessToken")).toBeNull());
    expect(screen.queryByRole("dialog", { name: "Menú principal" })).toBeNull();
    expect(await screen.findAllByRole("link", { name: "Iniciar sesión" })).toBeTruthy();
  });
});
