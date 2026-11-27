/** Detalle de un mes cerrado que aún no se liquida: importes estimados por el backend, plazo, cuenta de
 * destino (o el aviso de que falta) y la generación con el mismo endpoint de «Generar liquidación». */
import { useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import axios from "axios";

import AccountNumberDisplay from "@/features/payouts/components/AccountNumberDisplay";
import PayoutAmountsBreakdown from "@/features/payouts/components/PayoutAmountsBreakdown";
import PayoutStatusBadge from "@/features/payouts/components/PayoutStatusBadge";
import { generatePayout } from "@/features/admin/api/payoutService";
import { BANK_ACCOUNT_TYPE_LABEL } from "@/features/payouts/utils/payoutStatus";
import { formatDateOnly, formatPeriodStartLabel } from "@/features/payouts/utils/period";
import { useAlert } from "@/shared/components/alert/useAlert";
import { Badge, Button, Modal } from "@/shared/components/ui";

import type { AdminPayoutListItem } from "@/features/payouts/types/response";

interface PendingPayoutDetailModalProps {
  item: AdminPayoutListItem | null;
  onClose: () => void;
  onGenerated: () => void;
}

export default function PendingPayoutDetailModal({ item, onClose, onGenerated }: PendingPayoutDetailModalProps) {
  const { showAlert } = useAlert();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!item) return;

    try {
      setGenerating(true);
      await generatePayout({ companyId: item.companyId, periodStart: item.periodStart, periodEnd: item.periodEnd });
      showAlert("success", `Liquidación generada para ${item.companyName ?? "la empresa"}.`);
      onClose();
      onGenerated();
    } catch (error) {
      console.error("Error generando liquidación:", error);

      const message = axios.isAxiosError(error) ? error.response?.data?.detail?.message : undefined;

      showAlert("error", message ?? "No se pudo generar la liquidación.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={item !== null}
      onClose={onClose}
      size="lg"
      title={item?.companyName ?? "Liquidación por generar"}
      footer={
        item && (
          <Button
            leadingIcon={<Plus size={16} />}
            loading={generating}
            disabled={!item.bankAccount}
            onClick={handleGenerate}
          >
            Generar liquidación
          </Button>
        )
      }
    >
      {item && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PayoutStatusBadge status={item.payoutStatus} />
              <Badge tone="neutral">Por generar</Badge>
              {item.isOverdue && <Badge tone="danger">Vencida</Badge>}
            </div>

            <span className="text-sm text-gray-500">{formatPeriodStartLabel(item.periodStart)}</span>
          </div>

          <PayoutAmountsBreakdown amounts={item} />

          <section>
            <h3 className="mb-3 font-semibold text-gray-900">Cuenta de destino</h3>

            {item.bankAccount ? (
              <div className="rounded-card border p-4 text-sm text-gray-600">
                <p className="font-medium text-gray-900">{item.bankAccount.bankName}</p>
                <p className="mt-1">{BANK_ACCOUNT_TYPE_LABEL[item.bankAccount.accountType]}</p>

                <div className="mt-3">
                  <AccountNumberDisplay value={item.bankAccount.accountNumber} />
                </div>
              </div>
            ) : (
              <div role="alert" className="flex items-start gap-3 rounded-card border border-warning/30 bg-warning-bg p-4">
                <AlertTriangle size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-warning" />
                <p className="text-sm text-gray-700">
                  La empresa no tiene una cuenta bancaria predeterminada. La obligación sigue pendiente y no se
                  puede generar ni consignar hasta que la registre.
                </p>
              </div>
            )}
          </section>

          <section className="space-y-1.5 border-t border-gray-100 pt-4 text-sm text-gray-500">
            <div className="flex justify-between">
              <span>Fecha límite de consignación</span>
              <span>{formatDateOnly(item.consignmentDeadline)}</span>
            </div>
            <p>
              Importes calculados con las ventas entregadas sin liquidar del mes (y las rezagadas de meses ya
              liquidados) y las devoluciones que le corresponden; quedan fijos al generar la liquidación.
            </p>
          </section>
        </div>
      )}
    </Modal>
  );
}
