import { useState } from "react";

import { Modal, Button, Input, Select } from "@/shared/components/ui";
import {
  createShippingCarrier,
  updateShippingCarrier,
  type ShippingCarrierPayload,
} from "@/features/admin/api/shippingCarrierService";
import { useAlert } from "@/shared/components/alert/useAlert";

import type { ShippingCarrier } from "@/features/admin/types/response";

interface ShippingCarrierFormModalProps {
  isOpen: boolean;
  carrier: ShippingCarrier | null;
  onClose: () => void;
  onSaved: (carrier: ShippingCarrier) => void;
}

export default function ShippingCarrierFormModal({
  isOpen,
  carrier,
  onClose,
  onSaved,
}: ShippingCarrierFormModalProps) {
  const { showAlert } = useAlert();

  const [name, setName] = useState(carrier?.name ?? "");
  const [trackingUrl, setTrackingUrl] = useState(carrier?.tracking_url ?? "");
  const [isActive, setIsActive] = useState(carrier?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const nameValid = name.trim().length >= 2;
  const urlValid = trackingUrl.trim().length >= 3;
  const canSave = nameValid && urlValid && !saving;

  const handleSave = async () => {
    if (!canSave) return;

    const payload: ShippingCarrierPayload = {
      name: name.trim(),
      tracking_url: trackingUrl.trim(),
      is_active: isActive,
    };

    try {
      setSaving(true);

      const result = carrier
        ? await updateShippingCarrier(carrier.id, payload)
        : await createShippingCarrier(payload);

      showAlert(
        "success",
        carrier ? "Transportadora actualizada." : "Transportadora creada.",
      );
      onSaved(result);
    } catch (error) {
      console.error("Error guardando la transportadora:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      busy={saving}
      title={carrier ? "Editar transportadora" : "Nueva transportadora"}
      description="Catálogo global. Las empresas eligen entre las activas para sus envíos."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={saving} disabled={!canSave}>
            {carrier ? "Guardar cambios" : "Crear transportadora"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Nombre"
          value={name}
          disabled={saving}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Servientrega"
          error={name.length > 0 && !nameValid ? "Mínimo 2 caracteres." : undefined}
        />

        <Input
          label="URL de seguimiento"
          value={trackingUrl}
          disabled={saving}
          onChange={(e) => setTrackingUrl(e.target.value)}
          placeholder="https://transportadora.com/rastreo?guia={tracking}"
          hint="Usa {tracking} donde va el número de guía; si no lo incluyes, se abrirá la página tal cual."
          error={trackingUrl.length > 0 && !urlValid ? "URL inválida." : undefined}
        />

        <Select
          label="Estado"
          value={isActive ? "active" : "inactive"}
          disabled={saving}
          onChange={(e) => setIsActive(e.target.value === "active")}
        >
          <option value="active">Activa</option>
          <option value="inactive">Inactiva</option>
        </Select>
      </div>
    </Modal>
  );
}
