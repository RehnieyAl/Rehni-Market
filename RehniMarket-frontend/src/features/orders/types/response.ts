// Espejo de OrderStatusEnum (backend > app/models/ModelOrder.py). El
// valor real que viaja en la API es el .value del enum de Python
// (minúsculas), no el nombre del enum.
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
  // Precio FINAL (con descuento ya aplicado) - lo que realmente se pagó.
  unitPrice: string;
  // Precio ANTES del descuento (snapshot del momento de la compra) -
  // null cuando no había descuento activo entonces, o en pedidos de
  // antes de que existiera este campo (ver backend >
  // OrderItemResponse.originalUnitPrice). Nunca inferir un descuento a
  // partir del precio actual del producto.
  originalUnitPrice: string | null;
  quantity: number;
  subtotal: string;
}

// Snapshot minimo de la direccion de entrega (ver backend >
// SchemaOrder.py > OrderAddressResponse).
// Snapshot de la dirección de entrega GUARDADO EN EL PEDIDO (ver backend
// > ModelOrder.py > Order.delivery_* y SchemaOrder.py >
// OrderAddressResponse) - no cambia aunque el comprador edite/elimine la
// dirección original después.
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
  // Numero de referencia amigable ("RM-000001") - usar esto en vez de
  // `id` en cualquier lugar visible para el usuario/empresa (ver
  // ALCANCE > Refactor Pedidos Empresa, punto 5).
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

// Contadores para las pestañas de "Pedidos" del dashboard de empresa
// (ver backend > SchemaOrder.py > OrderStatusCountsResponse). Ya vienen
// agrupados por pestaña, no por OrderStatus crudo.
export interface OrderStatusCounts {
  all: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}
