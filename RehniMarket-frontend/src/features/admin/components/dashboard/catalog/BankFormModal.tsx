/** Formulario de banco para administración (registrar o editar): nombre, estado y logo con vista previa. */
import { useEffect, useState, type FormEvent } from "react";
import { ImagePlus, Save } from "lucide-react";
import axios from "axios";

import BankLogo from "@/features/payouts/components/BankLogo";
import { Button, Input, Modal } from "@/shared/components/ui";
import { useAlert } from "@/shared/components/alert/useAlert";
import { FILE_ACCEPT, validateFile } from "@/shared/validation/files";
import { createBank, updateBank, type BankFormPayload } from "@/features/admin/api/bankService";

import type { AdminBank } from "@/features/payouts/types/response";

interface BankFormModalProps {
  isOpen: boolean;
  bank: AdminBank | null;
  onSaved: () => void;
  onClose: () => void;
}

export default function BankFormModal({ isOpen, bank, onSaved, onClose }: BankFormModalProps) {
  const { showAlert } = useAlert();
  const editing = bank !== null;

  const [name, setName] = useState(bank?.name ?? "");
  const [isActive, setIsActive] = useState(bank?.isActive ?? true);
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  // La vista previa es una URL blob: se libera al cambiarla o al cerrar el formulario.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const handleLogo = (input: HTMLInputElement) => {
    const file = input.files?.[0];
    if (!file) return;
    const error = validateFile(file, "image", "Logo del banco");
    if (error) {
      input.value = "";
      showAlert("error", error);
      return;
    }
    setLogo(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanName = name.split(/\s+/).filter(Boolean).join(" ");
    if (cleanName.length < 2) {
      setNameError("Escribe el nombre del banco (mínimo 2 caracteres).");
      return;
    }

    const payload: BankFormPayload = editing
      ? {
          name: cleanName !== bank.name ? cleanName : undefined,
          isActive: isActive !== bank.isActive ? isActive : undefined,
          logo,
        }
      : { name: cleanName, isActive, logo };

    try {
      setSaving(true);
      if (editing) await updateBank(bank.id, payload);
      else await createBank(payload);
      showAlert("success", editing ? "Banco actualizado." : "Banco registrado.");
      onSaved();
    } catch (error) {
      console.error("Error guardando el banco:", error);
      const message = axios.isAxiosError(error) ? error.response?.data?.detail?.message : undefined;
      if (message) setNameError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      busy={saving}
      title={editing ? "Editar banco" : "Registrar banco"}
      description="Los bancos activos aparecen al registrar las cuentas de las empresas."
      footer={
        <div className="flex w-full justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="bank-form" loading={saving} leadingIcon={<Save size={16} />}>
            Guardar banco
          </Button>
        </div>
      }
    >
      <form id="bank-form" noValidate onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Nombre"
          required
          value={name}
          maxLength={100}
          onChange={(event) => {
            setName(event.target.value);
            setNameError(undefined);
          }}
          placeholder="Nombre oficial del banco"
          error={nameError}
        />

        <div className="flex items-center gap-4">
          <BankLogo src={preview ?? bank?.logoUrl} name={name || "Banco"} />
          <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-control border border-hairline bg-surface-2 px-4 text-sm font-medium text-ink transition hover:bg-surface-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-secondary">
            <ImagePlus size={16} aria-hidden="true" />
            {bank?.logoUrl || preview ? "Reemplazar logo" : "Subir logo"}
            <input type="file" accept={FILE_ACCEPT.image} className="sr-only" onChange={(event) => handleLogo(event.currentTarget)} />
          </label>
          <span className="text-xs text-ink-muted">PNG, JPG o WebP, máximo 5 MB. Opcional.</span>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 accent-secondary"
          />
          Activo (disponible para nuevas cuentas)
        </label>
      </form>
    </Modal>
  );
}
