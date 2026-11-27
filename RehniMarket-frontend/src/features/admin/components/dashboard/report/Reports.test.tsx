// Reportes del admin: filtros, paginación, gestión del estado y suspensión de la empresa reportada.
import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import Reports from "./Reports";
import { renderWithProviders } from "@/test/renderApp";
import { reply } from "@/test/http";

const ITEM_PRODUCT = {
  id: "r1",
  targetType: "product",
  targetLabel: "Silla Roble",
  companyName: "ACME",
  reporterName: "Ana",
  reason: "Producto falso",
  status: "pending",
  createdAt: "2026-11-01T10:00:00Z",
};
const ITEM_COMPANY = { ...ITEM_PRODUCT, id: "r2", targetType: "company", targetLabel: "Beta", status: "reviewing" };
const ITEM_DONE = { ...ITEM_PRODUCT, id: "r3", targetLabel: "Mesa", status: "resolved", companyName: null };
const ITEM_REJ = { ...ITEM_PRODUCT, id: "r4", targetLabel: "Lámpara", status: "rejected" };

const DETAIL = {
  id: "r1",
  targetType: "product",
  productId: "p1",
  productName: "Silla Roble",
  companyId: "e1",
  companyName: "ACME",
  reporterId: "u1",
  reporterName: "Ana",
  reporterEmail: "ana@rehni.test",
  reason: "Producto falso",
  description: "Es una copia",
  status: "pending",
  adminResponse: null,
  resolvedByName: null,
  resolvedAt: null,
  evidences: [{ id: "ev1", url: "https://cdn.test/ev1.png" }],
  createdAt: "2026-11-01T10:00:00Z",
  updatedAt: null,
};

const COMPANY = { id: "e1", CompanyStatus: true, suspensionReason: null };

function page(items: unknown[], extra = {}) {
  return { items, total: items.length, page: 1, limit: 10, total_pages: 1, ...extra };
}

describe("Admin · Reportes (listado)", () => {
  it("muestra tipo, estado y empresa; los reportes de empresa no repiten la empresa", async () => {
    renderWithProviders(<Reports />, {
      routes: { "GET /admin/reports": page([ITEM_PRODUCT, ITEM_COMPANY, ITEM_DONE, ITEM_REJ]) },
    });
    expect(await screen.findByText("Silla Roble")).toBeTruthy();
    expect(screen.getByText("4 reportes")).toBeTruthy();
    expect(screen.getAllByText("Producto").length).toBe(3);
    expect(screen.getAllByText("Empresa").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Pendiente").length).toBe(1);
    expect(screen.getAllByText("En revisión").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Resuelto").length).toBe(1);
    expect(screen.getAllByText("Rechazado").length).toBe(1);
    expect(screen.getAllByText("—").length).toBe(2);
  });

  it("filtra por tipo, estado y búsqueda, y pagina", async () => {
    const { http } = renderWithProviders(<Reports />, {
      routes: {
        "GET /admin/reports": (req: { params: Record<string, string> }) =>
          page(req.params.page === "2" ? [ITEM_COMPANY] : [ITEM_PRODUCT], { total: 12, total_pages: 2, page: Number(req.params.page) }),
      },
    });
    await screen.findByText("Silla Roble");
    expect(screen.getByText("Página 1 de 2")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(await screen.findByText("Beta")).toBeTruthy();
    expect(screen.getByText("Página 2 de 2")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    await screen.findByText("Silla Roble");

    fireEvent.change(screen.getByLabelText("Filtrar por tipo"), { target: { value: "company" } });
    await waitFor(() => expect(http.requests.at(-1)?.params.target_type).toBe("company"));
    fireEvent.change(screen.getByLabelText("Filtrar por estado"), { target: { value: "resolved" } });
    await waitFor(() => expect(http.requests.at(-1)?.params.status).toBe("resolved"));
    fireEvent.change(screen.getByLabelText("Buscar reportes"), { target: { value: "silla" } });
    await waitFor(() =>
      expect(http.requests.at(-1)?.params).toEqual({
        page: "1",
        limit: "10",
        target_type: "company",
        status: "resolved",
        search: "silla",
      }),
    );
  });

  it("error con reintento y estado vacío", async () => {
    let fail = true;
    renderWithProviders(<Reports />, {
      routes: { "GET /admin/reports": () => (fail ? reply(500) : page([])) },
    });
    expect(await screen.findByText("No pudimos cargar los reportes")).toBeTruthy();
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(await screen.findByText("No se encontraron reportes con este filtro")).toBeTruthy();
  });
});

describe("Admin · Detalle de reporte", () => {
  async function openDetail(detail: object, extra: Record<string, unknown> = {}) {
    const result = renderWithProviders(<Reports />, {
      routes: {
        "GET /admin/reports": page([ITEM_PRODUCT]),
        "GET /admin/reports/:id": detail,
        "GET /admin/dashboard/get-company/:id": COMPANY,
        ...extra,
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Ver reporte de Silla Roble" }));
    await screen.findByText("Detalle del reporte");
    return result;
  }

  it("muestra producto, empresa, reportante, descripción y evidencias", async () => {
    await openDetail(DETAIL);
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByText("ana@rehni.test", { exact: false })).toBeTruthy();
    expect(within(dialog).getByText("Es una copia")).toBeTruthy();
    expect(within(dialog).getByAltText("Evidencia 1")).toBeTruthy();
    expect(within(dialog).getByRole("link", { name: /Ver producto/ }).getAttribute("href")).toBe("/products/p1");
    expect(await within(dialog).findByRole("button", { name: /Suspender empresa/ })).toBeTruthy();
  });

  it("marcar en revisión actualiza el estado y recarga la lista", async () => {
    const { http } = await openDetail(DETAIL, {
      "PATCH /admin/reports/:id/status": { ...DETAIL, status: "reviewing" },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Marcar en revisión" }));
    expect(await screen.findByText("Reporte marcado en revisión correctamente.")).toBeTruthy();
    expect(http.calls("PATCH /admin/reports/:id/status")[0].body).toEqual({ status: "reviewing" });
    await waitFor(() => expect(http.calls("GET /admin/reports").length).toBe(2));
  });

  it("resolver con respuesta administrativa la envía recortada", async () => {
    const { http } = await openDetail(DETAIL, {
      "PATCH /admin/reports/:id/status": {
        ...DETAIL,
        status: "resolved",
        adminResponse: "Producto retirado",
        resolvedByName: "Admin Uno",
        resolvedAt: "2026-11-02T10:00:00Z",
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Resolver" }));
    fireEvent.change(screen.getByLabelText(/Respuesta administrativa/), { target: { value: "  Producto retirado " } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar resolución" }));

    expect(await screen.findByText("Reporte resuelto correctamente.")).toBeTruthy();
    expect(http.calls("PATCH /admin/reports/:id/status")[0].body).toEqual({
      status: "resolved",
      adminResponse: "Producto retirado",
    });
    expect(screen.getByText("Este reporte está resuelto y ya no puede modificarse.")).toBeTruthy();
    expect(screen.getByText(/Por Admin Uno/)).toBeTruthy();
  });

  it("rechazar puede cancelarse antes de confirmar", async () => {
    const { http } = await openDetail(DETAIL, {
      "PATCH /admin/reports/:id/status": { ...DETAIL, status: "rejected" },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Rechazar" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(http.calls("PATCH /admin/reports/:id/status")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Rechazar" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar rechazo" }));
    expect(await screen.findByText("Reporte rechazado correctamente.")).toBeTruthy();
  });

  it("suspender la empresa reportada exige motivo e informa reembolsos", async () => {
    const { http } = await openDetail(
      { ...DETAIL, targetType: "company", productId: null, productName: null, description: null, evidences: [] },
      {
        "PATCH /admin/dashboard/company/status/:id": {
          id: "e1",
          CompanyStatus: false,
          suspensionReason: "Estafa",
          affectedOrdersCount: 1,
          totalRefunded: "50000",
        },
      },
    );
    expect(screen.getByRole("link", { name: /Ver empresa/ }).getAttribute("href")).toBe("/company/e1");
    fireEvent.click(await screen.findByRole("button", { name: /Suspender empresa/ }));

    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Motivo de suspensión/), { target: { value: " Estafa " } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Suspender empresa" }));

    expect(await screen.findByText(/Se procesaron 1 pedido y se reembolsaron \$50\.000/)).toBeTruthy();
    expect(http.calls("PATCH /admin/dashboard/company/status/:id")[0].body).toEqual({ status: false, reason: "Estafa" });
    expect(await screen.findByText("Empresa suspendida")).toBeTruthy();
    expect(screen.getByText("Motivo: Estafa")).toBeTruthy();
  });

  it("producto y empresa eliminados se indican; un fallo de carga lo informa", async () => {
    await openDetail({ ...DETAIL, productId: null, productName: null, companyId: null, companyName: null });
    expect(screen.getByText("Producto eliminado")).toBeTruthy();
    expect(screen.getByText("Empresa eliminada")).toBeTruthy();
  });

  it("si el detalle no carga muestra el estado vacío", async () => {
    renderWithProviders(<Reports />, {
      routes: { "GET /admin/reports": page([ITEM_PRODUCT]), "GET /admin/reports/:id": reply(500) },
    });
    fireEvent.click(await screen.findByText("Silla Roble"));
    expect(await screen.findByText("No se pudo cargar la información del reporte")).toBeTruthy();
    const closeButtons = screen.getAllByRole("button", { name: "Cerrar" });
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    await waitFor(() => expect(screen.queryByText("Detalle del reporte")).toBeNull());
  });
});
