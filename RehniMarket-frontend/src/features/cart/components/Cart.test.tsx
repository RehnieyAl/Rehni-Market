// Carrito y checkout del comprador: cantidades contra stock, IVA, pago con RehniCoin, dirección
// de entrega obligatoria y errores de stock del backend.
import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import { renderApp } from "@/test/renderApp";
import { apiError, reply } from "@/test/http";

const item = (id: string, extra = {}) => ({
  id,
  productId: `p-${id}`,
  variantId: `v-${id}`,
  name: `Producto ${id}`,
  variantName: "Rojo / M",
  sku: null,
  image: null,
  options: [
    { attribute: "Color", value: "Rojo" },
    { attribute: "Talla", value: "M" },
  ],
  companyId: "e1",
  companyName: "ACME",
  basePrice: "100000",
  unitPrice: "80000",
  discountPercentage: 20,
  appliesTax: true,
  taxAmount: "15200",
  quantity: 2,
  subtotal: "160000",
  availableStock: 5,
  ...extra,
});

const cart = (items: unknown[], extra = {}) => ({
  id: "c1",
  items,
  subtotal: "160000",
  tax: "30400",
  total: "190400",
  totalItems: 2,
  ...extra,
});

const ADDRESS = {
  id: "d1",
  label: "Casa",
  fullName: "Ana Gómez",
  country: "Colombia",
  department: "Valle",
  city: "Cali",
  address: "Calle 1 # 2-3",
  postalCode: null,
  phone: "3001112233",
  additionalInstructions: "Portería azul",
  isDefault: true,
  createdAt: "2026-01-01",
};
const OFFICE = { ...ADDRESS, id: "d2", label: "Oficina", isDefault: false, fullName: null, additionalInstructions: null };

describe("Carrito", () => {
  it("lista ítems con descuento e IVA; sube y baja cantidades respetando el stock", async () => {
    let current = cart([item("a")]);
    const { http } = renderApp("/cart", {
      role: "user",
      routes: {
        "GET /cart": () => current,
        "PATCH /cart/item/:id": (req: { body: { quantity: number } }) => {
          current = cart([item("a", { quantity: req.body.quantity })]);
          return current;
        },
      },
    });
    expect(await screen.findByText("Producto a")).toBeTruthy();
    expect(screen.getByText("Color: Rojo · Talla: M")).toBeTruthy();
    expect(screen.getByText("-20%")).toBeTruthy();
    expect(screen.getByText("$30.400")).toBeTruthy();
    expect(screen.getByText("Subtotal (2 productos)")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Agregar una unidad" }));
    await waitFor(() => expect(http.calls("PATCH /cart/item/:id")[0].body).toEqual({ quantity: 3 }));
    fireEvent.click(screen.getByRole("button", { name: "Quitar una unidad" }));
    await waitFor(() => expect(http.calls("PATCH /cart/item/:id")[1].body).toEqual({ quantity: 2 }));

    fireEvent.click(screen.getByRole("button", { name: /Ir a pagar/ }));
    await waitFor(() => expect(window.location.pathname).toBe("/checkout"));
  });

  it("ítems agotados o con más cantidad que stock bloquean el pago y se pueden eliminar", async () => {
    let current = cart([
      item("a", { availableStock: 0 }),
      item("b", { availableStock: 1, quantity: 3, discountPercentage: null, options: [], variantName: "Única" }),
    ], { tax: "0", totalItems: 1 });
    const { http } = renderApp("/cart", {
      role: "user",
      routes: {
        "GET /cart": () => current,
        "DELETE /cart/item/:id": () => {
          current = cart([], { totalItems: 0 });
          return current;
        },
      },
    });
    expect(await screen.findByText("Agotado")).toBeTruthy();
    expect(screen.getByText("Sin stock suficiente")).toBeTruthy();
    expect(screen.getByText(/Solo quedan 1 unidad\. Reduce la cantidad/)).toBeTruthy();
    expect(screen.getByText("Única")).toBeTruthy();
    expect(screen.getByText("No aplica")).toBeTruthy();
    expect(screen.getByText("Subtotal (1 producto)")).toBeTruthy();
    expect((screen.getByRole("button", { name: /Ir a pagar/ }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /Eliminar producto/ }));
    expect(await screen.findByText("Tu carrito está vacío")).toBeTruthy();
    expect(http.calls("DELETE /cart/item/:id")[0].url).toBe("/cart/item/a");
  });

  it("vaciar el carrito y errores al actualizar", async () => {
    renderApp("/cart", {
      role: "user",
      routes: {
        "GET /cart": cart([item("a")]),
        "PATCH /cart/item/:id": apiError(400, "INSUFFICIENT_STOCK", "Solo hay 2 unidades."),
        "DELETE /cart/item/:id": reply(500),
        "DELETE /cart/clear": cart([], { totalItems: 0 }),
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Agregar una unidad" }));
    expect((await screen.findAllByText("Solo hay 2 unidades.")).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Eliminar Producto a" }));
    expect(await screen.findByText("No se pudo eliminar el producto.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Vaciar carrito" }));
    expect(await screen.findByText("Tu carrito está vacío")).toBeTruthy();
  });

  it("un visitante ve el carrito vacío", async () => {
    renderApp("/cart");
    expect(await screen.findByText("Tu carrito está vacío")).toBeTruthy();
  });
});

describe("Checkout", () => {
  function checkoutRoutes(extra: Record<string, unknown> = {}) {
    return {
      "GET /cart": cart([item("a")]),
      "GET /addresses": [OFFICE, ADDRESS],
      "GET /wallet/me": { id: "w1", balance: "500000" },
      ...extra,
    };
  }

  it("usa la dirección predeterminada, paga con RehniCoin y confirma la compra", async () => {
    const { http } = renderApp("/checkout", {
      role: "user",
      routes: checkoutRoutes({ "POST /checkout": { orders: [], subtotal: "160000", tax: "30400", total: "190400", walletBalance: "309600" } }),
    });
    expect(await screen.findByText(/Casa · Ana Gómez/)).toBeTruthy();
    expect(screen.getByText("2 × Producto a (Rojo / M)")).toBeTruthy();
    expect(screen.getByText("$500.000")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar compra" }));
    expect(await screen.findByText("Compra confirmada")).toBeTruthy();
    expect(http.calls("POST /checkout")[0].body).toEqual({ addressId: "d1" });
    expect(screen.getByRole("link", { name: "Ver mis pedidos" }).getAttribute("href")).toBe("/user/dashboard?tab=orders");
  });

  it("cambiar la dirección desde el modal de selección", async () => {
    const { http } = renderApp("/checkout", {
      role: "user",
      routes: checkoutRoutes({ "POST /checkout": { orders: [] } }),
    });
    fireEvent.click(await screen.findByRole("button", { name: /Cambiar/ }));
    const dialog = await screen.findByRole("dialog", { name: "Dirección de entrega" });
    expect(await within(dialog).findByText("(predeterminada)")).toBeTruthy();
    fireEvent.click(within(dialog).getAllByRole("radio")[0]);
    fireEvent.click(within(dialog).getByRole("button", { name: "Continuar" }));
    expect(await screen.findByText("Oficina")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar compra" }));
    await waitFor(() => expect(http.calls("POST /checkout")[0].body).toEqual({ addressId: "d2" }));
  });

  it("sin direcciones abre el formulario; crear una la selecciona", async () => {
    const { http } = renderApp("/checkout", {
      role: "user",
      routes: checkoutRoutes({ "GET /addresses": [], "POST /addresses": ADDRESS }),
    });
    const dialog = await screen.findByRole("dialog", { name: "Dirección de entrega" });
    fireEvent.click(await within(dialog).findByRole("button", { name: /Guardar dirección/ }));
    expect(await screen.findByText(/Completa nombre de referencia/)).toBeTruthy();

    fireEvent.change(within(dialog).getByLabelText(/Nombre de referencia/), { target: { value: " Casa " } });
    fireEvent.change(within(dialog).getByLabelText(/Nombre completo/), { target: { value: "Ana Gómez" } });
    fireEvent.change(within(dialog).getByLabelText(/Teléfono/), { target: { value: "3001112233" } });
    fireEvent.change(within(dialog).getByLabelText(/^Dirección/), { target: { value: "Calle 1 # 2-3" } });
    fireEvent.change(within(dialog).getByLabelText(/Ciudad/), { target: { value: "Cali" } });
    fireEvent.change(within(dialog).getByLabelText(/Departamento/), { target: { value: "Valle" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /Guardar dirección/ }));

    expect(await screen.findByText("Dirección guardada.")).toBeTruthy();
    expect(http.calls("POST /addresses")[0].body).toEqual({
      label: "Casa",
      fullName: "Ana Gómez",
      country: "Colombia",
      department: "Valle",
      city: "Cali",
      address: "Calle 1 # 2-3",
      phone: "3001112233",
      isDefault: false,
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Continuar" }));
    expect(await screen.findByText(/Casa · Ana Gómez/)).toBeTruthy();
  });

  it("saldo insuficiente bloquea la compra y sugiere recargar", async () => {
    renderApp("/checkout", {
      role: "user",
      routes: checkoutRoutes({ "GET /wallet/me": { id: "w1", balance: "1000" } }),
    });
    expect(await screen.findByText(/Tu saldo no alcanza para esta compra/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Recarga en tu cuenta" }).getAttribute("href")).toBe("/user/dashboard?tab=wallet");
    expect((screen.getByRole("button", { name: "Confirmar compra" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("producto agotado al pagar: recarga el carrito y avisa", async () => {
    let cartCalls = 0;
    const { http } = renderApp("/checkout", {
      role: "user",
      routes: checkoutRoutes({
        "GET /cart": () => {
          cartCalls += 1;
          return cartCalls > 1 ? cart([item("a", { availableStock: 0 })]) : cart([item("a")]);
        },
        "POST /checkout": apiError(409, "PRODUCT_OUT_OF_STOCK", "Producto a se agotó."),
      }),
    });
    fireEvent.click(await screen.findByRole("button", { name: "Confirmar compra" }));
    expect((await screen.findAllByText("Producto a se agotó.")).length).toBeGreaterThan(0);
    expect(await screen.findByText(/Hay productos agotados o sin stock suficiente/)).toBeTruthy();
    expect(http.calls("GET /cart").length).toBeGreaterThan(1);
  });

  it("dirección requerida por el backend reabre la selección", async () => {
    renderApp("/checkout", {
      role: "user",
      routes: checkoutRoutes({ "POST /checkout": apiError(400, "ADDRESS_REQUIRED", "Debes registrar una dirección.") }),
    });
    fireEvent.click(await screen.findByRole("button", { name: "Confirmar compra" }));
    expect(await screen.findByRole("dialog", { name: "Dirección de entrega" })).toBeTruthy();
  });

  it("carrito vacío en checkout invita a explorar", async () => {
    renderApp("/checkout", { role: "user", routes: checkoutRoutes({ "GET /cart": cart([]) }) });
    expect(await screen.findByText("Tu carrito está vacío")).toBeTruthy();
  });

  it("un visitante que abre el checkout va al login", async () => {
    renderApp("/checkout");
    await waitFor(() => expect(window.location.pathname).toBe("/login"));
  });
});

describe("Panel comprador · Direcciones", () => {
  it("lista, marca predeterminada, elimina y crea", async () => {
    let list = [ADDRESS, OFFICE];
    const { http } = renderApp("/user/dashboard?tab=addresses", {
      role: "user",
      routes: {
        "GET /addresses": () => list,
        "PATCH /addresses/:id/set-default": () => {
          list = [{ ...OFFICE, isDefault: true }, { ...ADDRESS, isDefault: false }];
          return list[0];
        },
        "DELETE /addresses/:id": () => {
          list = list.filter((a) => a.id !== "d1");
          return { message: "ok" };
        },
        "POST /addresses": { ...ADDRESS, id: "d3", label: "Finca", isDefault: false },
      },
    });
    expect(await screen.findByText("Portería azul")).toBeTruthy();
    expect(screen.getByText("Predeterminada")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Marcar Oficina como predeterminada" }));
    await waitFor(() => expect(http.calls("PATCH /addresses/:id/set-default")[0].url).toBe("/addresses/d2/set-default"));

    fireEvent.click(await screen.findByRole("button", { name: "Eliminar Casa" }));
    fireEvent.click(within(await screen.findByRole("dialog", { name: "Eliminar dirección" })).getByRole("button", { name: "Eliminar dirección" }));
    expect(await screen.findByText("Dirección eliminada.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Agregar dirección/ }));
    fireEvent.change(screen.getByLabelText(/Nombre de referencia/), { target: { value: "Finca" } });
    fireEvent.change(screen.getByLabelText(/Nombre completo/), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: "300" } });
    fireEvent.change(screen.getByLabelText(/^Dirección$/), { target: { value: "Km 5" } });
    fireEvent.change(screen.getByLabelText(/Ciudad/), { target: { value: "Cali" } });
    fireEvent.change(screen.getByLabelText(/Departamento/), { target: { value: "Valle" } });
    fireEvent.change(screen.getByLabelText(/Indicaciones/), { target: { value: " Al lado del río " } });
    fireEvent.click(screen.getByLabelText(/Dirección principal/));
    fireEvent.click(screen.getByRole("button", { name: /Guardar dirección/ }));
    expect(await screen.findByText("Finca")).toBeTruthy();
    expect(http.calls("POST /addresses")[0].body).toMatchObject({ additionalInstructions: "Al lado del río", isDefault: true });
  });

  it("vacío, error con reintento y fallos de acciones", async () => {
    let fail = true;
    renderApp("/user/dashboard?tab=addresses", {
      role: "user",
      routes: {
        "GET /addresses": () => (fail ? reply(500) : []),
      },
    });
    expect(await screen.findByText("No pudimos cargar tus direcciones")).toBeTruthy();
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(await screen.findByText("Aún no has registrado direcciones")).toBeTruthy();
  });

  it("si eliminar o marcar falla se avisa", async () => {
    renderApp("/user/dashboard?tab=addresses", {
      role: "user",
      routes: {
        "GET /addresses": [ADDRESS, OFFICE],
        "PATCH /addresses/:id/set-default": reply(500),
        "DELETE /addresses/:id": reply(500),
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Marcar Oficina como predeterminada" }));
    expect(await screen.findByText("No se pudo marcar la dirección como predeterminada.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Eliminar Oficina" }));
    fireEvent.click(within(await screen.findByRole("dialog", { name: "Eliminar dirección" })).getByRole("button", { name: "Eliminar dirección" }));
    expect(await screen.findByText("No se pudo eliminar la dirección.")).toBeTruthy();
  });
});
