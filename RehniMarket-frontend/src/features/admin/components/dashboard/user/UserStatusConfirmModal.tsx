import {
  X,
  Lock,
  Unlock,
  AlertTriangle,
} from "lucide-react";

interface UserStatusConfirmModalProps {
  isOpen: boolean;
  userName: string;
  active: boolean;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function UserStatusConfirmModal({
  isOpen,
  userName,
  active,
  loading,
  onConfirm,
  onClose,
}: UserStatusConfirmModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">

        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">

          <div>

            <h2 className="text-xl font-semibold text-gray-900">
              {active
                ? "Bloquear usuario"
                : "Desbloquear usuario"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Confirma esta acción antes de continuar.
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>

        </div>

        <div className="px-6 py-6">

          <div className="flex items-start gap-4 rounded-xl border border-gray-200 p-4">

            {/* Icono */}

            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                active
                  ? "bg-red-100 text-red-600"
                  : "bg-green-100 text-green-600"
              }`}
            >
              {active ? (
                <Lock size={21} />
              ) : (
                <Unlock size={21} />
              )}
            </div>

            {/* Información */}

            <div>

              <p className="font-semibold text-gray-900">
                {userName}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {active
                  ? "El usuario perderá el acceso a su cuenta hasta que sea desbloqueado."
                  : "El usuario podrá volver a acceder a su cuenta."}
              </p>

            </div>

          </div>

          {active && (
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-yellow-50 p-4 text-yellow-800">

              <AlertTriangle
                size={19}
                className="mt-0.5 shrink-0"
              />

              <p className="text-sm">
                Al bloquear este usuario no podrá
                iniciar sesión mientras permanezca
                bloqueado.
              </p>

            </div>
          )}

        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-5">

          {/* Cancelar */}

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>

          {/* Confirmar */}

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              active
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >

            {active ? (
              <Lock size={18} />
            ) : (
              <Unlock size={18} />
            )}

            {loading
              ? "Actualizando..."
              : active
                ? "Bloquear usuario"
                : "Desbloquear usuario"}

          </button>

        </div>

      </div>

    </div>
  );
}