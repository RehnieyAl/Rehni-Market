/** Finanzas del panel de empresa: resumen (métricas, liquidaciones recientes y cuentas bancarias),
 * liquidaciones completas y gestión de cuentas bancarias. */
import { useState } from "react";
import { Wallet } from "lucide-react";

import FinanceSummary from "./finance/FinanceSummary";
import PayoutsList from "./finance/PayoutsList";
import BankAccountsList from "./finance/BankAccountsList";
import DashboardFilterTabs from "@/shared/components/dashboard/DashboardFilterTabs";
import DashboardPageHeader from "@/shared/components/dashboard/DashboardPageHeader";

type TabId = "summary" | "payouts" | "bankAccounts";

const TABS: { id: TabId; label: string }[] = [
  { id: "summary", label: "Resumen financiero" },
  { id: "payouts", label: "Liquidaciones" },
  { id: "bankAccounts", label: "Cuentas bancarias" },
];

export default function Finance() {
  const [tab, setTab] = useState<TabId>("summary");

  return (
    <div>
      <DashboardPageHeader
        icon={<Wallet size={26} />}
        title="Finanzas"
        description="Consulta tus ventas, comisiones, liquidaciones y administra las cuentas bancarias donde recibes tus pagos."
      />

      <div className="mt-6">
        <DashboardFilterTabs label="Secciones de finanzas" options={TABS} value={tab} onChange={setTab} />
      </div>

      <div className="mt-6">
        {tab === "summary" && (
          <div className="space-y-6">
            <FinanceSummary />
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <PayoutsList recentOnly onViewAll={() => setTab("payouts")} />
              <BankAccountsList compact />
            </div>
          </div>
        )}
        {tab === "payouts" && <PayoutsList />}
        {tab === "bankAccounts" && <BankAccountsList />}
      </div>
    </div>
  );
}
