import { useState } from "react";
import { Wallet2 } from "lucide-react";

import { Modal, Button, Input, Textarea } from "@/shared/components/ui";
import {
  MAX_ADMIN_RECHARGE_AMOUNT,
  MAX_ADMIN_RECHARGE_AMOUNT_LABEL,
  MAX_ADMIN_RECHARGE_MESSAGE,
} from "@/features/wallet/constants";
import { formatPrice } from "@/shared/utils/formatPrice";

import type { WalletRechargeHistoryItem } from "@/features/wallet/types/response";

interface CorrectRechargeModalProps {
  isOpen: boolean;
  recharge: WalletRechargeHistoryItem;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (newAmount: number, reason: string) => void;
}

export default function CorrectRechargeModal({
  isOpen,
  recharge,
  loading = false,
  onClose,
  onConfirm,
}: CorrectRechargeModalProps) {
  // El padre monta el modal con `key`, así que el estado nace limpio en cada apertura.
  const [newAmount, setNewAmount] = useState("");
  const [reason, setReason] = useState("");

  const originalAmount = Number(recharge.amount);
  const parsed = Number(newAmount);

  const amountFilled = newAmount.trim() !== "";
  const amountPositive = amountFilled && Number.isFinite(parsed) && parsed > 0;
  const amountOverLimit = amountPositive && parsed > MAX_ADMIN_RECHARGE_AMOUNT;
  const amountValid = amountPositive && !amountOverLimit;

  const adjustment = amountValid ? parsed - originalAmount : null;
  const reasonValid = reason.trim().length >= 3;

  const canConfirm =
    amountValid && adjustment !== null && adjustment !== 0 && reasonValid && !loading;

  const adjustmentLabel =
    adjustment === null
      ? "—"
      : `${adjustment > 0 ? "+" : "-"}${formatPrice(Math.abs(adjustment))}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Corregir recarga"
      description={`Ajusta una recarga hecha por error a ${recharge.userName}.`}
      busy={loading}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            loading={loading}
            disabled={!canConfirm}
            onClick={() => {
              if (canConfirm) onConfirm(parsed, reason.trim());
            }}
          >
            Corregir recarga
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <dl className="rounded-card border border-gray-200 bg-surface-2 p-4 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 py-1">
            <dt className="text-gray-500">Usuario</dt>
            <dd className="font-medium text-gray-900">{recharge.userName}</dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 py-1">
            <dt className="text-gray-500">Recarga original</dt>
            <dd className="font-semibold text-gray-900">
              {formatPrice(recharge.amount)} RC
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 py-1">
            <dt className="text-gray-500">Fecha de la recarga</dt>
            <dd className="text-gray-600">
              {new Date(recharge.createdAt).toLocaleString("es-CO")}
            </dd>
          </div>
        </dl>

        <Input
          label="Nueva cantidad correcta (RC)"
          type="text"
          inputMode="numeric"
          required
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          placeholder="Ej. 50000"
          leadingIcon={<Wallet2 size={16} />}
          hint={`Monto máximo de recarga: ${MAX_ADMIN_RECHARGE_AMOUNT_LABEL}`}
          error={
            amountOverLimit
              ? MAX_ADMIN_RECHARGE_MESSAGE
              : amountFilled && !amountPositive
                ? "Ingresa un número mayor que 0."
                : adjustment === 0
                  ? "La cantidad corregida es igual a la original."
                  : undefined
          }
        />

        <div className="flex items-center justify-between rounded-card border border-dashed border-gray-300 px-4 py-3 text-sm">
          <span className="text-gray-500">Ajuste que se aplicará</span>
          <span
            className={
              adjustment === null
                ? "font-semibold text-gray-400"
                : adjustment > 0
                  ? "font-semibold text-success"
                  : "font-semibold text-danger"
            }
          >
            {adjustmentLabel} {adjustment !== null && "RC"}
          </span>
        </div>

        <Textarea
          label="Motivo de la corrección"
          required
          rows={4}
          maxLength={255}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          hint="Queda registrado en el movimiento y se le informa al usuario."
          placeholder="Ej. Se recargó de más por un error de digitación…"
        />
      </div>
    </Modal>
  );
}
