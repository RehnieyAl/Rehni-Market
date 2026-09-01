import type { BadgeTone } from "@/components/ui/Badge";
import type { WalletTransactionType } from "@/types/wallet";

const LABELS: Record<WalletTransactionType, string> = {
  recharge: "Recarga",
  purchase: "Compra",
  refund: "Reembolso",
  adjustment: "Ajuste",
};

const TONES: Record<WalletTransactionType, BadgeTone> = {
  recharge: "success",
  purchase: "neutral",
  refund: "info",
  adjustment: "warning",
};

export function walletTransactionLabel(type: string): string {
  return LABELS[type as WalletTransactionType] ?? "Movimiento";
}

export function walletTransactionTone(type: string): BadgeTone {
  return TONES[type as WalletTransactionType] ?? "neutral";
}
