/** El comprador pide al equipo de Rehni Market revisar el rechazo de su reclamación (una sola vez). */
import { useState } from "react";

import { Button, Modal, Textarea } from "@/shared/components/ui";
import { useAlert } from "@/shared/components/alert/useAlert";

import { requestReturnReview } from "../api/returnService";
import { RETURN_TEXT_MAX, textError } from "../utils/validation";
import type { ReturnDetail } from "../types/response";

interface RequestReviewModalProps {
  returnId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRequested: (detail: ReturnDetail) => void;
}

export default function RequestReviewModal({ returnId, isOpen, onClose, onRequested }: RequestReviewModalProps) {
  const { showAlert } = useAlert();
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);

  const error = textError(reason, "Motivo de la revisión");

  const submit = async () => {
    setTouched(true);
    if (!returnId || error) return;
    try {
      setSending(true);
      const detail = await requestReturnReview(returnId, reason.trim());
      showAlert("success", "Pediste la revisión. El equipo de Rehni Market revisará tu caso.");
      onRequested(detail);
      onClose();
    } catch (requestError) {
      console.error("Error solicitando la revisión:", requestError);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      busy={sending}
      title="Solicitar revisión"
      description="El equipo de Rehni Market revisará la decisión de la empresa. Solo puedes pedirla una vez."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={sending}>
            Enviar solicitud de revisión
          </Button>
        </>
      }
    >
      <Textarea
        label="¿Por qué no estás de acuerdo?"
        required
        rows={4}
        maxLength={RETURN_TEXT_MAX}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        onBlur={() => setTouched(true)}
        hint={`${reason.trim().length}/${RETURN_TEXT_MAX} caracteres. Cuéntanos qué pasó y qué pruebas tienes.`}
        error={touched ? error : undefined}
      />
    </Modal>
  );
}
