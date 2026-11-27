// "Mis devoluciones" del comprador: lista con estado y reembolso, detalle con respuestas e historial,
// solicitud de revisión una sola vez, estados de carga y error, y el botón de revisión en el pedido.
import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import Returns from "./Returns";
import { renderApp, renderWithProviders } from "@/test/renderApp";
import { apiError, reply } from "@/test/http";
import { CLAIM, REJECTED_DETAIL, event } from "@/features/returns/testFixtures";

function page(items: unknown[], extra = {}) {
  return { items, total: items.length, page: 1, limit: 10, total_pages: 1, ...extra };
}

const APPROVED = { ...CLAIM, id: "r2", reference: "DEV-R2", productName: "Mesa", status: "approved", refundAmount: "59500", decidedBy: "company" };

describe("Comprador · Mis devoluciones", () => {
  it("lista sus reclamaciones con estado, empresa y reembolso", async () => {
    renderWithProviders(<Returns />, { routes: { "GET /returns": page([{ ...REJECTED_DETAIL }, APPROVED]) } });
    const items = await screen.findAllByRole("listitem");

    expect(within(items[0]).getByText("Rechazada")).toBeTruthy();
    expect(within(items[0]).getByText(/Pedido RM-000001 · ACME/)).toBeTruthy();
    expect(within(items[0]).getByText("Puedes solicitar una revisión")).toBeTruthy();
    expect(within(items[1]).getByText("Reembolsado: $59.500 en RehniCoin")).toBeTruthy();
  });

  it("detalle con motivo de rechazo e historial; pedir revisión valida y actualiza el estado", async () => {
    const { http } = renderWithProviders(<Returns />, {
      routes: {
        "GET /returns": page([REJECTED_DETAIL]),
        "GET /returns/:id": REJECTED_DETAIL,
        "POST /returns/:id/review": {
          ...REJECTED_DETAIL,
          status: "under_review",
          canRequestReview: false,
          reviewReason: "Tengo fotos del empaque",
          events: [...REJECTED_DETAIL.events, event("e3", "review_requested", { message: "Tengo fotos del empaque" })],
        },
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Ver la devolución de Silla/ }));
    const dialog = await screen.findByRole("dialog", { name: "Devolución DEV-R1" });
    expect(await within(dialog).findByText("Motivo del rechazo de la empresa")).toBeTruthy();
    expect(within(dialog).getAllByText("Señales de mal uso").length).toBeGreaterThan(1);
    expect(within(dialog).getByText("La empresa rechazó")).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: /Solicitar revisión/ }));
    const review = await screen.findByRole("dialog", { name: "Solicitar revisión" });
    fireEvent.click(within(review).getByRole("button", { name: "Enviar solicitud de revisión" }));
    expect(within(review).getByText("Motivo de la revisión: escribe al menos 5 caracteres.")).toBeTruthy();
    expect(http.calls("POST /returns/:id/review")).toHaveLength(0);

    fireEvent.change(within(review).getByLabelText(/¿Por qué no estás de acuerdo\?/), { target: { value: " Tengo fotos del empaque " } });
    fireEvent.click(within(review).getByRole("button", { name: "Enviar solicitud de revisión" }));

    await waitFor(() => expect(http.calls("POST /returns/:id/review")[0]?.body).toEqual({ reason: "Tengo fotos del empaque" }));
    expect(await within(dialog).findByText("Revisión de Rehni Market")).toBeTruthy();
    expect(within(dialog).getByText("El comprador pidió revisión")).toBeTruthy();
    expect(within(dialog).queryByRole("button", { name: /Solicitar revisión/ })).toBeNull();
  });

  it("una revisión ya pedida responde el error de la API sin cerrar el formulario", async () => {
    renderWithProviders(<Returns />, {
      routes: {
        "GET /returns": page([REJECTED_DETAIL]),
        "GET /returns/:id": REJECTED_DETAIL,
        "POST /returns/:id/review": apiError(409, "RETURN_REVIEW_NOT_ALLOWED", "Solo puedes pedir una revisión, una vez."),
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Ver la devolución/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Solicitar revisión/ }));
    const review = await screen.findByRole("dialog", { name: "Solicitar revisión" });
    fireEvent.change(within(review).getByLabelText(/¿Por qué no estás de acuerdo\?/), { target: { value: "No es justo" } });
    fireEvent.click(within(review).getByRole("button", { name: "Enviar solicitud de revisión" }));
    expect((await screen.findAllByText("Solo puedes pedir una revisión, una vez.")).length).toBeGreaterThan(0);
    expect(screen.getByRole("dialog", { name: "Solicitar revisión" })).toBeTruthy();
  });

  it("vacío, error con reintento y aprobada por Rehni Market", async () => {
    let fail = true;
    const { unmount } = renderWithProviders(<Returns />, {
      routes: { "GET /returns": () => (fail ? reply(500) : page([])) },
    });
    expect(await screen.findByText("No pudimos cargar tus devoluciones")).toBeTruthy();
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(await screen.findByText("No tienes solicitudes de devolución")).toBeTruthy();
    unmount();

    const byAdmin = {
      ...APPROVED,
      decidedBy: "admin",
      companyResponse: "Señales de mal uso",
      adminSubject: "Reembolso aprobado",
      adminResponse: "Rehni Market aprueba tu devolución.",
      events: [event("e1", "requested")],
    };
    renderWithProviders(<Returns />, { routes: { "GET /returns": page([byAdmin]), "GET /returns/:id": byAdmin } });
    fireEvent.click(await screen.findByRole("button", { name: /Ver la devolución de Mesa/ }));
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByText("Decisión de Rehni Market")).toBeTruthy();
    expect(within(dialog).getByText("Motivo del rechazo de la empresa")).toBeTruthy();
    expect(within(dialog).getByText(/Reembolso acreditado en tu billetera RehniCoin: \$59.500/)).toBeTruthy();
  });

  it("la sección aparece en el panel del comprador", async () => {
    renderApp("/user/dashboard?tab=returns", { role: "user", routes: { "GET /returns": page([]) } });
    expect(await screen.findByRole("heading", { name: "Mis devoluciones" })).toBeTruthy();
  });
});
