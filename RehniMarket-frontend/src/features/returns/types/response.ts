export type ReturnStatus = "pending" | "approved" | "rejected";

/** Devolución completa (panel de empresa y respuesta al crear). */
export interface ReturnRequest {
  id: string;
  orderId: string;
  orderReference: string;
  orderItemId: string;
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: string;
  itemSubtotal: string;
  reason: string;
  status: ReturnStatus;
  companyResponse: string | null;
  refundAmount: string | null;
  buyerName: string;
  buyerEmail: string;
  createdAt: string;
  resolvedAt: string | null;
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
  refundAmount: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export type ReturnDecision = "approve" | "reject";
