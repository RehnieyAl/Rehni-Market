
import { AlertTriangle, X } from "lucide-react";

interface CompanyStatusConfirmModalProps {
  isOpen: boolean;
  companyName: string;
  active: boolean;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function CompanyStatusConfirmModal({
  isOpen,
  companyName,
  active,
  loading,
  onConfirm,
  onClose,
}: CompanyStatusConfirmModalProps) {
  if (!isOpen) {
    return null;
  }

  const action = active ? "bloquear" : "desbloquear";

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
                  ? "Bloquear empresa"
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
          <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            La empresa no podrá utilizar las funciones que
            requieran estar activa.
          </p>
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
            disabled={loading}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
              active
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading
              ? "Actualizando..."
              : active
                ? "Bloquear"
                : "Desbloquear"}
          </button>
        </div>
      </div>
    </div>
  );
}

