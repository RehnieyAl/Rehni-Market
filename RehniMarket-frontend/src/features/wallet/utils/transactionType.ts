import type { WalletTransaction } from "../types/response";

// Mapa de etiqueta/color por cada WalletTransactionType, para no repetir el mapeo en cada vista.
export const WALLET_TRANSACTION_TYPE_LABEL: Record<WalletTransaction["type"], string> = {
  recharge: "Recarga",
  purchase: "Compra",
  refund: "Reembolso",
  adjustment: "Ajuste",
};

export const WALLET_TRANSACTION_TYPE_BADGE: Record<WalletTransaction["type"], string> = {
  recharge: "bg-green-100 text-green-700",
  purchase: "bg-gray-100 text-gray-700",
  refund: "bg-blue-100 text-blue-700",
  adjustment: "bg-amber-100 text-amber-700",
};
