// Devoluciones de la empresa: filtros, aprobación con reembolso en RehniCoin y rechazo con motivo.
import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import Returns from "./Returns";
import { renderWithProviders } from "@/test/renderApp";
import { apiError } from "@/test/http";

const PENDING = {
  id: "r1",
  reference: "DEV-R1",
  orderId: "o1",
  orderReference: "RM-0001",
  orderItemId: "i1",
  companyId: "c1",
  companyName: "ACME",
  productName: "Silla",
  variantName: "Rojo",
  quantity: 1,
  unitPrice: "50000",
  itemSubtotal: "50000",
  reason: "Llegó rota",
  status: "pending",
  companySubject: null,
  companyResponse: null,
  reviewReason: null,
  reviewRequestedAt: null,
  escalatedAt: null,
  adminSubject: null,
  adminResponse: null,
  adminResolvedAt: null,
  decidedBy: null,
  canRequestReview: false,
  refundAmount: null,
  refundableAmount: "59500",
  buyerName: "Ana",
  buyerEmail: "ana@rehni.test",
  createdAt: "2026-11-01T10:00:00Z",
  resolvedAt: null,
};
const APPROVED = { ...PENDING, id: "r2", status: "approved", refundAmount: "59500", decidedBy: "company" };
const REJECTED = { ...PENDING, id: "r3", status: "rejected", companyResponse: "Daño por mal uso", decidedBy: "company" };
const EVENT = { actorRole: "user", actorName: "Ana", subject: null, amount: null, callOutcome: null, occurredAt: null };
const DETAIL = {
  ...PENDING,
  events: [{ ...EVENT, id: "e1", type: "requested", message: "Llegó rota", createdAt: "2026-11-01T10:00:00Z" }],
};

function page(items: unknown[], extra = {}) {
  return { items, total: items.length, page: 1, limit: 10, total_pages: 1, ...extra };
}

describe("Empresa · Devoluciones", () => {
  it("arranca en 'En revisión', filtra por pestaña y busca", async () => {
    const { http } = renderWithProviders(<Returns />, {
      routes: {
        "GET /company/dashboard/returns": (req: { params: Record<string, string> }) =>
          req.params.status === "approved" ? page([APPROVED]) : req.params.search ? page([]) : page([PENDING], { total_pages: 2 }),
      },
    });
    expect(await screen.findByText("Motivo: Llegó rota")).toBeTruthy();
    expect(http.requests[0].params).toEqual({ page: "1", limit: "10", status: "pending" });

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await waitFor(() => expect(http.requests.at(-1)?.params.page).toBe("2"));
    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));

    fireEvent.click(screen.getByRole("button", { name: "Aprobadas" }));
    expect(await screen.findByText("Aprobada")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Todas" }));
    fireEvent.change(screen.getByLabelText("Buscar devoluciones"), { target: { value: "zzz" } });
    expect(await screen.findByText("Sin resultados")).toBeTruthy();
    expect(http.requests.at(-1)?.params).toEqual({ page: "1", limit: "10", search: "zzz" });
  });

  it("aprobar muestra el importe exacto, exige confirmarlo y envía asunto y explicación", async () => {
    const { http } = renderWithProviders(<Returns />, {
      routes: {
        "GET /company/dashboard/returns": page([PENDING]),
        "GET /company/dashboard/returns/:id": DETAIL,
        "PATCH /company/dashboard/returns/:id": {
          ...APPROVED,
          events: [
            ...DETAIL.events,
            { ...EVENT, id: "e2", type: "company_approved", actorRole: "company", actorName: "ACME", message: "Confirmamos la falla.", createdAt: "2026-11-02T10:00:00Z" },
            { ...EVENT, id: "e3", type: "refunded", actorRole: "company", actorName: "ACME", message: null, amount: "59500", createdAt: "2026-11-02T10:00:00Z" },
          ],
        },
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Ver detalle/ }));
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByText("Solicitud del comprador")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: /Aprobar devolución/ }));

    const form = await screen.findByRole("dialog", { name: "Aprobar devolución" });
    expect(within(form).getByText("$59.500")).toBeTruthy();
    expect((within(form).getByLabelText(/Asunto del correo/) as HTMLInputElement).value).toBe("Tu devolución fue aprobada · RM-0001");
    fireEvent.click(within(form).getByRole("button", { name: "Aprobar y reembolsar" }));
    expect(within(form).getByText("Confirma el reembolso para continuar.")).toBeTruthy();
    expect(http.calls("PATCH /company/dashboard/returns/:id")).toHaveLength(0);

    fireEvent.change(within(form).getByLabelText(/Explicación para el comprador/), { target: { value: " Confirmamos la falla. " } });
    fireEvent.click(within(form).getByRole("checkbox"));
    fireEvent.click(within(form).getByRole("button", { name: "Aprobar y reembolsar" }));

    expect(await screen.findByText("Devolución aprobada. Se reintegraron $59.500 en RehniCoin.")).toBeTruthy();
    expect(http.calls("PATCH /company/dashboard/returns/:id")[0].body).toEqual({
      action: "approve",
      subject: "Tu devolución fue aprobada · RM-0001",
      reason: "Confirmamos la falla.",
    });
    expect(await screen.findByText("Reembolso acreditado en RehniCoin")).toBeTruthy();
  });

  it("sin IVA histórico conocido no deja aprobar", async () => {
    renderWithProviders(<Returns />, {
      routes: {
        "GET /company/dashboard/returns": page([PENDING]),
        "GET /company/dashboard/returns/:id": { ...DETAIL, refundableAmount: null },
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Ver detalle/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Aprobar devolución/ }));
    const form = await screen.findByRole("dialog", { name: "Aprobar devolución" });
    expect(within(form).getByRole("alert").textContent).toContain("No se conoce el IVA cobrado");
    expect(within(form).queryByRole("checkbox")).toBeNull();
  });

  it("rechazar exige asunto, un motivo de 5 a 500 caracteres y confirmación", async () => {
    const { http } = renderWithProviders(<Returns />, {
      routes: {
        "GET /company/dashboard/returns": page([PENDING]),
        "GET /company/dashboard/returns/:id": DETAIL,
        "PATCH /company/dashboard/returns/:id": { ...REJECTED, companySubject: "No aprobada", events: DETAIL.events },
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Ver detalle/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Rechazar devolución/ }));
    const form = await screen.findByRole("dialog", { name: "Rechazar devolución" });
    const subject = within(form).getByLabelText(/Asunto del correo/);
    fireEvent.change(subject, { target: { value: "No" } });
    fireEvent.change(within(form).getByLabelText(/Motivo del rechazo/), { target: { value: "mal" } });
    fireEvent.click(within(form).getByRole("button", { name: "Rechazar devolución" }));
    expect(within(form).getByText("El asunto debe tener al menos 5 caracteres.")).toBeTruthy();
    expect(within(form).getByText("Motivo del rechazo: escribe al menos 5 caracteres.")).toBeTruthy();
    expect((within(form).getByLabelText(/Motivo del rechazo/) as HTMLTextAreaElement).maxLength).toBe(500);
    expect(http.calls("PATCH /company/dashboard/returns/:id")).toHaveLength(0);

    fireEvent.change(subject, { target: { value: "No aprobada" } });
    fireEvent.change(within(form).getByLabelText(/Motivo del rechazo/), { target: { value: "  Daño por mal uso " } });
    fireEvent.click(within(form).getByRole("button", { name: "Rechazar devolución" }));
    expect(within(form).getByText("Confirma el rechazo para continuar.")).toBeTruthy();
    expect(http.calls("PATCH /company/dashboard/returns/:id")).toHaveLength(0);

    fireEvent.click(within(form).getByRole("checkbox", { name: /Confirmo que se rechaza esta devolución/ }));
    fireEvent.click(within(form).getByRole("button", { name: "Rechazar devolución" }));
    expect(await screen.findByText("Devolución rechazada. Le avisamos al comprador por correo.")).toBeTruthy();
    expect(http.calls("PATCH /company/dashboard/returns/:id")[0].body).toEqual({
      action: "reject",
      subject: "No aprobada",
      reason: "Daño por mal uso",
    });
    expect(await screen.findByText("Daño por mal uso")).toBeTruthy();
  });

  it("en revisión de Rehni Market la empresa ya no decide", async () => {
    renderWithProviders(<Returns />, {
      routes: {
        "GET /company/dashboard/returns": page([{ ...REJECTED, status: "under_review" }]),
        "GET /company/dashboard/returns/:id": { ...DETAIL, status: "under_review", companyResponse: "Daño por mal uso" },
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Revisión de Rehni Market" }));
    fireEvent.click(await screen.findByRole("button", { name: /Ver detalle/ }));
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByText(/El equipo de Rehni Market está revisando/)).toBeTruthy();
    expect(within(dialog).queryByRole("button", { name: /Aprobar devolución/ })).toBeNull();
  });

  it("un conflicto al decidir deja el formulario abierto y no informa éxito", async () => {
    renderWithProviders(<Returns />, {
      routes: {
        "GET /company/dashboard/returns": page([PENDING]),
        "GET /company/dashboard/returns/:id": DETAIL,
        "PATCH /company/dashboard/returns/:id": apiError(409, "RETURN_ALREADY_RESOLVED", "La devolución ya fue resuelta."),
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Ver detalle/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Aprobar devolución/ }));
    const form = await screen.findByRole("dialog", { name: "Aprobar devolución" });
    fireEvent.click(within(form).getByRole("checkbox"));
    fireEvent.click(within(form).getByRole("button", { name: "Aprobar y reembolsar" }));
    expect((await screen.findAllByText("La devolución ya fue resuelta.")).length).toBeGreaterThan(0);
    expect(screen.getByRole("dialog", { name: "Aprobar devolución" })).toBeTruthy();
    expect(screen.queryByText(/Se reintegraron/)).toBeNull();
  });

  it("vacío sin filtros", async () => {
    renderWithProviders(<Returns />, { routes: { "GET /company/dashboard/returns": page([]) } });
    await screen.findByText("Sin resultados");
    fireEvent.click(screen.getByRole("button", { name: "Todas" }));
    expect(await screen.findByText("No tienes solicitudes de devolución")).toBeTruthy();
  });

  it("sin coincidencias ofrece limpiar los filtros y vuelve a todas las solicitudes", async () => {
    const { http } = renderWithProviders(<Returns />, {
      routes: {
        "GET /company/dashboard/returns": (req: { params: Record<string, string> }) =>
          req.params.status === undefined ? page([APPROVED]) : page([]),
      },
    });
    expect(await screen.findByText("Sin resultados")).toBeTruthy();
    expect(screen.getByText("No hay solicitudes de devolución que coincidan con este filtro.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Limpiar filtros/ }));

    expect(await screen.findByText("Motivo: Llegó rota")).toBeTruthy();
    await waitFor(() => expect(http.requests.at(-1)?.params.status).toBeUndefined());
    expect(screen.getByRole("button", { name: "Todas" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("sin solicitudes no muestra 'Limpiar filtros'", async () => {
    renderWithProviders(<Returns />, {
      routes: { "GET /company/dashboard/returns": page([]) },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Todas" }));
    expect(await screen.findByText("No tienes solicitudes de devolución")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Limpiar filtros/ })).toBeNull();
  });
});
