// Espejo de OrderStatusEnum; en la API viaja el .value (minúsculas).
export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  // Precio final ya con descuento: lo que se pagó.
  unitPrice: string;
  // Precio antes del descuento, snapshot al comprar. null si no había descuento.
  originalUnitPrice: string | null;
  quantity: number;
  subtotal: string;
}

// Snapshot de la dirección guardado en el pedido; no cambia si el comprador la edita después.
export interface OrderAddress {
  label: string | null;
  fullName: string;
  department: string;
  city: string;
  address: string;
  phone: string;
}

export interface Order {
  id: string;
  // Referencia legible ("RM-000001"); usar esto, no `id`, en cualquier vista.
  reference: string;
  status: OrderStatus;
  companyId: string;
  companyName: string;
  subtotal: string;
  tax: string;
  total: string;
  createdAt: string;
  items: OrderItem[];
  firstItemName: string | null;
  totalItems: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhoto: string | null;
  buyerPhone: string | null;
  deliveryAddress: OrderAddress | null;
}

export interface OrdersPaginated {
  items: Order[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Contadores para las pestañas de "Pedidos", ya agrupados por pestaña.
export interface OrderStatusCounts {
  all: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}
