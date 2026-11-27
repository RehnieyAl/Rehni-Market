/** Formulario de decisión sobre una reclamación (empresa o administración): asunto y explicación del
 * correo al comprador y confirmación explícita de la decisión (reembolso en RehniCoin o rechazo sin él). */
import { useState } from "react";
import { Check, X } from "lucide-react";

import { Button, Input, Modal, Textarea } from "@/shared/components/ui";
import { formatPrice } from "@/shared/utils/formatPrice";

import { RETURN_SUBJECT_MAX, RETURN_TEXT_MAX, subjectError, textError } from "../utils/validation";
import type { ReturnDecision } from "../types/response";

export interface DecisionValues {
  subject: string;
  message: string;
}

interface ReturnDecisionFormProps {
  isOpen: boolean;
  action: ReturnDecision;
  claimReference: string;
  orderReference: string;
  productName: string;
  refundableAmount: string | null;
  /** La empresa puede aprobar sin explicación; el administrador siempre explica su decisión. */
  messageRequiredOnApprove: boolean;
  maxMessage?: number;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: DecisionValues) => void;
}

export default function ReturnDecisionForm({
  isOpen,
  action,
  claimReference,
  orderReference,
  productName,
  refundableAmount,
  messageRequiredOnApprove,
  maxMessage = RETURN_TEXT_MAX,
  saving,
  onClose,
  onSubmit,
}: ReturnDecisionFormProps) {
  const approving = action === "approve";
  const [subject, setSubject] = useState(
    approving ? `Tu devolución fue aprobada · ${orderReference}` : `Tu devolución fue rechazada · ${orderReference}`,
  );
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [touched, setTouched] = useState(false);

  const messageRequired = !approving || messageRequiredOnApprove;
  const errors = {
    subject: subjectError(subject),
    message:
      messageRequired || message.trim()
        ? textError(message, approving ? "Explicación" : "Motivo del rechazo", maxMessage)
        : undefined,
    confirm: confirmed ? undefined : approving ? "Confirma el reembolso para continuar." : "Confirma el rechazo para continuar.",
  };
  const valid = !errors.subject && !errors.message && !errors.confirm && (!approving || refundableAmount !== null);

  const submit = () => {
    setTouched(true);
    if (valid) onSubmit({ subject: subject.trim(), message: message.trim() });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      busy={saving}
      size="lg"
      title={approving ? "Aprobar devolución" : "Rechazar devolución"}
      description={`${claimReference} · Pedido ${orderReference} · ${productName}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant={approving ? "primary" : "danger"}
            leadingIcon={approving ? <Check size={16} /> : <X size={16} />}
            loading={saving}
            onClick={submit}
          >
            {approving ? "Aprobar y reembolsar" : "Rechazar devolución"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <p className="rounded-card border border-hairline bg-surface-2 p-3 text-xs text-ink-muted">
          Rehni Market enviará este mensaje al comprador por correo, con el encabezado institucional y las referencias
          de la reclamación y del pedido.
        </p>

        <Input
          label="Asunto del correo"
          required
          maxLength={RETURN_SUBJECT_MAX}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          error={touched ? errors.subject : undefined}
        />

        <Textarea
          label={approving ? "Explicación para el comprador" : "Motivo del rechazo"}
          required={messageRequired}
          rows={5}
          maxLength={maxMessage}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          hint={`${message.trim().length}/${maxMessage} caracteres${messageRequired ? "" : " · opcional"}`}
          placeholder={
            approving
              ? "Ej. Recibimos el producto y confirmamos la falla."
              : "Ej. El producto presenta daños causados por mal uso."
          }
          error={touched ? errors.message : undefined}
        />

        {!approving && (
          <label className="flex cursor-pointer items-start gap-3 rounded-card border border-danger/30 bg-danger-bg p-4 text-sm text-ink">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-secondary"
              aria-describedby={touched && errors.confirm ? "decision-confirm-error" : undefined}
            />
            <span>
              Confirmo que se rechaza esta devolución: el comprador no recibirá reembolso y verá el motivo en su correo y
              en el detalle de la reclamación.
            </span>
          </label>
        )}

        {approving &&
          (refundableAmount === null ? (
            <p role="alert" className="rounded-card border border-danger/30 bg-danger-bg p-3 text-sm text-danger">
              No se conoce el IVA cobrado en este pedido, así que el reembolso no se puede calcular con exactitud. El
              equipo de Rehni Market debe revisarlo.
            </p>
          ) : (
            <label className="flex cursor-pointer items-start gap-3 rounded-card border border-success/30 bg-success-bg p-4 text-sm text-ink">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-secondary"
                aria-describedby={touched && errors.confirm ? "decision-confirm-error" : undefined}
              />
              <span>
                Confirmo que se reembolsarán <strong>{formatPrice(refundableAmount)}</strong> en RehniCoin al comprador,
                el valor exacto que pagó por este producto. La operación no se puede deshacer.
              </span>
            </label>
          ))}
        {touched && errors.confirm && (!approving || refundableAmount !== null) && (
          <p id="decision-confirm-error" className="text-xs text-danger">
            {errors.confirm}
          </p>
        )}
      </div>
    </Modal>
  );
}

