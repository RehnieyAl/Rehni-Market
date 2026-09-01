import { useState } from "react";
import { Save, X } from "lucide-react";
import axios from "axios";

import { createAddress } from "../api/addressService";
import { useAlert } from "@/shared/components/alert/useAlert";
import { Button, Input, Textarea } from "@/shared/components/ui";

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
  onSaved: (address: Address) => void;
  onCancel: () => void;
  hasExistingAddresses: boolean;
}

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
        <Input
          label="Nombre de referencia"
          placeholder="Casa, Oficina, Apartamento..."
          value={form.label}
          onChange={(e) => handleChange("label", e.target.value)}
        />

        <Input
          label="Nombre completo"
          value={form.fullName}
          onChange={(e) => handleChange("fullName", e.target.value)}
        />

        <Input
          label="Teléfono"
          value={form.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
        />

        <Input
          label="Dirección"
          value={form.address}
          onChange={(e) => handleChange("address", e.target.value)}
        />

        <Input
          label="Ciudad"
          value={form.city}
          onChange={(e) => handleChange("city", e.target.value)}
        />

        <Input
          label="Departamento"
          value={form.department}
          onChange={(e) => handleChange("department", e.target.value)}
        />

        <Textarea
          className="sm:col-span-2"
          label="Indicaciones adicionales (opcional)"
          value={form.additionalInstructions}
          onChange={(e) => handleChange("additionalInstructions", e.target.value)}
          placeholder="Ej. Apartamento 302, portería azul..."
          rows={2}
          maxLength={255}
        />
      </div>

      {hasExistingAddresses && (
        <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => handleChange("isDefault", e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 accent-primary"
          />
          Dirección principal
        </label>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" leadingIcon={<X size={16} />} onClick={onCancel}>
          Cancelar
        </Button>

        <Button
          loading={saving}
          leadingIcon={<Save size={16} />}
          onClick={handleSubmit}
        >
          {saving ? "Guardando…" : "Guardar dirección"}
        </Button>
      </div>
    </div>
  );
}
