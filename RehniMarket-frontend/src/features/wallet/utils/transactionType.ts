import type { BadgeTone } from "@/shared/components/ui";

import type { WalletTransaction } from "../types/response";

export const WALLET_TRANSACTION_TYPE_LABEL: Record<WalletTransaction["type"], string> = {
  recharge: "Recarga",
  purchase: "Compra",
  refund: "Reembolso",
  adjustment: "Ajuste",
};

export const WALLET_TRANSACTION_TYPE_TONE: Record<WalletTransaction["type"], BadgeTone> = {
  recharge: "success",
  purchase: "neutral",
  refund: "info",
  adjustment: "warning",
};
