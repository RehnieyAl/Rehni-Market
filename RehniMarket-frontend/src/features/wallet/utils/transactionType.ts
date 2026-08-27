import type { WalletTransaction } from "../types/response";

// Mismo criterio que features/orders/utils/orderStatus.ts: mapa de
// etiqueta/color legible por cada valor real de WalletTransactionType
// (ver ModelWallet.py, backend - única fuente de verdad de estos 4
// valores) para no repetir este switch/mapeo en cada vista que liste
// movimientos de la billetera.
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
