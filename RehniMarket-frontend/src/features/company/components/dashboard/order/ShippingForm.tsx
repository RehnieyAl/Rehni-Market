import { useState } from "react";
import { Truck } from "lucide-react";

import type { ShippingCarrierResponse } from "@/features/company/types/response";

interface ShippingFormProps {
  carriers: ShippingCarrierResponse[];
  loadingCarriers: boolean;
  submitting: boolean;
  submitLabel: string;
  initialCarrierId?: string;
  initialTrackingCode?: string;
  onSubmit: (shippingCarrierId: string, trackingCode: string) => void;
}

// Formulario de transportadora + código de seguimiento (ver ALCANCE >
// Transportadoras) - se reutiliza tanto para asignar el envío la primera
// vez (transición PROCESSING -> SHIPPED, ver OrderDetailModal.tsx) como
// para corregirlo mientras el pedido sigue en SHIPPED.
export default function ShippingForm({
  carriers,
  loadingCarriers,
  submitting,
  submitLabel,
  initialCarrierId,
  initialTrackingCode,
  onSubmit,
}: ShippingFormProps) {
  const [carrierId, setCarrierId] = useState(initialCarrierId ?? "");
  const [trackingCode, setTrackingCode] = useState(initialTrackingCode ?? "");

  const isValid = carrierId !== "" && trackingCode.trim().length > 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    onSubmit(carrierId, trackingCode.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border bg-gray-50 p-4">
      <p className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
        <Truck size={16} />
        Información de envío
      </p>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-600">
          Transportadora
        </label>

        <select
          value={carrierId}
          onChange={(event) => setCarrierId(event.target.value)}
          disabled={loadingCarriers}
          required
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
        >
          <option value="" disabled>
            {loadingCarriers ? "Cargando transportadoras..." : "Selecciona una transportadora"}
          </option>

          {carriers.map((carrier) => (
            <option key={carrier.id} value={carrier.id}>
              {carrier.name}
            </option>
          ))}
        </select>

        {!loadingCarriers && carriers.length === 0 && (
          <p className="mt-1.5 text-xs text-red-600">
            No hay transportadoras activas disponibles. Contacta al administrador.
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-600">
          Código de seguimiento
        </label>

        <input
          type="text"
          value={trackingCode}
          onChange={(event) => setTrackingCode(event.target.value)}
          maxLength={80}
          required
          placeholder="Ej: 123456789"
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !isValid}
        className="w-full rounded-xl bg-[#7A1833] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#64132a] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
