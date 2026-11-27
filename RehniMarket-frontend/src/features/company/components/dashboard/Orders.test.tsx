// Pedidos de la empresa: pestañas por estado, búsqueda, avance de estado y datos de envío.
import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import Orders from "./Orders";
import { renderWithProviders } from "@/test/renderApp";
import { apiError, reply } from "@/test/http";

const ORDER = {
  id: "o1",
  reference: "RM-0001",
  status: "pending",
  companyId: "e1",
  companyName: "ACME",
  subtotal: "100000",
  tax: "19000",
  total: "119000",
  createdAt: "2026-11-01T10:00:00Z",
  items: [
    { id: "i1", productId: "p1", variantId: "v1", productName: "Silla", variantName: "Rojo", attributes: { Color: "Rojo", Talla: "" }, unitPrice: "50000", originalUnitPrice: null, quantity: 2, subtotal: "100000" },
    { id: "i2", productId: "p2", variantId: null, productName: "Cojín", variantName: null, attributes: null, unitPrice: "0", originalUnitPrice: null, quantity: 1, subtotal: "0" },
  ],
  firstItemName: "Silla",
  totalItems: 3,
  buyerName: "ana",
  buyerEmail: "ana@rehni.test",
  buyerPhoto: null,
  buyerPhone: "3001112233",
  deliveryAddress: { label: "Casa", fullName: "Ana", department: "Valle", city: "Cali", address: "Calle 1", phone: "300" },
  shippingCarrier: null,
  trackingNumber: null,
  returns: [],
};
const SHIPPED = {
  ...ORDER,
  id: "o2",
  reference: "RM-0002",
  status: "shipped",
  tax: "0",
  buyerPhoto: "https://cdn.test/b.png",
  buyerPhone: null,
  deliveryAddress: null,
  shippingCarrier: { id: "s1", name: "Servientrega", trackingUrl: "https://servi.co/?g={tracking}" },
  trackingNumber: "G 123",
};
const COUNTS = { all: 5, pending: 1, inProgress: 2, completed: 1, cancelled: 1 };
const CARRIERS = [{ id: "s1", name: "Servientrega" }, { id: "s2", name: "Envía" }];

function page(items: unknown[], extra = {}) {
  return { items, total: items.length, page: 1, limit: 10, total_pages: 1, ...extra };
}

describe("Empresa · Pedidos", () => {
  it("pestañas con contadores; 'En proceso' pide los dos estados y la búsqueda se envía", async () => {
    const { http } = renderWithProviders(<Orders />, {
      routes: {
        "GET /company/dashboard/orders/status-counts": COUNTS,
        "GET /company/dashboard/orders": (req: { params: Record<string, unknown> }) =>
          req.params.search === "zzz" ? page([]) : page([ORDER, SHIPPED], { total_pages: 2 }),
      },
    });
    expect(await screen.findByRole("button", { name: "Todos (5)" })).toBeTruthy();
    expect(await screen.findByText("RM-0001", { exact: false })).toBeTruthy();
    expect(screen.getByText("Pendiente")).toBeTruthy();
    expect(screen.getByText("Enviado")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await waitFor(() => expect(http.calls("GET /company/dashboard/orders").at(-1)?.params.page).toBe("2"));
    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));

    fireEvent.click(screen.getByRole("button", { name: "En proceso (2)" }));
    await waitFor(() =>
      expect(http.calls("GET /company/dashboard/orders").at(-1)?.params.status).toEqual(["processing", "shipped"]),
    );

    fireEvent.change(screen.getByLabelText("Buscar pedidos"), { target: { value: "zzz" } });
    expect(await screen.findByText("Sin resultados")).toBeTruthy();
  });

  it("sin pedidos explica que aparecerán al recibirlos", async () => {
    renderWithProviders(<Orders />, {
      routes: { "GET /company/dashboard/orders/status-counts": COUNTS, "GET /company/dashboard/orders": page([]) },
    });
    expect(await screen.findByText("Aún no has recibido pedidos")).toBeTruthy();
  });

  it("detalle: comprador, dirección, ítems con atributos, IVA y avance a 'En preparación'", async () => {
    const { http } = renderWithProviders(<Orders />, {
      routes: {
        "GET /company/dashboard/orders/status-counts": COUNTS,
        "GET /company/dashboard/orders": page([ORDER]),
        "GET /company/dashboard/orders/:id": ORDER,
        "GET /company/dashboard/shipping-carriers": CARRIERS,
        "PATCH /company/dashboard/orders/:id/status": { ...ORDER, status: "processing" },
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Ver detalle/ }));
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByText("3001112233")).toBeTruthy();
    expect(within(dialog).getByText(/Calle 1, Cali,/)).toBeTruthy();
    expect(within(dialog).getByText("Color: Rojo")).toBeTruthy();
    expect(within(dialog).getByText("$19.000")).toBeTruthy();
    expect(within(dialog).getByRole("link", { name: "Ver la tienda de ACME" }).getAttribute("href")).toBe("/company/e1");

    fireEvent.click(within(dialog).getByRole("button", { name: "Iniciar procesamiento" }));
    expect(await screen.findByText('Pedido RM-0001 actualizado a "En preparación".')).toBeTruthy();
    expect(http.calls("PATCH /company/dashboard/orders/:id/status")[0].body).toEqual({ status: "processing" });
    expect(await within(dialog).findByRole("button", { name: "Marcar enviado" })).toBeTruthy();
  });

  it("registrar envío exige transportadora y guía y envía el número recortado", async () => {
    const { http } = renderWithProviders(<Orders />, {
      routes: {
        "GET /company/dashboard/orders/status-counts": COUNTS,
        "GET /company/dashboard/orders": page([ORDER]),
        "GET /company/dashboard/orders/:id": ORDER,
        "GET /company/dashboard/shipping-carriers": CARRIERS,
        "PATCH /company/dashboard/orders/:id/shipping": { ...ORDER, shippingCarrier: SHIPPED.shippingCarrier, trackingNumber: "G-1" },
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Ver detalle/ }));
    const dialog = await screen.findByRole("dialog");
    const save = await within(dialog).findByRole("button", { name: /Guardar información de envío/ });
    expect((save as HTMLButtonElement).disabled).toBe(true);

    await within(dialog).findByRole("option", { name: "Envía" });
    fireEvent.change(within(dialog).getByLabelText(/Transportadora/), { target: { value: "s1" } });
    fireEvent.change(within(dialog).getByLabelText(/Número de guía/), { target: { value: " G-1 " } });
    fireEvent.click(save);

    expect(await screen.findByText("Información de envío guardada para el pedido RM-0001.")).toBeTruthy();
    expect(http.calls("PATCH /company/dashboard/orders/:id/shipping")[0].body).toEqual({
      shippingCarrierId: "s1",
      trackingNumber: "G-1",
    });
    expect(await within(dialog).findByRole("button", { name: /Editar envío/ })).toBeTruthy();
  });

  it("pedido enviado: muestra el enlace de rastreo, permite editar/cancelar y sin IVA dice 'No aplica'", async () => {
    renderWithProviders(<Orders />, {
      routes: {
        "GET /company/dashboard/orders/status-counts": COUNTS,
        "GET /company/dashboard/orders": page([SHIPPED]),
        "GET /company/dashboard/orders/:id": SHIPPED,
        "GET /company/dashboard/shipping-carriers": reply(500),
        "PATCH /company/dashboard/orders/:id/status": apiError(409, "INVALID_TRANSITION", "Transición no permitida."),
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Ver detalle/ }));
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByText("No aplica")).toBeTruthy();
    const link = within(dialog).getAllByRole("link").find((a) => a.getAttribute("href")?.includes("servi.co"));
    expect(link?.getAttribute("href")).toBe("https://servi.co/?g=G%20123");

    fireEvent.click(within(dialog).getByRole("button", { name: /Editar envío/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(within(dialog).getByRole("button", { name: /Editar envío/ })).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: "Marcar entregado" }));
    expect((await screen.findAllByText("Transición no permitida.")).length).toBeGreaterThan(0);
  });

  it("si el detalle no carga avisa con el mensaje por defecto", async () => {
    renderWithProviders(<Orders />, {
      routes: {
        "GET /company/dashboard/orders/status-counts": reply(500),
        "GET /company/dashboard/orders": page([ORDER]),
        "GET /company/dashboard/orders/:id": reply(500),
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Ver detalle/ }));
    expect(await screen.findByText("No se pudo cargar el detalle del pedido.")).toBeTruthy();
  });
});
