
import { AlertTriangle, X } from "lucide-react";

interface CompanyStatusConfirmModalProps {
  isOpen: boolean;
  companyName: string;
  active: boolean;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
  // Motivo de suspensión - solo se pide/usa cuando `active` es true (se
  // va a bloquear, ver ALCANCE > Suspensión de empresa, punto 14). El
  // estado vive en el padre (Companies.tsx/CompanyDetailModal.tsx), este
  // modal es un componente controlado como el resto de sus props.
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
  if (!isOpen) {
    return null;
  }

  const action = active ? "bloquear" : "desbloquear";

  // El motivo es obligatorio solo al suspender (ver ALCANCE > punto 14:
  // "El motivo NO debe ser opcional") - desbloquear nunca lo pide.
  const reasonMissing = active && reason.trim().length === 0;
  const confirmDisabled = loading || reasonMissing;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                active ? "bg-red-100" : "bg-green-100"
              }`}
            >
              <AlertTriangle
                size={21}
                className={
                  active ? "text-red-600" : "text-green-600"
                }
              />
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">
                {active
                  ? "Suspender empresa"
                  : "Desbloquear empresa"}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mt-5 text-sm leading-6 text-gray-600">
          ¿Estás seguro de que deseas {action} la empresa{" "}
          <span className="font-semibold text-gray-900">
            {companyName}
          </span>
          ?
        </p>

        {active && (
          <>
            <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              Esta acción bloqueará el acceso de la empresa
              y podrá cancelar y reembolsar (en RehniCoins)
              los pedidos pendientes, pagados o en
              preparación que tenga.
            </p>

            <div className="mt-4">
              <label
                htmlFor="company-suspension-reason"
                className="block text-sm font-medium text-gray-700"
              >
                Motivo de suspensión{" "}
                <span className="text-red-600">*</span>
              </label>

              <textarea
                id="company-suspension-reason"
                value={reason}
                onChange={(event) =>
                  onReasonChange?.(
                    event.target.value.slice(
                      0,
                      REASON_MAX_LENGTH,
                    ),
                  )
                }
                disabled={loading}
                rows={3}
                required
                placeholder="Ej: Incumplimiento reiterado de las políticas de la plataforma."
                className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 ${
                  reasonMissing
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:border-[#7A1833] focus:ring-[#7A1833]/20"
                }`}
              />

              <p className="mt-1.5 text-xs text-gray-500">
                Este motivo se guarda en el historial y se
                le informa a la empresa por correo.
              </p>
            </div>
          </>
        )}

        {!active && (
          <p className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-green-700">
            La empresa volverá a estar disponible.
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            title={
              reasonMissing
                ? "Debes indicar el motivo de suspensión"
                : undefined
            }
            className={`rounded-xl px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
              active
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading
              ? "Actualizando..."
              : active
                ? "Suspender empresa"
                : "Desbloquear"}
          </button>
        </div>
      </div>
    </div>
  );
}

