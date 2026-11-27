/** Desglose de una liquidación (ventas, devoluciones, comisión y neto); lo comparten el detalle de una
 * liquidación generada y el de un mes por generar. */
import { formatPrice } from "@/shared/utils/formatPrice";

import type { CompanyPayout } from "../types/response";

type PayoutAmounts = Pick<
  CompanyPayout,
  "grossSales" | "refundsAmount" | "commissionPercentage" | "commissionAmount" | "netAmount"
>;

export default function PayoutAmountsBreakdown({ amounts }: { amounts: PayoutAmounts }) {
  const hasRefunds = Number(amounts.refundsAmount) > 0;

  return (
    <section className="rounded-card border bg-gray-50 p-4">
      <dl className="space-y-2 text-sm">
        {hasRefunds && (
          <>
            <div className="flex justify-between text-gray-600">
              <dt>Ventas entregadas</dt>
              <dd className="font-medium text-gray-900">
                {formatPrice(Number(amounts.grossSales) + Number(amounts.refundsAmount))}
              </dd>
            </div>
            <div className="flex justify-between text-gray-600">
              <dt>Devoluciones reembolsadas</dt>
              <dd className="font-medium text-gray-900">-{formatPrice(amounts.refundsAmount)}</dd>
            </div>
          </>
        )}

        <div className="flex justify-between text-gray-600">
          <dt>{hasRefunds ? "Ventas netas" : "Ventas brutas"}</dt>
          <dd className="font-medium text-gray-900">{formatPrice(amounts.grossSales)}</dd>
        </div>

        <div className="flex justify-between text-gray-600">
          <dt>
            Comisión Rehni Market (
            {(Number(amounts.commissionPercentage) * 100).toFixed(0)}%)
          </dt>
          <dd className="font-medium text-gray-900">-{formatPrice(amounts.commissionAmount)}</dd>
        </div>

        <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold text-gray-900">
          <dt>Valor neto</dt>
          <dd>{formatPrice(amounts.netAmount)}</dd>
        </div>
      </dl>
    </section>
  );
}
