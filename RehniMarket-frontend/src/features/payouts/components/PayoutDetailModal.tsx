import { useEffect, useState } from "react";
import axios from "axios";

import PayoutStatusBadge from "./PayoutStatusBadge";
import AccountNumberDisplay from "./AccountNumberDisplay";

import { formatPrice } from "@/shared/utils/formatPrice";
import { useAlert } from "@/shared/components/alert/useAlert";
import { Modal, Spinner } from "@/shared/components/ui";
import { BANK_ACCOUNT_TYPE_LABEL } from "../utils/payoutStatus";

import type { ReactNode } from "react";
import type { CompanyPayout } from "../types/response";

interface PayoutDetailModalProps {
  payoutId: string | null;
  isOpen: boolean;
  onClose: () => void;
  fetchDetail: (payoutId: string) => Promise<CompanyPayout>;
  footer?: (payout: CompanyPayout) => ReactNode;
  showCompanyName?: boolean;
}

export default function PayoutDetailModal({
  payoutId,
  isOpen,
  onClose,
  fetchDetail,
  footer,
  showCompanyName = false,
}: PayoutDetailModalProps) {
  const { showAlert } = useAlert();

  const [payout, setPayout] = useState<CompanyPayout | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !payoutId) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setPayout(null);
        const data = await fetchDetail(payoutId);
        if (!cancelled) setPayout(data);
      } catch (error) {
        console.error("Error cargando el detalle de la liquidación:", error);

        const message = axios.isAxiosError(error)
          ? error.response?.data?.detail?.message
          : undefined;

        showAlert("error", message ?? "No se pudo cargar el detalle de la liquidación.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [isOpen, payoutId]);

  const periodLabel = (p: CompanyPayout) =>
    `${new Date(p.periodStart).toLocaleDateString("es-CO")} — ${new Date(p.periodEnd).toLocaleDateString("es-CO")}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        payout && showCompanyName
          ? payout.companyName ?? "Liquidación"
          : "Detalle de liquidación"
      }
      footer={payout && footer ? footer(payout) : undefined}
    >
      {loading || !payout ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
          <Spinner /> Cargando liquidación...
        </div>
      ) : (
        <div className="space-y-6">

              <div className="flex items-center justify-between">
                <PayoutStatusBadge status={payout.payoutStatus} />

                <span className="text-sm text-gray-500">{periodLabel(payout)}</span>
              </div>

              <section className="rounded-card border bg-gray-50 p-4">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <dt>Ventas brutas</dt>
                    <dd className="font-medium text-gray-900">{formatPrice(payout.grossSales)}</dd>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <dt>
                      Comisión Rehni Market (
                      {(Number(payout.commissionPercentage) * 100).toFixed(0)}%)
                    </dt>
                    <dd className="font-medium text-gray-900">
                      -{formatPrice(payout.commissionAmount)}
                    </dd>
                  </div>

                  <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold text-gray-900">
                    <dt>Valor neto</dt>
                    <dd>{formatPrice(payout.netAmount)}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <h3 className="mb-3 font-semibold text-gray-900">Cuenta de destino</h3>

                <div className="rounded-card border p-4 text-sm text-gray-600">
                  <p className="font-medium text-gray-900">{payout.bankAccount.bankName}</p>
                  <p className="mt-1">{BANK_ACCOUNT_TYPE_LABEL[payout.bankAccount.accountType]}</p>

                  <div className="mt-3">
                    <AccountNumberDisplay value={payout.bankAccount.accountNumber} />
                  </div>
                </div>
              </section>

              {payout.rehniCoinMovement && (
                <section>
                  <h3 className="mb-3 font-semibold text-gray-900">Conversión RehniCoin</h3>

                  <div className="rounded-card border p-4 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Equivalente en RehniCoin</span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(payout.rehniCoinMovement.rehniCoins)} RC
                      </span>
                    </div>

                    <div className="mt-1 flex justify-between">
                      <span>Tasa de conversión</span>
                      <span>1 RC = {formatPrice(payout.rehniCoinMovement.conversionRate)} COP</span>
                    </div>
                  </div>
                </section>
              )}

              <section className="space-y-1.5 border-t border-gray-100 pt-4 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>Generada</span>
                  <span>{new Date(payout.createdAt).toLocaleString("es-CO")}</span>
                </div>

                <div className="flex justify-between">
                  <span>Pagada</span>
                  <span>
                    {payout.paidAt ? new Date(payout.paidAt).toLocaleString("es-CO") : "Pendiente"}
                  </span>
                </div>
              </section>
        </div>
      )}
    </Modal>
  );
}
