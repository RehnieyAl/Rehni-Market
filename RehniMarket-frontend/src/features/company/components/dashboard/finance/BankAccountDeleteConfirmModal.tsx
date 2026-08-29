import { AlertTriangle, X } from "lucide-react";

interface BankAccountDeleteConfirmModalProps {
  isOpen: boolean;
  bankName: string;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

// El backend puede rechazar el borrado (BANK_ACCOUNT_IN_USE); ese mensaje lo muestra BankAccountsList vía useAlert.
export default function BankAccountDeleteConfirmModal({
  isOpen,
  bankName,
  loading,
  onConfirm,
  onClose,
}: BankAccountDeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">Eliminar cuenta bancaria</h2>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle size={22} />
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">¿Eliminar esta cuenta?</h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Estás a punto de eliminar{" "}
                <span className="font-semibold text-gray-900">{bankName}</span>.
              </p>

              <p className="mt-3 text-sm font-medium text-red-600">
                Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Eliminando..." : "Eliminar cuenta"}
          </button>
        </div>
      </div>
    </div>
  );
}
