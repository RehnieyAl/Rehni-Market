/** Formularios de gestión administrativa de una reclamación: tomar el caso (causa), contactar a la empresa
 * por correo (asunto y mensaje redactados por el administrador) y registrar una llamada telefónica. */
import { useState } from "react";

import { Button, Input, Modal, Select, Textarea } from "@/shared/components/ui";
import { ADMIN_TEXT_MAX, RETURN_SUBJECT_MAX, RETURN_TEXT_MAX, subjectError, textError } from "@/features/returns/utils/validation";
import { CALL_OUTCOME_LABEL } from "@/features/returns/utils/returnStatus";
import type { ContactChannel } from "@/features/admin/api/returnService";
import type { AdminCompanyContact, CallOutcome } from "@/features/returns/types/response";

export type AdminAction = "escalate" | "contact" | "call";

export type AdminActionPayload =
  | { action: "escalate"; reason: string }
  | { action: "contact"; channel: ContactChannel; subject: string; message: string }
  | { action: "call"; calledAt: string; outcome: CallOutcome; notes: string };

interface AdminReturnActionModalProps {
  action: AdminAction;
  company: AdminCompanyContact;
  claimReference: string;
  orderReference: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: AdminActionPayload) => void;
}

const TITLES: Record<AdminAction, string> = {
  escalate: "Tomar el caso",
  contact: "Contactar a la empresa",
  call: "Registrar llamada",
};

function nowForInput(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export default function AdminReturnActionModal({
  action,
  company,
  claimReference,
  orderReference,
  saving,
  onClose,
  onSubmit,
}: AdminReturnActionModalProps) {
  const [text, setText] = useState("");
  const [subject, setSubject] = useState(`Reclamación ${claimReference} · Pedido ${orderReference}`);
  const [channel, setChannel] = useState<ContactChannel>(company.contactEmail ? "company_contact" : "representative_account");
  const [calledAt, setCalledAt] = useState(nowForInput);
  const [outcome, setOutcome] = useState<CallOutcome>("contacted");
  const [touched, setTouched] = useState(false);

  const max = action === "escalate" ? RETURN_TEXT_MAX : ADMIN_TEXT_MAX;
  const textLabel = { escalate: "Causa de la intervención", contact: "Mensaje", call: "Observaciones" }[action];
  const errors = {
    text: textError(text, textLabel, max),
    subject: action === "contact" ? subjectError(subject) : undefined,
    calledAt: action === "call" && (!calledAt || new Date(calledAt) > new Date()) ? "Indica una fecha y hora pasadas." : undefined,
  };
  const recipient = channel === "company_contact" ? company.contactEmail : company.representativeEmail;

  const submit = () => {
    setTouched(true);
    if (errors.text || errors.subject || errors.calledAt) return;
    if (action === "escalate") onSubmit({ action, reason: text.trim() });
    if (action === "contact") onSubmit({ action, channel, subject: subject.trim(), message: text.trim() });
    if (action === "call") onSubmit({ action, calledAt: new Date(calledAt).toISOString(), outcome, notes: text.trim() });
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      busy={saving}
      size="lg"
      title={TITLES[action]}
      description={`${company.companyName} · ${claimReference} · Pedido ${orderReference}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button loading={saving} onClick={submit}>
            {action === "contact" ? "Enviar correo" : action === "call" ? "Registrar llamada" : "Tomar el caso"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {action === "escalate" && (
          <p className="text-sm text-ink-muted">
            La reclamación pasa a revisión de Rehni Market y la empresa ya no podrá decidirla. No se reembolsa nada hasta
            que registres la decisión.
          </p>
        )}

        {action === "contact" && (
          <>
            <Select
              label="Destinatario"
              value={channel}
              onChange={(event) => setChannel(event.target.value as ContactChannel)}
              hint={recipient ? `Se enviará a ${recipient}` : undefined}
            >
              <option value="company_contact" disabled={!company.contactEmail}>
                Correo de contacto de la empresa{company.contactEmail ? "" : " (no registrado)"}
              </option>
              <option value="representative_account">Correo de la cuenta del representante</option>
            </Select>
            <Input
              label="Asunto"
              required
              maxLength={RETURN_SUBJECT_MAX}
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              error={touched ? errors.subject : undefined}
            />
          </>
        )}

        {action === "call" && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Fecha y hora de la llamada"
              type="datetime-local"
              required
              value={calledAt}
              max={nowForInput()}
              onChange={(event) => setCalledAt(event.target.value)}
              error={touched ? errors.calledAt : undefined}
            />
            <Select label="Resultado" value={outcome} onChange={(event) => setOutcome(event.target.value as CallOutcome)}>
              {(Object.keys(CALL_OUTCOME_LABEL) as CallOutcome[]).map((key) => (
                <option key={key} value={key}>
                  {CALL_OUTCOME_LABEL[key]}
                </option>
              ))}
            </Select>
          </div>
        )}

        <Textarea
          label={textLabel}
          required
          rows={5}
          maxLength={max}
          value={text}
          onChange={(event) => setText(event.target.value)}
          hint={`${text.trim().length}/${max} caracteres`}
          error={touched ? errors.text : undefined}
        />
      </div>
    </Modal>
  );
}
