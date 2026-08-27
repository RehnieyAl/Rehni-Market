import { CheckCircle2, X } from "lucide-react";

import AccountNumberDisplay from "@/features/payouts/components/AccountNumberDisplay";
import { BANK_ACCOUNT_TYPE_LABEL } from "@/features/payouts/utils/payoutStatus";

import type { PayoutBankAccountSummary } from "@/features/payouts/types/response";

interface PayoutMarkPaidConfirmModalProps {
  isOpen: boolean;
  companyName: string;
  netAmountLabel: string;
  bankAccount: PayoutBankAccountSummary | null;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

// Confirmación antes de PATCH /admin/payouts/{id}/pay (ver ALCANCE >
// Módulo de liquidaciones, Fase 7) - mismo patrón "no usar confirm()" que
// AddressDeleteConfirmModal.tsx/BankAccountDeleteConfirmModal.tsx, pero
// con acento verde (acción positiva, no destructiva). Marcar como pagada
// dispara un correo automático real a la empresa (ver
// PayoutService.mark_payout_paid_service) y no se puede deshacer desde
// acá (no existe un endpoint para revertir a pending).
export default function PayoutMarkPaidConfirmModal({
  isOpen,
  companyName,
  netAmountLabel,
  bankAccount,
  loading,
  onConfirm,
  onClose,
}: PayoutMarkPaidConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">Marcar liquidación como pagada</h2>

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
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">¿Confirmar el pago?</h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Vas a marcar como pagada la liquidación de{" "}
                <span className="font-semibold text-gray-900">{companyName}</span> por{" "}
                <span className="font-semibold text-gray-900">{netAmountLabel}</span>.
              </p>

              {bankAccount && (
                <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Transfiere a
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">{bankAccount.bankName}</p>
                  <p className="text-sm text-gray-500">{BANK_ACCOUNT_TYPE_LABEL[bankAccount.accountType]}</p>

                  <div className="mt-2">
                    <AccountNumberDisplay value={bankAccount.accountNumber} />
                  </div>
                </div>
              )}

              <p className="mt-3 text-sm font-medium text-gray-700">
                Se enviará un correo automático a la empresa confirmando el pago.
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
            className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Confirmando..." : "Confirmar pago"}
          </button>
        </div>
      </div>
    </div>
  );
}
