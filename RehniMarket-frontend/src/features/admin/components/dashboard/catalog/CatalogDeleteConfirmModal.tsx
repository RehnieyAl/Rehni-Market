import { AlertTriangle, X } from "lucide-react";

interface CatalogDeleteConfirmModalProps {
  isOpen: boolean;
  catalogName: string;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function CatalogDeleteConfirmModal({
  isOpen,
  catalogName,
  loading,
  onConfirm,
  onClose,
}: CatalogDeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Eliminar catálogo
          </h2>
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
              <h3 className="font-semibold text-gray-900">
                ¿Eliminar este catálogo?
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Estás a punto de eliminar{" "}
                <span className="font-semibold text-gray-900">
                  {catalogName}
                </span>
                . Si tiene atributos asociados, también se eliminarán.
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
            {loading ? "Eliminando..." : "Eliminar catálogo"}
          </button>
        </div>
      </div>
    </div>
  );
}
