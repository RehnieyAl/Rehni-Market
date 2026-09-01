import type { Order } from "./order";

export interface CheckoutRequest {
  addressId?: string;
}

export interface CheckoutSummary {
  orders: Order[];
  subtotal: string;
  tax: string;
  total: string;
  walletBalance: string;
}
