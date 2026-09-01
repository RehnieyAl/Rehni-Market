import { Ban, RotateCcw } from "lucide-react";

import ConfirmModal from "@/shared/components/ConfirmModal";
import { Textarea } from "@/shared/components/ui";

interface CompanyStatusConfirmModalProps {
  isOpen: boolean;
  companyName: string;
  active: boolean;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
  reason?: string;
  onReasonChange?: (value: string) => void;
}

const REASON_MAX_LENGTH = 500;

export default function CompanyStatusConfirmModal({
  isOpen,
  companyName,
  active,
  loading,
  onConfirm,
  onClose,
  reason = "",
  onReasonChange,
}: CompanyStatusConfirmModalProps) {
  const reasonMissing = active && reason.trim().length === 0;

  return (
    <ConfirmModal
      isOpen={isOpen}
      tone={active ? "danger" : "success"}
      icon={active ? <Ban size={22} /> : <RotateCcw size={22} />}
      title={active ? "Suspender empresa" : "Desbloquear empresa"}
      confirmLabel={active ? "Suspender empresa" : "Desbloquear"}
      loading={loading}
      confirmDisabled={reasonMissing}
      onConfirm={onConfirm}
      onClose={onClose}
      message={
        <div className="space-y-3">
          <p>
            {active ? "¿Suspender la empresa " : "¿Desbloquear la empresa "}
            <span className="font-semibold text-gray-900">{companyName}</span>?
          </p>

          {active ? (
            <>
              <p className="rounded-control bg-danger-bg p-3 text-danger">
                Se bloqueará el acceso de la empresa y podrá cancelar y reembolsar
                (en RehniCoins) los pedidos pendientes, pagados o en preparación.
              </p>

              <Textarea
                label="Motivo de suspensión"
                required
                rows={3}
                value={reason}
                disabled={loading}
                placeholder="Ej: Incumplimiento reiterado de las políticas de la plataforma."
                hint="Se guarda en el historial y se le informa a la empresa por correo."
                error={reasonMissing ? "Indica el motivo de la suspensión." : undefined}
                onChange={(event) =>
                  onReasonChange?.(event.target.value.slice(0, REASON_MAX_LENGTH))
                }
              />
            </>
          ) : (
            <p className="rounded-control bg-success-bg p-3 text-success">
              La empresa volverá a estar disponible.
            </p>
          )}
        </div>
      }
    />
  );
}
