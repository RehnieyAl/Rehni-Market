/** Tipos de reclamaciones de devolución (comprador, empresa y administración) tal como los devuelve la API. */
export type ReturnStatus = "pending" | "under_review" | "approved" | "rejected";

export type ReturnEventType =
  | "requested"
  | "company_approved"
  | "company_rejected"
  | "refunded"
  | "review_requested"
  | "escalated"
  | "admin_approved"
  | "admin_rejected"
  | "admin_email"
  | "admin_call";

export type CallOutcome = "contacted" | "no_answer" | "wrong_number" | "callback_requested";

/** Reclamación (listas, panel de empresa y respuesta al crear). */
export interface ReturnRequest {
  id: string;
  reference: string;
  orderId: string;
  orderReference: string;
  orderItemId: string;
  companyId: string;
  companyName: string;
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: string;
  itemSubtotal: string;
  reason: string;
  status: ReturnStatus;
  companySubject: string | null;
  companyResponse: string | null;
  reviewReason: string | null;
  reviewRequestedAt: string | null;
  escalatedAt: string | null;
  adminSubject: string | null;
  adminResponse: string | null;
  adminResolvedAt: string | null;
  decidedBy: "company" | "admin" | null;
  canRequestReview: boolean;
  refundAmount: string | null;
  /** Lo que se reembolsaría al aprobar; null si el IVA histórico del pedido no se conoce. */
  refundableAmount: string | null;
  buyerName: string;
  buyerEmail: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface ReturnEvent {
  id: string;
  type: ReturnEventType;
  actorRole: string;
  actorName: string | null;
  subject: string | null;
  message: string | null;
  amount: string | null;
  callOutcome: CallOutcome | null;
  occurredAt: string | null;
  createdAt: string;
}

export interface ReturnDetail extends ReturnRequest {
  events: ReturnEvent[];
}

export type NotificationStatus = "pending" | "sending" | "accepted" | "failed";

export interface ReturnNotification {
  id: string;
  kind: string;
  recipientRole: string;
  recipientEmail: string;
  subject: string;
  message: string | null;
  status: NotificationStatus;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  sentAt: string | null;
}

export interface AdminCompanyContact {
  companyId: string;
  companyName: string;
  nit: string;
  companyActive: boolean;
  contactEmail: string | null;
  contactPhone: string | null;
  representativeName: string;
  representativeEmail: string;
  representativePhone: string | null;
}

export interface AdminReturnDetail extends ReturnDetail {
  company: AdminCompanyContact;
  notifications: ReturnNotification[];
  refundTransactionId: string | null;
  payoutAdjustmentId: string | null;
}

export interface ReturnsPaginated {
  items: ReturnRequest[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

/** Estado de devolución embebido en el detalle de un pedido (Order.returns). */
export interface OrderItemReturn {
  id: string;
  orderItemId: string;
  status: ReturnStatus;
  reason: string;
  companyResponse: string | null;
  adminResponse: string | null;
  reviewRequestedAt: string | null;
  canRequestReview: boolean;
  refundAmount: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export type ReturnDecision = "approve" | "reject";
