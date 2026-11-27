// Gestión de empresas del admin: filtros por certificado, paginación y suspensión con motivo.
import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import Companies from "./Companies";
import { renderWithProviders } from "@/test/renderApp";
import { reply } from "@/test/http";

const ACME = {
  id: "e1",
  nameCompany: "ACME S.A.S",
  CompanyNIT: "900123456",
  CompanyNITDV: "7",
  CompanyLogo: null,
  CompanyBanner: null,
  CompanyCertificate: "https://cdn.test/cert.pdf",
  CompanyCertificateStatus: "approved",
  CompanyStatus: true,
  suspensionReason: null,
  rejectionReason: null,
  addressCompany: "Calle 1",
  user_id: "user-1",
  created_at: "2026-01-01T00:00:00Z",
};
const BETA = { ...ACME, id: "e2", nameCompany: "Beta", CompanyCertificateStatus: "pending", CompanyStatus: false, addressCompany: "", CompanyLogo: "https://cdn.test/l.png" };
const GAMMA = { ...ACME, id: "e3", nameCompany: "Gamma", CompanyCertificateStatus: "rejected" };
const DELTA = { ...ACME, id: "e4", nameCompany: "Delta", CompanyCertificateStatus: "needs_update" };

function page(items: unknown[], extra = {}) {
  return { items, next_cursor: null, has_next: false, ...extra };
}

describe("Admin · Empresas", () => {
  it("lista empresas con NIT, estado de certificado y dirección por defecto", async () => {
    renderWithProviders(<Companies />, {
      routes: { "GET /admin/dashboard/get-companies": page([ACME, BETA, GAMMA, DELTA]) },
    });

    expect(await screen.findByText("ACME S.A.S")).toBeTruthy();
    expect(screen.getAllByText("900123456-7").length).toBe(4);
    expect(screen.getByText("No registrada")).toBeTruthy();
    expect(screen.getByText("Aprobado")).toBeTruthy();
    expect(screen.getByText("Pendiente")).toBeTruthy();
    expect(screen.getByText("Rechazado")).toBeTruthy();
    expect(screen.getAllByText("Certificado inválido").length).toBeGreaterThan(0);
    expect(screen.getByText("Bloqueada")).toBeTruthy();
    expect(screen.getByText("4 empresas")).toBeTruthy();
  });

  it("filtra por certificado, busca y pagina con historial de cursores", async () => {
    const { http } = renderWithProviders(<Companies />, {
      routes: {
        "GET /admin/dashboard/get-companies": (req: { params: Record<string, string> }) =>
          req.params.cursor === "c2" ? page([BETA], { next_cursor: "c3", has_next: true }) : page([ACME], { next_cursor: "c2", has_next: true }),
      },
    });
    await screen.findByText("ACME S.A.S");

    fireEvent.change(screen.getByLabelText("Filtrar por certificado"), { target: { value: "pending" } });
    await waitFor(() => expect(http.requests.at(-1)?.params.status).toBe("pending"));
    expect(screen.getAllByText("Pendientes").length).toBeGreaterThan(1);

    for (const [value, label] of [["needs_update", "Certificado inválido"], ["rejected", "Rechazadas"], ["approved", "Aprobadas"]]) {
      fireEvent.change(screen.getByLabelText("Filtrar por certificado"), { target: { value } });
      await waitFor(() => expect(http.requests.at(-1)?.params.status).toBe(value));
      expect(screen.getAllByText(label).length).toBeGreaterThan(1);
    }

    fireEvent.change(screen.getByLabelText("Buscar empresas"), { target: { value: "900" } });
    await waitFor(() => expect(http.requests.at(-1)?.params.search).toBe("900"));
    await screen.findByText("ACME S.A.S");

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(await screen.findByText("Beta")).toBeTruthy();
    expect(http.requests.at(-1)?.params.cursor).toBe("c2");

    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(await screen.findByText("ACME S.A.S")).toBeTruthy();
    expect(http.requests.at(-1)?.params.cursor).toBeUndefined();
  });

  it("vacío con filtro y error con reintento", async () => {
    let fail = true;
    renderWithProviders(<Companies />, {
      routes: { "GET /admin/dashboard/get-companies": () => (fail ? reply(500) : page([])) },
    });
    expect(await screen.findByText("No pudimos cargar las empresas")).toBeTruthy();
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(await screen.findByText("No se encontraron empresas con este filtro")).toBeTruthy();
  });

  it("suspender exige motivo e informa los pedidos reembolsados", async () => {
    const { http } = renderWithProviders(<Companies />, {
      routes: {
        "GET /admin/dashboard/get-companies": page([ACME]),
        "PATCH /admin/dashboard/company/status/:id": {
          CompanyStatus: false,
          suspensionReason: "Fraude",
          affectedOrdersCount: 2,
          totalRefunded: "150000",
        },
      },
    });

    fireEvent.click(await screen.findByRole("button", { name: "Bloquear ACME S.A.S" }));
    const dialog = await screen.findByRole("dialog");
    const confirm = within(dialog).getByRole("button", { name: "Suspender empresa" }) as HTMLButtonElement;
    expect(within(dialog).getByText("Indica el motivo de la suspensión.")).toBeTruthy();
    expect(confirm.disabled).toBe(true);

    fireEvent.change(within(dialog).getByLabelText(/Motivo de suspensión/), { target: { value: "  Fraude  " } });
    expect(confirm.disabled).toBe(false);
    fireEvent.click(confirm);

    expect(await screen.findByText(/Se procesaron 2 pedidos y se reembolsaron \$150\.000 en RehniCoins/)).toBeTruthy();
    expect(http.calls("PATCH /admin/dashboard/company/status/:id")[0].body).toEqual({ status: false, reason: "Fraude" });
    expect(await screen.findByRole("button", { name: "Desbloquear ACME S.A.S" })).toBeTruthy();
  });

  it("suspender sin pedidos pendientes y desbloquear muestran su mensaje", async () => {
    let active = true;
    const { http } = renderWithProviders(<Companies />, {
      routes: {
        "GET /admin/dashboard/get-companies": page([ACME]),
        "PATCH /admin/dashboard/company/status/:id": () => {
          active = !active;
          return { CompanyStatus: active, suspensionReason: active ? null : "x", affectedOrdersCount: 0, totalRefunded: "0" };
        },
      },
    });

    fireEvent.click(await screen.findByRole("button", { name: "Bloquear ACME S.A.S" }));
    let dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Motivo de suspensión/), { target: { value: "x" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Suspender empresa" }));
    expect(await screen.findByText(/No había pedidos pendientes de reembolso/)).toBeTruthy();

    fireEvent.click(await screen.findByRole("button", { name: "Desbloquear ACME S.A.S" }));
    dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("La empresa volverá a estar disponible.")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Desbloquear" }));
    expect(await screen.findByText("Empresa desbloqueada correctamente.")).toBeTruthy();
    expect(http.calls("PATCH /admin/dashboard/company/status/:id")[1].body).toEqual({ status: true });
  });

  it("abre el detalle de la empresa", async () => {
    renderWithProviders(<Companies />, {
      routes: {
        "GET /admin/dashboard/get-companies": page([ACME]),
        "GET /admin/dashboard/get-company/:id": ACME,
        "GET /admin/dashboard/get-user/:id": { id: "user-1", fullName: "Rep", email: "rep@acme.test", tell: "1", profileImagen: null, role: "company", isActive: true, created_at: "2026-01-01T00:00:00Z" },
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Ver ACME S.A.S" }));
    expect(await screen.findByText("Detalle de empresa")).toBeTruthy();
  });
});
