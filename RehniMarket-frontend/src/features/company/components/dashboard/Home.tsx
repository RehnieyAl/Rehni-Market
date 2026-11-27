/** Inicio del panel de empresa: cabecera de la tienda, métricas reales del catálogo, acciones rápidas,
 * pedidos y productos recientes, y el modal Mi tienda. */
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, EyeOff, Package, PackageX } from "lucide-react";

import CompanyDashboardHero from "./CompanyDashboardHero";
import CompanySettingsModal from "./CompanySettingsModal";
import QuickActions, { type QuickActionTarget } from "./QuickActions";
import RecentOrders from "./RecentOrders";
import RecentProducts from "./RecentProducts";
import StatCard from "@/shared/components/dashboard/StatCard";
import { useAuth } from "@/features/public/auth/context/useAuth";
import { getCompanyHero, getProductsSummary } from "@/features/company/api/companyService";

import type { DashboardHomeResponse, ProductsSummaryResponse } from "@/features/company/types/response";

interface HomeProps {
  onNavigate: (view: string, params?: Record<string, string>) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const { user } = useAuth();

  const [company, setCompany] = useState<DashboardHomeResponse | null>(null);
  const [summary, setSummary] = useState<ProductsSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const loadCompany = useCallback(() => {
    getCompanyHero()
      .then(setCompany)
      .catch((error) => console.error("Error al cargar la empresa:", error));
  }, []);

  useEffect(loadCompany, [loadCompany]);

  useEffect(() => {
    getProductsSummary()
      .then(setSummary)
      .catch((error) => console.error("Error al cargar las estadísticas de productos:", error))
      .finally(() => setSummaryLoading(false));
  }, []);

  const statValue = (value: number | undefined) => (summaryLoading ? "…" : String(value ?? 0));

  return (
    <div className="space-y-6">
      <CompanyDashboardHero company={company} email={user?.email} onEditProfile={() => setSettingsOpen(true)} />

      <section aria-label="Resumen del catálogo" className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Productos publicados"
          value={statValue(summary?.total)}
          subtitle="Total en tu catálogo"
          icon={<Package size={22} />}
          tone="brand"
        />
        <StatCard
          title="Activos"
          value={statValue(summary?.active)}
          subtitle="Visibles para compradores"
          icon={<CheckCircle2 size={22} />}
          tone="success"
        />
        <StatCard
          title="Agotados"
          value={statValue(summary?.out_of_stock)}
          subtitle="Sin stock disponible"
          icon={<PackageX size={22} />}
          tone="warning"
        />
        <StatCard
          title="Ocultos"
          value={statValue(summary?.hidden)}
          subtitle="Desactivados"
          icon={<EyeOff size={22} />}
          tone="danger"
        />
      </section>

      <QuickActions
        onSelect={({ tab, params }: QuickActionTarget) => onNavigate(tab, params)}
        onConfigureStore={() => setSettingsOpen(true)}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <RecentOrders onViewAll={() => onNavigate("orders")} />
        <RecentProducts onViewAll={() => onNavigate("products")} />
      </div>

      <CompanySettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} onSaved={loadCompany} />
    </div>
  );
}
