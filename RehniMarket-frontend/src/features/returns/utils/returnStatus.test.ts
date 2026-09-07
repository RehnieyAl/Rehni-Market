import { describe, expect, it } from "vitest";

import { canRequestItemReturn, RETURN_STATUS_LABEL } from "./returnStatus";
import type { OrderItemReturn } from "../types/response";

const existing: OrderItemReturn = {
  id: "r1",
  orderItemId: "item-1",
  status: "pending",
  reason: "x",
  companyResponse: null,
  refundAmount: null,
  createdAt: "2026-01-01",
  resolvedAt: null,
};

describe("canRequestItemReturn", () => {
  it("allows a return only for delivered orders", () => {
    expect(canRequestItemReturn("delivered", "item-2", [])).toBe(true);
    expect(canRequestItemReturn("pending", "item-2", [])).toBe(false);
    expect(canRequestItemReturn("shipped", "item-2", [])).toBe(false);
    expect(canRequestItemReturn("cancelled", "item-2", [])).toBe(false);
  });

  it("blocks a second return for an item that already has one", () => {
    expect(canRequestItemReturn("delivered", "item-1", [existing])).toBe(false);
    expect(canRequestItemReturn("delivered", "item-2", [existing])).toBe(true);
  });
});

describe("RETURN_STATUS_LABEL", () => {
  it("covers every status", () => {
    expect(RETURN_STATUS_LABEL.pending).toBe("En revisión");
    expect(RETURN_STATUS_LABEL.approved).toBe("Aprobada");
    expect(RETURN_STATUS_LABEL.rejected).toBe("Rechazada");
  });
});
