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
  attributes: Record<string, string> | null;
  unitPrice: string;
  originalUnitPrice: string | null;
  quantity: number;
  subtotal: string;
}

export interface OrderAddress {
  label: string | null;
  fullName: string;
  department: string;
  city: string;
  address: string;
  phone: string;
}

export interface OrderShippingCarrier {
  id: string;
  name: string;
  trackingUrl: string;
}

export interface Order {
  id: string;
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

  shippingCarrier: OrderShippingCarrier | null;
  trackingNumber: string | null;
}

export interface OrdersPaginated {
  items: Order[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface OrderStatusCounts {
  all: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}
