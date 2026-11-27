// Panel del comprador montado en la app: inicio, pedidos (cancelar, detalle, devoluciones),
// RehniCoin (saldo, movimientos, solicitud de recarga por WhatsApp) y favoritos.
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import { renderApp } from "@/test/renderApp";
import { apiError, reply } from "@/test/http";
import type { OrderItemReturn } from "@/features/returns/types/response";
import { resetPublicPlatformContactCache } from "@/features/platform/hooks/usePublicPlatformContact";

const ORDER = {
  id: "o1",
  reference: "RM-0001",
  status: "pending",
  companyId: "e1",
  companyName: "ACME",
  subtotal: "160000",
  tax: "30400",
  total: "190400",
  createdAt: "2026-11-01T10:00:00Z",
  items: [
    { id: "i1", productId: "p1", variantId: "v1", productName: "Silla", variantName: "Roja", attributes: { Color: "Rojo" }, unitPrice: "80000", originalUnitPrice: "100000", quantity: 2, subtotal: "160000" },
    { id: "i2", productId: "p2", variantId: null, productName: "Cojín", variantName: null, attributes: null, unitPrice: "0", originalUnitPrice: null, quantity: 1, subtotal: "0" },
  ],
  firstItemName: "Silla",
  totalItems: 3,
  buyerName: "ana",
  buyerEmail: "user@rehni.test",
  buyerPhoto: null,
  buyerPhone: "3001112233",
  deliveryAddress: { label: "Casa", fullName: "Ana", department: "Valle", city: "Cali", address: "Calle 1", phone: "300" },
  shippingCarrier: null,
  trackingNumber: null,
  returns: [],
};
const DELIVERED = {
  ...ORDER,
  id: "o2",
  reference: "RM-0002",
  status: "delivered",
  tax: "0",
  totalItems: 1,
  buyerPhone: null,
  deliveryAddress: null,
  shippingCarrier: { id: "s1", name: "Servientrega", trackingUrl: "https://servi.co" },
  trackingNumber: "G-1",
  returns: [
    { id: "r1", orderItemId: "i2", status: "approved", reason: "Roto", companyResponse: null, refundAmount: "5000", createdAt: "", resolvedAt: "" },
  ] as OrderItemReturn[],
};
const CANCELLED = { ...ORDER, id: "o3", reference: "RM-0003", status: "cancelled" };

function ordersPage(items: unknown[]) {
  return { items, total: items.length, page: 1, limit: 20, total_pages: 1 };
}

afterEach(() => {
  vi.restoreAllMocks();
  resetPublicPlatformContactCache();
});

describe("Comprador · Inicio", () => {
  it("resume pedidos en curso, saldo RehniCoin, favoritos y último pedido, sin bloque de saludo", async () => {
    renderApp("/user/dashboard", {
      role: "user",
      routes: {
        "GET /orders": ordersPage([ORDER, DELIVERED]),
        "GET /wallet/me": { balance: "250000" },
        "GET /favorites": [{ id: "f1", createdAt: "", product: { id: "p1" } }],
        "GET /returns": { items: [], total: 2, page: 1, limit: 1, total_pages: 2 },
        "GET /public/products/daily": [],
      },
    });
    expect(await screen.findByText("Panel Comprador")).toBeTruthy();
    expect(await screen.findByText("$250.000 RC")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1, name: "Inicio" })).toBeTruthy();
    // Los datos personales viven en Configuración de cuenta, no en el inicio.
    expect(screen.queryByText(/Hola,/)).toBeNull();
    expect(screen.queryByText("user@rehni.test")).toBeNull();
    expect(screen.queryByRole("button", { name: "Configurar cuenta" })).toBeNull();
    const stats = screen.getByRole("region", { name: "Resumen de tu cuenta" });
    expect(within(stats).getByText("Pedidos en curso").parentElement?.textContent).toContain("1");
    expect(within(stats).getByText("Devoluciones").parentElement?.textContent).toContain("2");
    expect(screen.getByText(/^Silla\s*y 2 producto\(s\) más/)).toBeTruthy();
    expect(screen.getByText("Todavía no hay productos del día")).toBeTruthy();
  });

  it("un fallo del resumen no muestra ceros y la acción del encabezado lleva al catálogo", async () => {
    renderApp("/user/dashboard", {
      role: "user",
      routes: { "GET /orders": reply(500), "GET /wallet/me": { balance: "0" }, "GET /public/products/daily": [] },
    });
    expect(await screen.findByText("No pudimos cargar tus pedidos recientes")).toBeTruthy();
    const stats = screen.getByRole("region", { name: "Resumen de tu cuenta" });
    expect(within(stats).getAllByText("—")).toHaveLength(3);

    expect(screen.getByRole("link", { name: "Seguir comprando" }).getAttribute("href")).toBe("/products");
  });

  it("sin pedidos invita a explorar", async () => {
    renderApp("/user/dashboard", {
      role: "user",
      routes: {
        "GET /orders": ordersPage([]),
        "GET /wallet/me": { balance: "0" },
        "GET /returns": { items: [], total: 0, page: 1, limit: 1, total_pages: 0 },
        "GET /public/products/daily": [],
      },
    });
    expect(await screen.findByText("Todavía no tienes pedidos")).toBeTruthy();
  });
});

describe("Comprador · Mis pedidos", () => {
  it("lista pedidos y cancela uno pendiente con confirmación", async () => {
    const { http } = renderApp("/user/dashboard?tab=orders", {
      role: "user",
      routes: {
        "GET /orders": ordersPage([ORDER, CANCELLED]),
        "PATCH /orders/:id/cancel": { ...ORDER, status: "cancelled" },
      },
    });
    expect(await screen.findAllByText("Pedido a ACME", { exact: false })).toHaveLength(2);
    expect(screen.getAllByText("2 × Silla (Color: Rojo)").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Cancelar pedido" })).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar pedido" }));
    const dialog = await screen.findByRole("dialog", { name: "Cancelar pedido" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar pedido" }));
    await waitFor(() => expect(screen.queryAllByRole("button", { name: "Cancelar pedido" })).toHaveLength(0));
    expect(http.calls("PATCH /orders/:id/cancel")[0].url).toBe("/orders/o1/cancel");
  });

  it("error al cancelar avisa; error de carga permite reintentar; vacío invita a comprar", async () => {
    let fail = true;
    renderApp("/user/dashboard?tab=orders", {
      role: "user",
      routes: {
        "GET /orders": () => (fail ? reply(500) : ordersPage([])),
      },
    });
    expect(await screen.findByText("No pudimos cargar tus pedidos")).toBeTruthy();
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(await screen.findByText("Todavía no tienes pedidos")).toBeTruthy();
  });

  it("si la cancelación falla lo informa", async () => {
    renderApp("/user/dashboard?tab=orders", {
      role: "user",
      routes: { "GET /orders": ordersPage([ORDER]), "PATCH /orders/:id/cancel": reply(500) },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar pedido" }));
    fireEvent.click(within(await screen.findByRole("dialog", { name: "Cancelar pedido" })).getByRole("button", { name: "Cancelar pedido" }));
    expect(await screen.findByText("No se pudo cancelar el pedido.")).toBeTruthy();
  });

  it("detalle: línea de tiempo, descuentos, IVA, envío pendiente y cancelar desde el detalle", async () => {
    const { http } = renderApp("/user/dashboard?tab=orders", {
      role: "user",
      routes: {
        "GET /orders": ordersPage([ORDER]),
        "GET /orders/:id": ORDER,
        "PATCH /orders/:id/cancel": { ...ORDER, status: "cancelled" },
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Ver detalle/ }));
    const dialog = await screen.findByRole("dialog", { name: /Pedido RM-0001/ });
    expect(await within(dialog).findByText("Información de envío pendiente")).toBeTruthy();
    expect(within(dialog).getByText("-$40.000")).toBeTruthy();
    expect(within(dialog).getByText("$30.400")).toBeTruthy();
    expect(within(dialog).getByText("En proceso")).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar pedido" }));
    const confirm = await screen.findByRole("dialog", { name: "Cancelar pedido" });
    fireEvent.click(within(confirm).getByRole("button", { name: "Cancelar pedido" }));
    expect(await screen.findByText("Pedido RM-0001 cancelado.")).toBeTruthy();
    expect(await screen.findByText("Este pedido fue cancelado.")).toBeTruthy();
    expect(http.calls("PATCH /orders/:id/cancel")).toHaveLength(1);
  });

  it("pedido entregado: muestra devolución aprobada y permite solicitar otra con motivo", async () => {
    let detail = DELIVERED;
    const { http } = renderApp("/user/dashboard?tab=orders", {
      role: "user",
      routes: {
        "GET /orders": ordersPage([DELIVERED]),
        "GET /orders/:id": () => detail,
        "POST /orders/:id/returns": () => {
          detail = {
            ...DELIVERED,
            returns: [
              ...DELIVERED.returns,
              { id: "r2", orderItemId: "i1", status: "rejected", reason: "No me gustó", companyResponse: "Uso indebido", adminResponse: null, reviewRequestedAt: null, canRequestReview: true, refundAmount: null, createdAt: "", resolvedAt: "" },
            ],
          };
          return { id: "r2" };
        },
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Ver detalle/ }));
    const dialog = await screen.findByRole("dialog", { name: /Pedido RM-0002/ });
    expect(await within(dialog).findByText("Reembolso acreditado en RehniCoin: $5.000")).toBeTruthy();
    expect(within(dialog).getByText("No aplica")).toBeTruthy();
    expect(within(dialog).getByText("Servientrega")).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: /Solicitar devolución/ }));
    const reason = await screen.findByLabelText(/Motivo de la devolución/);
    fireEvent.change(reason, { target: { value: "No me gustó el color, no corresponde" } });
    fireEvent.click(screen.getByRole("button", { name: /Enviar solicitud/ }));

    await waitFor(() => expect(http.calls("POST /orders/:id/returns")).toHaveLength(1));
    expect(http.calls("POST /orders/:id/returns")[0].body).toMatchObject({ orderItemId: "i1" });
    expect(await screen.findByText("Uso indebido")).toBeTruthy();
  });

  it("si el detalle no carga lo informa", async () => {
    renderApp("/user/dashboard?tab=orders", {
      role: "user",
      routes: { "GET /orders": ordersPage([ORDER]), "GET /orders/:id": apiError(404, "ORDER_NOT_FOUND", "Pedido no encontrado.") },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Ver detalle/ }));
    expect((await screen.findAllByText("Pedido no encontrado.")).length).toBeGreaterThan(0);
  });
});

describe("Comprador · RehniCoin", () => {
  const TX = [
    { id: "t1", type: "recharge", amount: "50000", description: "Recarga administrativa", createdAt: "2026-11-01T10:00:00Z" },
    { id: "t2", type: "purchase", amount: "-20000", description: null, createdAt: "2026-11-02T10:00:00Z" },
    { id: "t3", type: "refund", amount: "5000", description: "Devolución", createdAt: "2026-11-03T10:00:00Z" },
  ];

  it("muestra saldo y movimientos con signo y tipo; pagina", async () => {
    const { http } = renderApp("/user/dashboard?tab=wallet", {
      role: "user",
      routes: {
        "GET /wallet/me": { balance: "35000" },
        "GET /wallet/transactions": { items: TX, total: 25, page: 1, limit: 10, total_pages: 3 },
      },
    });
    expect(await screen.findByText("$35.000 RC")).toBeTruthy();
    expect(await screen.findByText("+$50.000 RC")).toBeTruthy();
    expect(screen.getByText("$-20.000 RC")).toBeTruthy();
    expect(screen.getByText("Reembolso")).toBeTruthy();
    expect(screen.getByText("—")).toBeTruthy();
    expect(screen.getByText("Página 1 de 3")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await waitFor(() => expect(http.calls("GET /wallet/transactions").at(-1)?.params).toEqual({ page: "2", limit: "10" }));
  });

  it("sin movimientos lo indica", async () => {
    renderApp("/user/dashboard?tab=wallet", {
      role: "user",
      routes: { "GET /wallet/me": reply(500), "GET /wallet/transactions": { items: [], total: 0, page: 1, limit: 10, total_pages: 1 } },
    });
    expect(await screen.findByText("Todavía no tienes movimientos de RehniCoin")).toBeTruthy();
  });

  const EMPTY_TX = { items: [], total: 0, page: 1, limit: 10, total_pages: 1 };

  it("recarga por WhatsApp: usa el teléfono público institucional y un mensaje sin datos de la cuenta", async () => {
    const { http } = renderApp("/user/dashboard?tab=wallet", {
      role: "user",
      routes: {
        "GET /wallet/me": { balance: "0" },
        "GET /wallet/transactions": EMPTY_TX,
        "GET /public/platform-contact": { email: null, phone: "+57 300 111 2233" },
      },
    });
    expect(await screen.findByRole("heading", { name: "¿Necesitas más RehniCoin?" })).toBeTruthy();
    const link = await screen.findByRole("link", { name: /Solicitar recarga por WhatsApp/ });
    const href = link.getAttribute("href") ?? "";

    expect(href.startsWith("https://wa.me/573001112233?text=")).toBe(true);
    expect(decodeURIComponent(href.split("?text=")[1])).toBe(
      "Hola, equipo de RehniMarket. Quiero solicitar una recarga de RehniCoin para mi cuenta. ¿Podrían indicarme cómo continuar?",
    );
    expect(href).not.toContain("rehni.test");
    expect(href).not.toContain("Cuenta");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");

    fireEvent.click(link);
    expect(http.calls("GET /wallet/me")).toHaveLength(1);
    expect(http.requests.filter((request) => request.method !== "GET")).toHaveLength(0);
  });

  it.each([
    ["sin teléfono publicado", { email: "soporte@rehni.test", phone: null }],
    ["teléfono sin indicativo internacional (ambiguo)", { email: null, phone: "3001112233" }],
  ])("%s: no muestra un enlace roto", async (_, contact) => {
    renderApp("/user/dashboard?tab=wallet", {
      role: "user",
      routes: { "GET /wallet/me": { balance: "0" }, "GET /wallet/transactions": EMPTY_TX, "GET /public/platform-contact": contact },
    });
    expect(await screen.findByText(/La solicitud por WhatsApp no está disponible/)).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Solicitar recarga por WhatsApp/ })).toBeNull();
  });
});

describe("Comprador · Favoritos", () => {
  const FAV = {
    id: "f1",
    createdAt: "2026-11-01",
    product: { id: "p1", name: "Silla", image: null, companyName: "ACME", price: "100000", finalPrice: "80000", discountEnabled: true, isActive: false },
  };

  it("lista favoritos, avisa si ya no están disponibles y permite quitarlos", async () => {
    const { http } = renderApp("/user/dashboard?tab=favorites", {
      role: "user",
      routes: { "GET /favorites": [FAV], "DELETE /favorites/:id": { message: "ok" } },
    });
    expect(await screen.findByText("Este producto ya no está disponible.")).toBeTruthy();
    expect(screen.getByText("$80.000")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Quitar de favoritos" }));
    expect(await screen.findByText("Aún no tienes favoritos")).toBeTruthy();
    expect(http.calls("DELETE /favorites/:id")[0].url).toBe("/favorites/p1");
  });

  it("error de carga con reintento", async () => {
    let calls = 0;
    renderApp("/user/dashboard?tab=favorites", {
      role: "user",
      routes: {
        "GET /favorites": () => {
          calls += 1;
          return calls <= 1 ? reply(500) : [];
        },
      },
    });
    expect(await screen.findByText("No pudimos cargar tus favoritos")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(await screen.findByText("Aún no tienes favoritos")).toBeTruthy();
  });
});
