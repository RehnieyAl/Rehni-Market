import { useState } from "react";
import { X } from "lucide-react";
import axios from "axios";

import { createBankAccount, updateBankAccount } from "@/features/company/api/bankAccountService";
import { BANK_ACCOUNT_TYPE_OPTIONS } from "@/features/payouts/utils/payoutStatus";
import { useAlert } from "@/shared/components/alert/useAlert";

import type { BankAccount, BankAccountType } from "@/features/payouts/types/response";

interface BankAccountFormProps {
  isOpen: boolean;
  // Si viene una cuenta, el formulario edita (PATCH); si no, crea (POST) -
  // mismo componente para ambos casos, como AddressForm.tsx.
  account: BankAccount | null;
  hasExistingAccounts: boolean;
  onSaved: (account: BankAccount) => void;
  onClose: () => void;
}

const emptyForm = {
  accountHolder: "",
  documentNumber: "",
  bankName: "",
  accountType: "savings" as BankAccountType,
  accountNumber: "",
  isDefault: false,
};

// Formulario "Nueva cuenta bancaria" / "Editar cuenta bancaria" (ver
// ALCANCE > Módulo de liquidaciones, Fase 1) - mismo patrón que
// AddressForm.tsx (checkbox "predeterminada", la primera cuenta queda
// predeterminada sola en el backend).
export default function BankAccountForm({
  isOpen,
  account,
  hasExistingAccounts,
  onSaved,
  onClose,
}: BankAccountFormProps) {
  const { showAlert } = useAlert();

  const [form, setForm] = useState(() =>
    account
      ? {
          accountHolder: account.accountHolder,
          documentNumber: account.documentNumber,
          bankName: account.bankName,
          accountType: account.accountType,
          accountNumber: account.accountNumber,
          isDefault: account.isDefault,
        }
      : emptyForm,
  );

  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleChange = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (
      !form.accountHolder.trim() ||
      !form.documentNumber.trim() ||
      !form.bankName.trim() ||
      !form.accountNumber.trim()
    ) {
      showAlert("error", "Completa titular, documento, banco y número de cuenta.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        accountHolder: form.accountHolder.trim(),
        documentNumber: form.documentNumber.trim(),
        bankName: form.bankName.trim(),
        accountType: form.accountType,
        accountNumber: form.accountNumber.trim(),
        isDefault: form.isDefault,
      };

      const saved = account
        ? await updateBankAccount(account.id, payload)
        : await createBankAccount(payload);

      showAlert("success", account ? "Cuenta bancaria actualizada." : "Cuenta bancaria guardada.");
      onSaved(saved);
    } catch (error) {
      console.error("Error guardando cuenta bancaria:", error);

      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail?.message
        : undefined;

      showAlert("error", message ?? "No se pudo guardar la cuenta bancaria.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {account ? "Editar cuenta bancaria" : "Nueva cuenta bancaria"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-gray-700">Titular de la cuenta</label>

              <input
                value={form.accountHolder}
                onChange={(e) => handleChange("accountHolder", e.target.value)}
                placeholder="Nombre completo o razón social"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-[#6D0F2D]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-gray-700">Documento</label>

              <input
                value={form.documentNumber}
                onChange={(e) => handleChange("documentNumber", e.target.value)}
                placeholder="NIT o cédula"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-[#6D0F2D]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-gray-700">Banco</label>

              <input
                value={form.bankName}
                onChange={(e) => handleChange("bankName", e.target.value)}
                placeholder="Ej. Bancolombia"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-[#6D0F2D]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-gray-700">Tipo de cuenta</label>

              <select
                value={form.accountType}
                onChange={(e) => handleChange("accountType", e.target.value as BankAccountType)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-[#6D0F2D]"
              >
                {BANK_ACCOUNT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-gray-700">Número de cuenta</label>

              <input
                value={form.accountNumber}
                onChange={(e) => handleChange("accountNumber", e.target.value)}
                placeholder="Número completo"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-[#6D0F2D]"
              />
            </div>
          </div>

          {hasExistingAccounts && (
            <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => handleChange("isDefault", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-[#6D0F2D]"
              />
              Cuenta predeterminada (a esta se giran las liquidaciones)
            </label>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-xl bg-[#6D0F2D] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#5b0d26] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cuenta"}
          </button>
        </div>
      </div>
    </div>
  );
}
