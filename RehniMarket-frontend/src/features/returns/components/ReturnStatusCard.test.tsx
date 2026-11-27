// Tarjeta de estado en el detalle del pedido y línea de tiempo de una reclamación.
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import ReturnStatusCard from "./ReturnStatusCard";
import ReturnTimeline from "./ReturnTimeline";
import { event } from "../testFixtures";
import type { OrderItemReturn } from "../types/response";

const BASE: OrderItemReturn = {
  id: "r1",
  orderItemId: "i1",
  status: "rejected",
  reason: "Llegó rota",
  companyResponse: "Mal uso",
  adminResponse: null,
  reviewRequestedAt: null,
  canRequestReview: true,
  refundAmount: null,
  createdAt: "2026-11-01T10:00:00Z",
  resolvedAt: "2026-11-02T10:00:00Z",
};

describe("Devoluciones · estado y historial", () => {
  it("un rechazo de la empresa ofrece solicitar revisión", () => {
    const onRequestReview = vi.fn();
    render(<ReturnStatusCard data={BASE} onRequestReview={onRequestReview} />);
    expect(screen.getByText("Rechazada")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Solicitar revisión/ }));
    expect(onRequestReview).toHaveBeenCalledOnce();
  });

  it("en revisión y con decisión final no ofrece revisión", () => {
    const { rerender } = render(<ReturnStatusCard data={{ ...BASE, status: "under_review", canRequestReview: false }} onRequestReview={vi.fn()} />);
    expect(screen.getByText("El equipo de Rehni Market está revisando tu caso.")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();

    rerender(<ReturnStatusCard data={{ ...BASE, status: "approved", canRequestReview: false, adminResponse: "Aprobado", refundAmount: "59500" }} />);
    expect(screen.getByText(/Reembolso acreditado en RehniCoin: \$59.500/)).toBeTruthy();
    expect(screen.getByText("Aprobado")).toBeTruthy();
  });

  it("la línea de tiempo muestra actor, asunto, monto y resultado de llamadas", () => {
    render(
      <ReturnTimeline
        events={[
          event("e1", "company_approved", { actorName: "ACME", subject: "Aprobada", message: "Confirmamos la falla" }),
          event("e2", "refunded", { amount: "59500" }),
          event("e3", "admin_call", { actorName: "Admin", callOutcome: "no_answer", occurredAt: "2026-11-03T15:00:00Z", message: "Sin respuesta" }),
        ]}
      />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("Aprobada")).toBeTruthy();
    expect(screen.getByText("$59.500")).toBeTruthy();
    expect(screen.getByText(/Resultado: No contestó/)).toBeTruthy();
  });

  it("sin eventos muestra un mensaje", () => {
    render(<ReturnTimeline events={[]} />);
    expect(screen.getByText("Aún no hay movimientos en esta reclamación.")).toBeTruthy();
  });
});
