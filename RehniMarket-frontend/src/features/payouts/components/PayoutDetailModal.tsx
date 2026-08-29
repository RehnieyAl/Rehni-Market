import { useEffect, useState } from "react";
import { X } from "lucide-react";
import axios from "axios";

import PayoutStatusBadge from "./PayoutStatusBadge";
import AccountNumberDisplay from "./AccountNumberDisplay";

import { formatPrice } from "@/shared/utils/formatPrice";
import { useAlert } from "@/shared/components/alert/useAlert";
import { BANK_ACCOUNT_TYPE_LABEL } from "../utils/payoutStatus";

import type { ReactNode } from "react";
import type { CompanyPayout } from "../types/response";

interface PayoutDetailModalProps {
  payoutId: string | null;
  isOpen: boolean;
  onClose: () => void;
  // Company y admin leen el mismo shape (CompanyPayoutResponse) pero de
  // endpoints distintos (ver features/company/api/payoutService.ts vs
  // features/admin/api/payoutService.ts) - un solo componente de detalle
  // reutilizado por ambos dashboards en vez de duplicar este layout.
  fetchDetail: (payoutId: string) => Promise<CompanyPayout>;
  // Acción exclusiva admin ("Marcar como pagada", ver
  // AdminPayoutDetailModal.tsx) - el lado empresa no pasa esta prop, así
  // que el modal queda de solo lectura ahí.
  footer?: (payout: CompanyPayout) => ReactNode;
  // companyName solo lo trae CompanyPayoutResponse cuando lo consulta el
  // admin - se muestra el título acorde.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, payoutId]);

  if (!isOpen) return null;

  const periodLabel = (p: CompanyPayout) =>
    `${new Date(p.periodStart).toLocaleDateString("es-CO")} — ${new Date(p.periodEnd).toLocaleDateString("es-CO")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {payout && showCompanyName ? payout.companyName ?? "Liquidación" : "Detalle de liquidación"}
          </h2>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {loading || !payout ? (
            <p className="py-8 text-center text-sm text-gray-500">Cargando liquidación...</p>
          ) : (
            <div className="space-y-6">

              <div className="flex items-center justify-between">
                <PayoutStatusBadge status={payout.payoutStatus} />

                <span className="text-sm text-gray-500">{periodLabel(payout)}</span>
              </div>

              <section className="rounded-2xl border bg-gray-50 p-4">
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

                <div className="rounded-2xl border p-4 text-sm text-gray-600">
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

                  <div className="rounded-2xl border p-4 text-sm text-gray-600">
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
        </div>

        {payout && footer && (
          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            {footer(payout)}
          </div>
        )}
      </div>
    </div>
  );
}
