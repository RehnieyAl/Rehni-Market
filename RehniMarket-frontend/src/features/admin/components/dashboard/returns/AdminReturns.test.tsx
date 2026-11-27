// Devoluciones en administración: lista con filtros y búsqueda, detalle con contacto empresarial y correos,
// tomar el caso, decidir con reembolso confirmado, contactar a la empresa, registrar llamadas y reintentar correos.
import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import AdminReturns from "./AdminReturns";
import { renderApp, renderWithProviders } from "@/test/renderApp";
import { apiError, reply } from "@/test/http";
import { ADMIN_DETAIL, CLAIM, event } from "@/features/returns/testFixtures";

function page(items: unknown[], extra = {}) {
  return { items, total: items.length, page: 1, limit: 10, total_pages: 1, ...extra };
}

async function openDetail(routes: Record<string, unknown>) {
  const result = renderWithProviders(<AdminReturns />, {
    routes: { "GET /admin/dashboard/returns": page([CLAIM]), "GET /admin/dashboard/returns/:id": ADMIN_DETAIL, ...routes },
  });
  fireEvent.click(await screen.findByRole("button", { name: "Ver la reclamación DEV-R1" }));
  const dialog = await screen.findByRole("dialog", { name: "Reclamación DEV-R1" });
  await within(dialog).findByText("Empresa responsable");
  return { ...result, dialog };
}

describe("Admin · devoluciones", () => {
  it("lista, filtra por estado y busca por pedido, empresa o comprador", async () => {
    const { http } = renderWithProviders(<AdminReturns />, {
      routes: { "GET /admin/dashboard/returns": page([CLAIM]) },
    });
    expect(await screen.findByText(/DEV-R1 · Pedido RM-000001 · ACME · Ana/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Revisión de Rehni Market" }));
    await waitFor(() => expect(http.calls("GET /admin/dashboard/returns").at(-1)?.params.status).toBe("under_review"));
    fireEvent.change(screen.getByLabelText("Buscar devoluciones"), { target: { value: "RM-000001" } });
    await waitFor(() => expect(http.calls("GET /admin/dashboard/returns").at(-1)?.params.search).toBe("RM-000001"));
  });

  it("detalle: empresa suspendida, contacto no registrado, representante solo para admin y correo fallido", async () => {
    const { dialog } = await openDetail({});
    expect(within(dialog).getByText("Empresa suspendida")).toBeTruthy();
    expect(within(dialog).getAllByText("No registrado")).toHaveLength(2);
    expect(within(dialog).getByText("rita@acme.test · 3001112233")).toBeTruthy();
    expect(within(dialog).getByText("Falló")).toBeTruthy();
    expect(within(dialog).getByText("ConnectionError: SMTP no disponible")).toBeTruthy();
    expect(within(dialog).queryByRole("button", { name: /Aprobar y reembolsar/ })).toBeNull();
  });

  it("tomar el caso exige la causa y habilita la decisión", async () => {
    const { dialog, http } = await openDetail({
      "POST /admin/dashboard/returns/:id/escalate": { ...ADMIN_DETAIL, status: "under_review", events: [...ADMIN_DETAIL.events, event("e2", "escalated", { actorRole: "admin", message: "Empresa suspendida" })] },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: /Tomar el caso/ }));
    const form = await screen.findByRole("dialog", { name: "Tomar el caso" });
    fireEvent.click(within(form).getByRole("button", { name: "Tomar el caso" }));
    expect(within(form).getByText("Causa de la intervención: escribe al menos 5 caracteres.")).toBeTruthy();

    fireEvent.change(within(form).getByLabelText(/Causa de la intervención/), { target: { value: "Empresa suspendida" } });
    fireEvent.click(within(form).getByRole("button", { name: "Tomar el caso" }));

    await waitFor(() => expect(http.calls("POST /admin/dashboard/returns/:id/escalate")[0]?.body).toEqual({ reason: "Empresa suspendida" }));
    expect(await within(dialog).findByRole("button", { name: /Aprobar y reembolsar/ })).toBeTruthy();
    expect(within(dialog).getByText("Intervención de Rehni Market")).toBeTruthy();
  });

  it("decidir como administrador exige explicación y confirmación del reembolso", async () => {
    const underReview = { ...ADMIN_DETAIL, status: "under_review" as const };
    const { dialog, http } = await openDetail({
      "GET /admin/dashboard/returns/:id": underReview,
      "POST /admin/dashboard/returns/:id/decision": { ...underReview, status: "approved", refundAmount: "59500", refundTransactionId: "t1" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: /Aprobar y reembolsar/ }));
    const form = await screen.findByRole("dialog", { name: "Aprobar devolución" });
    fireEvent.click(within(form).getByRole("checkbox"));
    fireEvent.click(within(form).getByRole("button", { name: "Aprobar y reembolsar" }));
    expect(within(form).getByText("Explicación: escribe al menos 5 caracteres.")).toBeTruthy();

    fireEvent.change(within(form).getByLabelText(/Explicación para el comprador/), { target: { value: "La empresa está suspendida." } });
    fireEvent.click(within(form).getByRole("button", { name: "Aprobar y reembolsar" }));

    await waitFor(() => expect(http.calls("POST /admin/dashboard/returns/:id/decision")).toHaveLength(1));
    expect(http.calls("POST /admin/dashboard/returns/:id/decision")[0].body).toEqual({
      action: "approve",
      subject: "Tu devolución fue aprobada · RM-000001",
      message: "La empresa está suspendida.",
    });
    expect(await within(dialog).findByText(/\$59\.500 · pendiente de descontar en la próxima liquidación/)).toBeTruthy();
  });

  it("rechazar como administrador exige motivo y confirmación, y no reembolsa", async () => {
    const underReview = { ...ADMIN_DETAIL, status: "under_review" as const };
    const { dialog, http } = await openDetail({
      "GET /admin/dashboard/returns/:id": underReview,
      "POST /admin/dashboard/returns/:id/decision": { ...underReview, status: "rejected", adminResponse: "Mal uso comprobado." },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: /^Rechazar$/ }));
    const form = await screen.findByRole("dialog", { name: "Rechazar devolución" });
    fireEvent.change(within(form).getByLabelText(/Motivo del rechazo/), { target: { value: "Mal uso comprobado." } });
    fireEvent.click(within(form).getByRole("button", { name: "Rechazar devolución" }));
    expect(within(form).getByText("Confirma el rechazo para continuar.")).toBeTruthy();
    expect(http.calls("POST /admin/dashboard/returns/:id/decision")).toHaveLength(0);

    fireEvent.click(within(form).getByRole("checkbox", { name: /Confirmo que se rechaza/ }));
    fireEvent.click(within(form).getByRole("button", { name: "Rechazar devolución" }));

    await waitFor(() => expect(http.calls("POST /admin/dashboard/returns/:id/decision")).toHaveLength(1));
    expect(http.calls("POST /admin/dashboard/returns/:id/decision")[0].body).toEqual({
      action: "reject",
      subject: "Tu devolución fue rechazada · RM-000001",
      message: "Mal uso comprobado.",
    });
  });

  it("contactar empresa: sin correo empresarial usa la cuenta del representante; el destinatario lo resuelve la API", async () => {
    const { dialog, http } = await openDetail({
      "POST /admin/dashboard/returns/:id/contact": ADMIN_DETAIL,
    });
    fireEvent.click(within(dialog).getByRole("button", { name: /Contactar empresa/ }));
    const form = await screen.findByRole("dialog", { name: "Contactar a la empresa" });
    const channel = within(form).getByLabelText("Destinatario") as HTMLSelectElement;
    expect(channel.value).toBe("representative_account");
    expect((within(form).getByRole("option", { name: /no registrado/ }) as HTMLOptionElement).disabled).toBe(true);
    expect(within(form).getByText("Se enviará a rita@acme.test")).toBeTruthy();

    fireEvent.change(within(form).getByLabelText(/Mensaje/), { target: { value: "Por favor responde la reclamación." } });
    fireEvent.click(within(form).getByRole("button", { name: "Enviar correo" }));

    await waitFor(() => expect(http.calls("POST /admin/dashboard/returns/:id/contact")).toHaveLength(1));
    expect(http.calls("POST /admin/dashboard/returns/:id/contact")[0].body).toEqual({
      channel: "representative_account",
      subject: "Reclamación DEV-R1 · Pedido RM-000001",
      message: "Por favor responde la reclamación.",
    });
  });

  it("registrar llamada con resultado y reintentar un correo fallido", async () => {
    const accepted = { ...ADMIN_DETAIL, notifications: [{ ...ADMIN_DETAIL.notifications[0], status: "accepted", attempts: 2, lastError: null }] };
    const { dialog, http } = await openDetail({
      "POST /admin/dashboard/returns/:id/calls": ADMIN_DETAIL,
      "POST /admin/dashboard/returns/:id/notifications/:nid/retry": accepted,
    });
    fireEvent.click(within(dialog).getByRole("button", { name: /Registrar llamada/ }));
    const form = await screen.findByRole("dialog", { name: "Registrar llamada" });
    fireEvent.change(within(form).getByLabelText("Resultado"), { target: { value: "no_answer" } });
    fireEvent.change(within(form).getByLabelText(/Observaciones/), { target: { value: "Nadie contestó." } });
    fireEvent.click(within(form).getByRole("button", { name: "Registrar llamada" }));
    await waitFor(() => expect(http.calls("POST /admin/dashboard/returns/:id/calls")).toHaveLength(1));
    expect(http.calls("POST /admin/dashboard/returns/:id/calls")[0].body).toMatchObject({ outcome: "no_answer", notes: "Nadie contestó." });

    fireEvent.click(await within(dialog).findByRole("button", { name: "Reintentar el correo «Nueva solicitud de devolución»" }));
    expect(await within(dialog).findByText("Aceptado por el servidor de correo")).toBeTruthy();
  });

  it("errores: lista con reintento y conflicto al decidir", async () => {
    let fail = true;
    renderWithProviders(<AdminReturns />, {
      routes: { "GET /admin/dashboard/returns": () => (fail ? reply(500) : page([])) },
    });
    expect(await screen.findByText("No se pudieron cargar las devoluciones")).toBeTruthy();
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(await screen.findByText("Sin reclamaciones")).toBeTruthy();
  });

  it("un rechazo del administrador que choca con otra decisión muestra el motivo de la API", async () => {
    const underReview = { ...ADMIN_DETAIL, status: "under_review" as const };
    const { dialog } = await openDetail({
      "GET /admin/dashboard/returns/:id": underReview,
      "POST /admin/dashboard/returns/:id/decision": apiError(409, "RETURN_ALREADY_RESOLVED", "Esta solicitud ya fue resuelta."),
    });
    fireEvent.click(within(dialog).getByRole("button", { name: /^Rechazar$/ }));
    const form = await screen.findByRole("dialog", { name: "Rechazar devolución" });
    fireEvent.change(within(form).getByLabelText(/Motivo del rechazo/), { target: { value: "Confirmamos el rechazo." } });
    fireEvent.click(within(form).getByRole("checkbox", { name: /Confirmo que se rechaza/ }));
    fireEvent.click(within(form).getByRole("button", { name: "Rechazar devolución" }));
    expect((await screen.findAllByText("Esta solicitud ya fue resuelta.")).length).toBeGreaterThan(0);
  });

  it.each(["admin", "owner"] as const)("el rol %s ve Devoluciones en su menú", async (role) => {
    renderApp("/admin/dashboard?tab=returns", { role, routes: { "GET /admin/dashboard/returns": page([]) } });
    expect(await screen.findByRole("heading", { name: "Devoluciones" })).toBeTruthy();
  });
});
