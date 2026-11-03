import { useState } from "react";
import axios from "axios";

import { Modal, Button, Textarea } from "@/shared/components/ui";
import { useAlert } from "@/shared/components/alert/useAlert";
import { ErrorCode } from "@/shared/types/ErrorCode";
import {
  RETURN_REASON_MAX,
  RETURN_REASON_MIN,
  returnRequestSchema,
  useFormValidation,
} from "@/shared/validation";

import { requestReturn } from "../api/returnService";

interface RequestReturnModalProps {
  orderId: string;
  item: { id: string; productName: string; variantName: string | null } | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

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

  const { errors, isValid, errorFor, touch } = useFormValidation(returnRequestSchema, { reason });

  const trimmed = reason.trim();
  const canSubmit = isValid && !submitting;

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
        maxLength={RETURN_REASON_MAX}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        onBlur={() => touch("reason")}
        placeholder="Cuéntale a la empresa por qué quieres devolver este producto."
        hint={`Mínimo ${RETURN_REASON_MIN} caracteres. La empresa verá este mensaje.`}
        // Se avisa desde que empieza a escribir, o al salir del campo.
        error={errorFor("reason") ?? (reason.length > 0 ? errors.reason : undefined)}
      />

      <p className="mt-3 text-xs text-gray-500">
        La empresa revisará tu solicitud. Si la aprueba, se te reintegrará el valor del
        producto en RehniCoin.
      </p>
    </Modal>
  );
}
