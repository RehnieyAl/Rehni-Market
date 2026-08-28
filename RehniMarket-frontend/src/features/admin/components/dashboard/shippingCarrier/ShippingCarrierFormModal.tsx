import { useState } from "react";
import { X, Save } from "lucide-react";

import type { AdminShippingCarrierResponse } from "@/features/admin/types/response";

interface ShippingCarrierFormModalProps {
  isOpen: boolean;
  carrier: AdminShippingCarrierResponse | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (name: string, trackingUrl: string, isActive: boolean) => void;
}

// El padre monta este componente con una `key` distinta cada vez que se
// abre (ver ShippingCarriers.tsx), así que el valor inicial de useState
// ya llega "fresco" en cada apertura sin necesitar un efecto para
// resetearlo (mismo patrón que ColorFormModal.tsx).
export default function ShippingCarrierFormModal({
  isOpen,
  carrier,
  loading,
  onClose,
  onSubmit,
}: ShippingCarrierFormModalProps) {
  const [name, setName] = useState(carrier?.name ?? "");
  const [trackingUrl, setTrackingUrl] = useState(carrier?.tracking_url ?? "");
  const [isActive, setIsActive] = useState(carrier?.is_active ?? true);

  const isEditing = carrier !== null;

  if (!isOpen) return null;

  const isValid = name.trim().length >= 2 && trackingUrl.trim().length >= 3;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!isValid) return;

    onSubmit(name.trim(), trackingUrl.trim(), isActive);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Editar transportadora" : "Nueva transportadora"}
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

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Nombre de la transportadora
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={80}
                required
                autoFocus
                placeholder="Ej: Servientrega"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                URL de seguimiento
              </label>

              <input
                type="url"
                value={trackingUrl}
                onChange={(event) => setTrackingUrl(event.target.value)}
                minLength={3}
                maxLength={255}
                required
                placeholder="https://www.servientrega.com/rastreo"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
              />

              <p className="mt-1.5 text-xs text-gray-400">
                Enlace público de seguimiento de la transportadora - el usuario lo usará para
                rastrear su pedido.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Estado</label>

              <button
                type="button"
                onClick={() => setIsActive((current) => !current)}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-gray-200 bg-gray-50 text-gray-500"
                }`}
              >
                {isActive ? "Activa" : "Inactiva"}
              </button>
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
              type="submit"
              disabled={loading || !isValid}
              className="flex items-center gap-2 rounded-xl bg-[#7A1833] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#64132a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} />
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
