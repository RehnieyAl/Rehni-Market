import { BadgeCheck } from "lucide-react";

import AccountNumberDisplay from "@/features/payouts/components/AccountNumberDisplay";

import { formatPrice } from "@/shared/utils/formatPrice";
import { BANK_ACCOUNT_TYPE_LABEL } from "@/features/payouts/utils/payoutStatus";

import type { PayoutPreview } from "@/features/payouts/types/response";

export default function PayoutPreviewCard({ preview }: { preview: PayoutPreview }) {
  return (
    <div className="space-y-4 rounded-card border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-success">
        <BadgeCheck size={14} />
        Vista previa lista para generar
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <dt>Ventas brutas</dt>
          <dd className="font-medium text-gray-900">{formatPrice(preview.grossSales)}</dd>
        </div>

        <div className="flex justify-between text-gray-600">
          <dt>Comisión ({(Number(preview.commissionPercentage) * 100).toFixed(0)}%)</dt>
          <dd className="font-medium text-gray-900">-{formatPrice(preview.commissionAmount)}</dd>
        </div>

        <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold text-gray-900">
          <dt>Monto neto a transferir</dt>
          <dd>{formatPrice(preview.netAmount)}</dd>
        </div>
      </dl>

      <div className="border-t border-gray-200 pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          Cuenta bancaria destino
        </p>

        <p className="mt-1.5 text-sm font-medium text-gray-900">{preview.bankAccount.bankName}</p>

        <p className="text-sm text-gray-500">
          {BANK_ACCOUNT_TYPE_LABEL[preview.bankAccount.accountType]}
        </p>

        <div className="mt-2">
          <AccountNumberDisplay value={preview.bankAccount.accountNumber} />
        </div>
      </div>
    </div>
  );
}
