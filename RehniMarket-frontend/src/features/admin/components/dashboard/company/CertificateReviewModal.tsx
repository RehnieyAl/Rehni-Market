import { useState } from "react";
import { Ban, FileWarning } from "lucide-react";

import { Modal, Button, Textarea } from "@/shared/components/ui";
import { cn } from "@/shared/utils/cn";

export type CertificateReviewDecision = "rejected" | "needs_update";

interface CertificateReviewModalProps {
  isOpen: boolean;
  companyName?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (decision: CertificateReviewDecision, reason: string) => void;
}

const OPTIONS: {
  value: CertificateReviewDecision;
  icon: typeof Ban;
  title: string;
  description: string;
}[] = [
  {
    value: "rejected",
    icon: Ban,
    title: "Rechazar",
    description:
      "La empresa queda rechazada y no podrá operar. No podrá subir otro certificado por su cuenta: solo un administrador podrá reactivarla.",
  },
  {
    value: "needs_update",
    icon: FileWarning,
    title: "Certificado inválido — Solicitar actualización",
    description:
      "El certificado presentado no es válido (ilegible, vencido, incorrecto). La empresa podrá subir uno nuevo y volverá a revisión.",
  },
];

export default function CertificateReviewModal({
  isOpen,
  companyName,
  loading = false,
  onClose,
  onConfirm,
}: CertificateReviewModalProps) {
  // El padre monta este componente con `key` al abrir, así que el estado nace limpio
  // en cada apertura (sin efectos de reinicio).
  const [decision, setDecision] = useState<CertificateReviewDecision | null>(null);
  const [reason, setReason] = useState("");

  const reasonValid = reason.trim().length > 0;
  const canConfirm = decision !== null && reasonValid && !loading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Revisar certificado"
      description={
        companyName
          ? `Selecciona una acción para ${companyName}.`
          : "Selecciona una acción."
      }
      busy={loading}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            loading={loading}
            disabled={!canConfirm}
            onClick={() => {
              if (decision && reasonValid) onConfirm(decision, reason.trim());
            }}
          >
            Confirmar
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-gray-700">
            ¿Qué deseas hacer con este certificado?
          </legend>

          {OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = decision === option.value;

            return (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-card border p-4 transition",
                  selected
                    ? "border-danger bg-danger-bg"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                )}
              >
                <input
                  type="radio"
                  name="certificate-review-decision"
                  value={option.value}
                  checked={selected}
                  disabled={loading}
                  onChange={() => setDecision(option.value)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-control",
                    selected ? "bg-danger/15 text-danger" : "bg-gray-100 text-gray-500",
                  )}
                >
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-sm font-semibold",
                      selected ? "text-danger" : "text-gray-900",
                    )}
                  >
                    {option.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-gray-500">
                    {option.description}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>

        <Textarea
          label="Motivo"
          required
          rows={5}
          maxLength={1000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          hint="Este motivo será mostrado a la empresa."
          placeholder={
            decision === "rejected"
              ? "Explica por qué se rechaza a la empresa…"
              : decision === "needs_update"
                ? "Explica qué problema tiene el certificado presentado…"
                : "Escribe el motivo…"
          }
        />
      </div>
    </Modal>
  );
}
