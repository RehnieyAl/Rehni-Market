import ConfirmModal from "@/shared/components/ConfirmModal";
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

// Confirmación antes de PATCH /admin/payouts/{id}/pay. Dispara un correo a la
// empresa y no se puede deshacer. ConfirmModal con los datos bancarios embebidos.
export default function PayoutMarkPaidConfirmModal({
  isOpen,
  companyName,
  netAmountLabel,
  bankAccount,
  loading,
  onConfirm,
  onClose,
}: PayoutMarkPaidConfirmModalProps) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      tone="success"
      title="Marcar liquidación como pagada"
      confirmLabel="Confirmar pago"
      loading={loading}
      onConfirm={onConfirm}
      onClose={onClose}
      message={
        <div className="space-y-3">
          <p>
            Vas a marcar como pagada la liquidación de{" "}
            <span className="font-semibold text-gray-900">{companyName}</span> por{" "}
            <span className="font-semibold text-gray-900">{netAmountLabel}</span>.
          </p>

          {bankAccount && (
            <div className="rounded-control border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Transfiere a
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {bankAccount.bankName}
              </p>
              <p className="text-sm text-gray-500">
                {BANK_ACCOUNT_TYPE_LABEL[bankAccount.accountType]}
              </p>
              <div className="mt-2">
                <AccountNumberDisplay value={bankAccount.accountNumber} />
              </div>
            </div>
          )}

          <p className="font-medium text-gray-700">
            Se enviará un correo automático a la empresa confirmando el pago.
          </p>
        </div>
      }
    />
  );
}
