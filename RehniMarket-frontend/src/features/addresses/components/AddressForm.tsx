import { useState } from "react";
import axios from "axios";

import { createAddress } from "../api/addressService";
import { useAlert } from "@/shared/components/alert/useAlert";

import type { Address } from "../types/response";

const EMPTY_FORM = {
  label: "",
  fullName: "",
  department: "",
  city: "",
  address: "",
  phone: "",
  additionalInstructions: "",
  isDefault: false,
};

interface AddressFormProps {
  // Se llama con la dirección recién creada - tanto
  // AddressSelectionModal.tsx (selecciona y vuelve al listado) como
  // Addresses.tsx (refresca su propio listado) reaccionan distinto, por
  // eso no se resuelve acá.
  onSaved: (address: Address) => void;
  onCancel: () => void;
  hasExistingAddresses: boolean;
}

// Formulario "Nueva dirección" (ver ALCANCE > Modal de direcciones) -
// componente único reutilizado por AddressSelectionModal.tsx (durante la
// compra) y por la pantalla "Direcciones" del dashboard, para no
// mantener dos formularios con campos distintos.
//
// `country` NO es un campo del formulario (Rehni Market solo opera en
// Colombia, mismo criterio que ya usaba la pantalla de direcciones del
// dashboard) - se envía fijo. Omitirlo del payload es exactamente lo que
// causaba el 422 original en POST /addresses (ver informe: el backend
// exige `country`, ver CreateAddressRequest en SchemaAddress.py).
export default function AddressForm({ onSaved, onCancel, hasExistingAddresses }: AddressFormProps) {
  const { showAlert } = useAlert();

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof typeof EMPTY_FORM, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (
      !form.label.trim() ||
      !form.fullName.trim() ||
      !form.department.trim() ||
      !form.city.trim() ||
      !form.address.trim() ||
      !form.phone.trim()
    ) {
      showAlert("error", "Completa nombre de referencia, nombre completo, departamento, ciudad, dirección y teléfono.");
      return;
    }

    try {
      setSaving(true);

      const created = await createAddress({
        label: form.label.trim(),
        fullName: form.fullName.trim(),
        country: "Colombia",
        department: form.department.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        additionalInstructions: form.additionalInstructions.trim() || undefined,
        // La primera dirección de un usuario ya queda predeterminada
        // automáticamente en el backend (ver
        // AddressService.create_address_service) - este checkbox solo
        // importa cuando ya existe al menos una.
        isDefault: form.isDefault,
      });

      showAlert("success", "Dirección guardada.");
      onSaved(created);
    } catch (error) {
      console.error("Error creando dirección:", error);

      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail?.message
        : undefined;

      showAlert("error", message ?? "No se pudo guardar la dirección.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nombre de referencia"
          placeholder="Casa, Oficina, Apartamento..."
          value={form.label}
          onChange={(v) => handleChange("label", v)}
        />

        <Field
          label="Nombre completo"
          value={form.fullName}
          onChange={(v) => handleChange("fullName", v)}
        />

        <Field label="Teléfono" value={form.phone} onChange={(v) => handleChange("phone", v)} />

        <Field
          label="Dirección"
          value={form.address}
          onChange={(v) => handleChange("address", v)}
        />

        <Field label="Ciudad" value={form.city} onChange={(v) => handleChange("city", v)} />

        <Field
          label="Departamento"
          value={form.department}
          onChange={(v) => handleChange("department", v)}
        />

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm text-gray-700">
            Indicaciones adicionales (opcional)
          </label>

          <textarea
            value={form.additionalInstructions}
            onChange={(e) => handleChange("additionalInstructions", e.target.value)}
            placeholder="Ej. Apartamento 302, portería azul..."
            rows={2}
            maxLength={255}
            className="w-full resize-none rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-red-500"
          />
        </div>
      </div>

      {hasExistingAddresses && (
        <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => handleChange("isDefault", e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 accent-red-700"
          />
          Dirección principal
        </label>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={onCancel}
          className="rounded-xl border px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="rounded-xl bg-red-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar dirección"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-gray-700">{label}</label>

      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-red-500"
      />
    </div>
  );
}
