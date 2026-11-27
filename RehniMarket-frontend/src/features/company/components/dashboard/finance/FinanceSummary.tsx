/** Resumen financiero de la empresa: ventas acumuladas, comisión, saldo neto pendiente y próxima liquidación
 * tal como los calcula el backend (/company/balance). */
import { useEffect, useState } from "react";
import { Calendar, Link2, TrendingUp, Wallet } from "lucide-react";

import StatCard from "@/shared/components/dashboard/StatCard";
import StatCardSkeleton from "@/features/payouts/components/StatCardSkeleton";
import { ErrorState } from "@/shared/components/ui";

import { getCompanyBalance } from "@/features/company/api/payoutService";
import { formatPrice } from "@/shared/utils/formatPrice";

import type { CompanyBalance } from "@/features/payouts/types/response";

export default function FinanceSummary() {
  const [balance, setBalance] = useState<CompanyBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const response = await getCompanyBalance();
        if (!cancelled) setBalance(response);
      } catch (error) {
        console.error("Error cargando el balance financiero:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!balance) {
    return (
      <ErrorState
        title="No se pudo cargar el resumen financiero"
        description="Intenta de nuevo en unos momentos."
        onRetry={() => setReloadKey((key) => key + 1)}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Ventas acumuladas"
        value={formatPrice(balance.grossSalesAccumulated)}
        subtitle="Histórico de todas tus liquidaciones"
        icon={<TrendingUp size={20} />}
        tone="brand"
      />

      <StatCard
        title="Comisión Rehni Market"
        value={formatPrice(balance.commissionAccumulated)}
        subtitle="5% acumulado sobre ventas válidas"
        icon={<Link2 size={20} />}
        tone="brand"
      />

      <StatCard
        title="Saldo neto pendiente"
        value={formatPrice(balance.netBalance)}
        subtitle="Liquidaciones aún no pagadas"
        icon={<Wallet size={20} />}
        tone="brand"
      />

      <StatCard
        title="Próxima liquidación"
        value={new Date(balance.nextPayoutDate).toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "long",
        })}
        subtitle="Corte mensual estimado"
        icon={<Calendar size={20} />}
        tone="brand"
      />
    </div>
  );
}
