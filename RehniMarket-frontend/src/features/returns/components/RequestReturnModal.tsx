import { useState } from "react";
import axios from "axios";

import { Modal, Button, Textarea } from "@/shared/components/ui";
import { useAlert } from "@/shared/components/alert/useAlert";
import { ErrorCode } from "@/shared/types/ErrorCode";

import { requestReturn } from "../api/returnService";

interface RequestReturnModalProps {
  orderId: string;
  item: { id: string; productName: string; variantName: string | null } | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

const MIN_REASON = 5;

export default function RequestReturnModal({
  orderId,
  item,
  isOpen,
  onClose,
  onSubmitted,
}: RequestReturnModalProps) {
  const { showAlert } = useAlert();

  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const trimmed = reason.trim();
  const canSubmit = trimmed.length >= MIN_REASON && !submitting;

  const handleSubmit = async () => {
    if (!item || !canSubmit) return;

    try {
      setSubmitting(true);
      await requestReturn(orderId, { orderItemId: item.id, reason: trimmed });
      showAlert("success", "Solicitud de devolución enviada. La empresa la revisará.");
      onSubmitted();
      onClose();
    } catch (error) {
      const detail = axios.isAxiosError(error) ? error.response?.data?.detail : undefined;

      const message =
        detail?.code === ErrorCode.RETURN_ALREADY_REQUESTED
          ? "Ya existe una solicitud de devolución activa para este producto."
          : detail?.code === ErrorCode.RETURN_NOT_ELIGIBLE
            ? "Solo puedes solicitar la devolución de un pedido que ya fue entregado."
            : detail?.message;

      showAlert("error", message ?? "No se pudo enviar la solicitud de devolución.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Solicitar devolución"
      description={
        item
          ? `${item.productName}${item.variantName ? ` · ${item.variantName}` : ""}`
          : undefined
      }
      busy={submitting}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={submitting} disabled={!canSubmit}>
            Enviar solicitud
          </Button>
        </>
      }
    >
      <Textarea
        label="Motivo de la devolución"
        required
        rows={4}
        maxLength={500}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Cuéntale a la empresa por qué quieres devolver este producto."
        hint={`Mínimo ${MIN_REASON} caracteres. La empresa verá este mensaje.`}
        error={
          reason.length > 0 && trimmed.length < MIN_REASON
            ? "Describe el motivo con un poco más de detalle."
            : undefined
        }
      />

      <p className="mt-3 text-xs text-gray-500">
        La empresa revisará tu solicitud. Si la aprueba, se te reintegrará el valor del
        producto en RehniCoin.
      </p>
    </Modal>
  );
}
