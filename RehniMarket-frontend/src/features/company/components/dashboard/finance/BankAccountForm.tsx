/** Formulario de cuenta bancaria de la empresa (crear o editar): banco del catálogo con su logo, tipo, número,
 * titular y documento. Al editar solo se envía lo que cambió y el número se conserva si se deja vacío. */
import { useEffect, useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import axios from "axios";

import BankLogo from "@/features/payouts/components/BankLogo";
import { Button, Input, Modal, Select } from "@/shared/components/ui";
import { useAlert } from "@/shared/components/alert/useAlert";
import {
  createBankAccount,
  getAvailableBanks,
  updateBankAccount,
  type BankAccountFormPayload,
} from "@/features/company/api/bankAccountService";
import { BANK_ACCOUNT_TYPE_OPTIONS } from "@/features/payouts/utils/payoutStatus";

import type { BankAccount, BankAccountType, BankOption } from "@/features/payouts/types/response";

interface BankAccountFormProps {
  isOpen: boolean;
  account: BankAccount | null;
  hasExistingAccounts: boolean;
  onSaved: (account: BankAccount) => void;
  onClose: () => void;
}

interface FormValues {
  accountHolder: string;
  documentNumber: string;
  bankId: string;
  accountType: BankAccountType;
  accountNumber: string;
  isDefault: boolean;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

function initialValues(account: BankAccount | null): FormValues {
  return {
    accountHolder: account?.accountHolder ?? "",
    documentNumber: account?.documentNumber ?? "",
    bankId: account?.bankId ?? "",
    accountType: account?.accountType ?? "savings",
    accountNumber: "",
    isDefault: account?.isDefault ?? false,
  };
}

function validate(values: FormValues, editing: boolean): FormErrors {
  const errors: FormErrors = {};
  if (values.accountHolder.trim().length < 2) errors.accountHolder = "Escribe el titular de la cuenta.";
  if (values.documentNumber.trim().length < 4) errors.documentNumber = "El documento debe tener al menos 4 caracteres.";
  if (!editing && !values.bankId) errors.bankId = "Selecciona el banco.";
  const number = values.accountNumber.trim();
  if ((!editing || number) && !/^\d{4,40}$/.test(number)) {
    errors.accountNumber = "El número debe tener solo dígitos (entre 4 y 40).";
  }
  return errors;
}

/** Payload de edición: solo los campos que cambiaron respecto a la cuenta guardada. */
function changedFields(account: BankAccount, values: FormValues): Partial<BankAccountFormPayload> {
  const payload: Partial<BankAccountFormPayload> = {};
  if (values.accountHolder.trim() !== account.accountHolder) payload.accountHolder = values.accountHolder.trim();
  if (values.documentNumber.trim() !== account.documentNumber) payload.documentNumber = values.documentNumber.trim();
  if (values.bankId && values.bankId !== account.bankId) payload.bankId = values.bankId;
  if (values.accountType !== account.accountType) payload.accountType = values.accountType;
  if (values.accountNumber.trim()) payload.accountNumber = values.accountNumber.trim();
  if (values.isDefault && !account.isDefault) payload.isDefault = true;
  return payload;
}

export default function BankAccountForm({ isOpen, account, hasExistingAccounts, onSaved, onClose }: BankAccountFormProps) {
  const { showAlert } = useAlert();
  const editing = account !== null;

  const [values, setValues] = useState<FormValues>(() => initialValues(account));
  const [errors, setErrors] = useState<FormErrors>({});
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [banksFailed, setBanksFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    getAvailableBanks()
      .then((data) => {
        if (!cancelled) setBanks(data);
      })
      .catch((error) => {
        console.error("Error cargando el catálogo de bancos:", error);
        if (!cancelled) setBanksFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const selectedBank = banks.find((bank) => bank.id === values.bankId);
  // Una cuenta puede estar enlazada a un banco ya desactivado: se muestra pero no se ofrece para cuentas nuevas.
  const currentBankInactive = editing && account.bankId !== null && values.bankId === account.bankId && !selectedBank;

  const set = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validate(values, editing);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      setSaving(true);
      let saved: BankAccount;

      if (editing) {
        saved = await updateBankAccount(account.id, changedFields(account, values));
      } else {
        saved = await createBankAccount({
          accountHolder: values.accountHolder.trim(),
          documentNumber: values.documentNumber.trim(),
          bankId: values.bankId,
          accountType: values.accountType,
          accountNumber: values.accountNumber.trim(),
          isDefault: values.isDefault,
        });
      }

      showAlert("success", editing ? "Cuenta bancaria actualizada." : "Cuenta bancaria guardada.");
      onSaved(saved);
    } catch (error) {
      console.error("Error guardando cuenta bancaria:", error);
      const message = axios.isAxiosError(error) ? error.response?.data?.detail?.message : undefined;
      showAlert("error", message ?? "No se pudo guardar la cuenta bancaria.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      busy={saving}
      size="lg"
      title={editing ? "Editar cuenta bancaria" : "Nueva cuenta bancaria"}
      description="Cuenta donde recibes el giro neto de tus liquidaciones."
      footer={
        <div className="flex w-full justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="bank-account-form" loading={saving} leadingIcon={<Save size={16} />}>
            Guardar cuenta
          </Button>
        </div>
      }
    >
      <form id="bank-account-form" noValidate onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-end gap-3 sm:col-span-2">
          <BankLogo
            src={selectedBank?.logoUrl ?? (currentBankInactive ? account?.bankLogoUrl : null)}
            name={selectedBank?.name ?? account?.bankName ?? "Banco"}
          />
          <Select
            className="min-w-0 flex-1"
            label="Banco"
            required={!editing}
            value={values.bankId}
            onChange={(event) => set("bankId", event.target.value)}
            error={errors.bankId ?? (banksFailed ? "No se pudo cargar el catálogo de bancos." : undefined)}
            hint={
              editing && account.bankId === null
                ? `Registrada como «${account.bankName}», que aún no está en el catálogo. Elige un banco para enlazarla.`
                : undefined
            }
          >
            <option value="">Selecciona un banco</option>
            {currentBankInactive && (
              <option value={account.bankId ?? ""}>{account.bankName} (no disponible para cuentas nuevas)</option>
            )}
            {banks.map((bank) => (
              <option key={bank.id} value={bank.id}>
                {bank.name}
              </option>
            ))}
          </Select>
        </div>

        <Select
          label="Tipo de cuenta"
          value={values.accountType}
          onChange={(event) => set("accountType", event.target.value as BankAccountType)}
        >
          {BANK_ACCOUNT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Input
          label="Número de cuenta"
          required={!editing}
          inputMode="numeric"
          autoComplete="off"
          value={values.accountNumber}
          onChange={(event) => set("accountNumber", event.target.value.replace(/\s/g, ""))}
          placeholder={editing ? `•••• ${account.lastFourDigits}` : "Solo dígitos"}
          hint={editing ? "Déjalo vacío para conservar el número guardado." : undefined}
          error={errors.accountNumber}
        />

        <Input
          className="sm:col-span-2"
          label="Titular de la cuenta"
          required
          value={values.accountHolder}
          onChange={(event) => set("accountHolder", event.target.value)}
          placeholder="Nombre completo o razón social"
          error={errors.accountHolder}
        />

        <Input
          label="Documento"
          required
          value={values.documentNumber}
          onChange={(event) => set("documentNumber", event.target.value)}
          placeholder="NIT o cédula"
          error={errors.documentNumber}
        />

        {hasExistingAccounts && !(editing && account.isDefault) && (
          <label className="flex cursor-pointer items-center gap-2.5 self-end pb-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={values.isDefault}
              onChange={(event) => set("isDefault", event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-secondary"
            />
            Cuenta principal (a esta se giran las liquidaciones)
          </label>
        )}
      </form>
    </Modal>
  );
}
