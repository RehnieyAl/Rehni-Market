import { useEffect, useState } from "react";
import { Calendar, Coins, TrendingUp, Wallet } from "lucide-react";

import StatCard from "@/shared/components/dashboard/StatCard";
import StatCardSkeleton from "@/features/payouts/components/StatCardSkeleton";
import { ErrorState } from "@/shared/components/ui";

import { getCompanyBalance } from "@/features/company/api/payoutService";
import { formatPrice } from "@/shared/utils/formatPrice";

import type { CompanyBalance } from "@/features/payouts/types/response";

export default function FinanceSummary() {
  const [balance, setBalance] = useState<CompanyBalance | null>(null);
  const [loading, setLoading] = useState(true);

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

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Ventas acumuladas"
        value={formatPrice(balance.grossSalesAccumulated)}
        subtitle="Histórico de todas tus liquidaciones"
        icon={<TrendingUp size={20} />}
      />

      <StatCard
        title="Comisión Rehni Market"
        value={formatPrice(balance.commissionAccumulated)}
        subtitle="5% acumulado sobre ventas válidas"
        icon={<Coins size={20} />}
      />

      <StatCard
        title="Saldo neto pendiente"
        value={formatPrice(balance.netBalance)}
        subtitle="Liquidaciones aún no pagadas"
        icon={<Wallet size={20} />}
      />

      <StatCard
        title="Próxima liquidación"
        value={new Date(balance.nextPayoutDate).toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "long",
        })}
        subtitle="Corte mensual estimado"
        icon={<Calendar size={20} />}
      />
    </div>
  );
}
