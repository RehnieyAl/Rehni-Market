// Desplegables de Favoritos y Carrito del navbar: apertura y cierre (segundo clic, Escape, clic fuera), datos reales
// de los providers, estado vacío, quitar favorito sincronizado, subtotal del backend, "Pagar" al checkout y permisos.
import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import { EMPTY_CART, renderApp } from "@/test/renderApp";
import { reply } from "@/test/http";

const FAVORITES = [
  {
    id: "f1",
    createdAt: "2026-11-01T00:00:00Z",
    product: { id: "p1", name: "Silla Roble", image: null, companyName: "ACME", price: "200000", finalPrice: "180000", discountEnabled: true, isActive: true },
  },
  {
    id: "f2",
    createdAt: "2026-11-02T00:00:00Z",
    product: { id: "p2", name: "Mesa Nogal", image: "https://cdn.test/mesa.png", companyName: "ACME", price: "500000", finalPrice: "500000", discountEnabled: false, isActive: false },
  },
];

const ITEM = {
  id: "i1",
  productId: "p1",
  variantId: "v1",
  name: "Silla Roble",
  variantName: "Silla Roble Negro",
  sku: null,
  image: null,
  options: [{ attribute: "Color", value: "Negro" }],
  companyId: "e1",
  companyName: "ACME",
  basePrice: "100000",
  unitPrice: "100000",
  discountPercentage: null,
  appliesTax: false,
  taxAmount: "0",
  quantity: 2,
  subtotal: "200000",
  availableStock: 5,
};

const CART = { ...EMPTY_CART, items: [ITEM], subtotal: "200000", total: "200000", totalItems: 2 };

async function openFavorites() {
  const trigger = await screen.findByRole("button", { name: "Mis favoritos" });
  fireEvent.click(trigger);
  return { trigger, panel: await screen.findByRole("region", { name: "Favoritos" }) };
}

async function openCart() {
  const trigger = await screen.findByRole("button", { name: "Mi carrito" });
  fireEvent.click(trigger);
  return { trigger, panel: await screen.findByRole("region", { name: "Carrito" }) };
}

describe("Navbar · desplegable de Favoritos", () => {
  it("muestra los favoritos reales con imagen, nombre, precio y acceso al detalle", async () => {
    renderApp("/", { role: "user", routes: { "GET /favorites": FAVORITES } });
    await waitFor(() => within(screen.getByRole("button", { name: "Mis favoritos" })).getByText("2"));
    const { trigger, panel } = await openFavorites();

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe("favorites-menu");
    expect(within(panel).getByRole("link", { name: "Silla Roble" }).getAttribute("href")).toBe("/products/p1");
    expect(within(panel).getByText("$180.000")).toBeTruthy();
    expect(within(panel).getByText("$200.000")).toBeTruthy();
    expect(within(panel).getByText("Ya no está disponible")).toBeTruthy();
    expect(panel.querySelector("img")?.getAttribute("src")).toBe("https://cdn.test/mesa.png");
    expect(within(panel).getByRole("link", { name: "Ver todos los favoritos" }).getAttribute("href")).toBe(
      "/user/dashboard?tab=favorites",
    );

    fireEvent.click(within(panel).getByRole("link", { name: "Silla Roble" }));
    await waitFor(() => expect(window.location.pathname).toBe("/products/p1"));
    expect(screen.queryByRole("region", { name: "Favoritos" })).toBeNull();
  });

  it("se cierra con un segundo clic, con Escape (devuelve el foco) y con un clic fuera", async () => {
    renderApp("/", { role: "user", routes: { "GET /favorites": FAVORITES } });
    await waitFor(() => within(screen.getByRole("button", { name: "Mis favoritos" })).getByText("2"));

    const { trigger } = await openFavorites();
    fireEvent.click(trigger);
    expect(screen.queryByRole("region", { name: "Favoritos" })).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    await openFavorites();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("region", { name: "Favoritos" })).toBeNull();
    expect(document.activeElement).toBe(trigger);

    await openFavorites();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("region", { name: "Favoritos" })).toBeNull();
  });

  it("quitar un favorito usa la API existente y actualiza la lista y el contador", async () => {
    const { http } = renderApp("/", {
      role: "user",
      routes: { "GET /favorites": FAVORITES, "DELETE /favorites/:id": { message: "ok" } },
    });
    await waitFor(() => within(screen.getByRole("button", { name: "Mis favoritos" })).getByText("2"));
    const { trigger, panel } = await openFavorites();

    fireEvent.click(within(panel).getByRole("button", { name: "Quitar Silla Roble de favoritos" }));

    await waitFor(() => expect(within(panel).queryByText("Silla Roble")).toBeNull());
    expect(http.calls("DELETE /favorites/:id")[0].url).toBe("/favorites/p1");
    expect(within(trigger).getByText("1")).toBeTruthy();
  });

  it("si la carga falla avisa y Reintentar vuelve a pedir la lista", async () => {
    let calls = 0;
    renderApp("/", {
      role: "user",
      routes: {
        "GET /favorites": () => {
          calls += 1;
          return calls === 1 ? reply(500) : FAVORITES;
        },
      },
    });
    await waitFor(() => expect(calls).toBe(1));
    const { panel } = await openFavorites();

    expect(within(panel).getByText("No pudimos cargar tus favoritos.")).toBeTruthy();
    fireEvent.click(within(panel).getByRole("button", { name: "Reintentar" }));
    expect(await within(panel).findByRole("link", { name: "Silla Roble" })).toBeTruthy();
  });

  it("si quitar falla, el favorito sigue en la lista", async () => {
    const { http } = renderApp("/", {
      role: "user",
      routes: { "GET /favorites": FAVORITES, "DELETE /favorites/:id": reply(500) },
    });
    await waitFor(() => within(screen.getByRole("button", { name: "Mis favoritos" })).getByText("2"));
    const { panel } = await openFavorites();

    fireEvent.click(within(panel).getByRole("button", { name: "Quitar Silla Roble de favoritos" }));

    await waitFor(() => expect(http.calls("DELETE /favorites/:id")).toHaveLength(1));
    await waitFor(() =>
      expect((within(panel).getByRole("button", { name: "Quitar Silla Roble de favoritos" }) as HTMLButtonElement).disabled).toBe(false),
    );
    expect(within(panel).getByRole("link", { name: "Silla Roble" })).toBeTruthy();
  });

  it("sin favoritos muestra el estado vacío", async () => {
    renderApp("/", { role: "user" });
    const { panel } = await openFavorites();

    expect(within(panel).getByText("Aún no tienes favoritos")).toBeTruthy();
    expect(within(panel).getByRole("link", { name: "Explorar productos" }).getAttribute("href")).toBe("/products");
  });
});

describe("Navbar · desplegable de Carrito", () => {
  it("muestra productos, variante, cantidad, subtotal del backend y Pagar lleva al checkout", async () => {
    renderApp("/", { role: "user", routes: { "GET /cart": CART } });
    await waitFor(() => within(screen.getByRole("button", { name: "Mi carrito" })).getByText("2"));
    const { panel } = await openCart();

    expect(within(panel).getByRole("link", { name: "Silla Roble" }).getAttribute("href")).toBe("/products/p1");
    expect(within(panel).getByText("Color: Negro")).toBeTruthy();
    expect(within(panel).getByText(/Cantidad: 2/)).toBeTruthy();
    expect(within(panel).getAllByText("$200.000")).toHaveLength(2);
    expect(within(panel).getByRole("link", { name: "Ver carrito" }).getAttribute("href")).toBe("/cart");

    fireEvent.click(within(panel).getByRole("button", { name: "Pagar" }));

    await waitFor(() => expect(window.location.pathname).toBe("/checkout"));
    expect(screen.queryByRole("region", { name: "Carrito" })).toBeNull();
  });

  it("con productos sin stock suficiente no deja pagar y explica por qué", async () => {
    renderApp("/", {
      role: "user",
      routes: { "GET /cart": { ...CART, items: [{ ...ITEM, availableStock: 1 }] } },
    });
    await waitFor(() => within(screen.getByRole("button", { name: "Mi carrito" })).getByText("2"));
    const { panel } = await openCart();

    expect((within(panel).getByRole("button", { name: "Pagar" }) as HTMLButtonElement).disabled).toBe(true);
    expect(within(panel).getByText("Sin stock suficiente")).toBeTruthy();
  });

  it("carrito vacío muestra el estado vacío sin botón Pagar", async () => {
    renderApp("/", { role: "user" });
    const { panel } = await openCart();

    expect(within(panel).getByText("Tu carrito está vacío")).toBeTruthy();
    expect(within(panel).queryByRole("button", { name: "Pagar" })).toBeNull();
  });
});

describe("Navbar · un solo desplegable abierto y permisos", () => {
  it("abrir el carrito cierra favoritos y abrir el perfil cierra el carrito", async () => {
    renderApp("/", { role: "user", routes: { "GET /favorites": FAVORITES, "GET /cart": CART } });
    await waitFor(() => within(screen.getByRole("button", { name: "Mi carrito" })).getByText("2"));

    await openFavorites();
    await openCart();
    expect(screen.queryByRole("region", { name: "Favoritos" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Cuenta user/ }));
    expect(await screen.findByRole("region", { name: "Menú de perfil" })).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Carrito" })).toBeNull();
  });

  it.each(["company", "admin", "owner"] as const)("rol %s: sin Favoritos ni Carrito", async (role) => {
    renderApp("/", { role });
    await screen.findByRole("button", { name: /Cuenta/ });

    expect(screen.queryByRole("button", { name: "Mis favoritos" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Mi carrito" })).toBeNull();
  });

  it("visitante: sin Favoritos ni Carrito", async () => {
    renderApp("/");
    await screen.findAllByRole("link", { name: "Iniciar sesión" });

    expect(screen.queryByRole("button", { name: "Mis favoritos" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Mi carrito" })).toBeNull();
  });
});
