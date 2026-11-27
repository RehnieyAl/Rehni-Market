/** Datos de prueba de reclamaciones de devolución compartidos por las pruebas de comprador y administración. */
import type { AdminReturnDetail, ReturnDetail, ReturnEvent, ReturnRequest } from "./types/response";

export const CLAIM: ReturnRequest = {
  id: "r1",
  reference: "DEV-R1",
  orderId: "o1",
  orderReference: "RM-000001",
  orderItemId: "i1",
  companyId: "c1",
  companyName: "ACME",
  productName: "Silla",
  variantName: "Roja",
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

export function event(id: string, type: ReturnEvent["type"], extra: Partial<ReturnEvent> = {}): ReturnEvent {
  return {
    id,
    type,
    actorRole: "user",
    actorName: "Ana",
    subject: null,
    message: null,
    amount: null,
    callOutcome: null,
    occurredAt: null,
    createdAt: "2026-11-01T10:00:00Z",
    ...extra,
  };
}

export const REJECTED_DETAIL: ReturnDetail = {
  ...CLAIM,
  status: "rejected",
  companySubject: "No aprobada",
  companyResponse: "Señales de mal uso",
  decidedBy: "company",
  canRequestReview: true,
  events: [event("e1", "requested", { message: "Llegó rota" }), event("e2", "company_rejected", { actorRole: "company", actorName: "ACME", message: "Señales de mal uso" })],
};

export const ADMIN_DETAIL: AdminReturnDetail = {
  ...CLAIM,
  events: [event("e1", "requested", { message: "Llegó rota" })],
  company: {
    companyId: "c1",
    companyName: "ACME",
    nit: "900123456-7",
    companyActive: false,
    contactEmail: null,
    contactPhone: null,
    representativeName: "Rita Representante",
    representativeEmail: "rita@acme.test",
    representativePhone: "3001112233",
  },
  notifications: [
    {
      id: "n1",
      kind: "new_request",
      recipientRole: "company",
      recipientEmail: "rita@acme.test",
      subject: "Nueva solicitud de devolución",
      message: "Llegó rota",
      status: "failed",
      attempts: 1,
      lastError: "ConnectionError: SMTP no disponible",
      createdAt: "2026-11-01T10:00:00Z",
      sentAt: null,
    },
  ],
  refundTransactionId: null,
  payoutAdjustmentId: null,
};
