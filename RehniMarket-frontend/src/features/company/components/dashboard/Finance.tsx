import { useState } from "react";

import FinanceSummary from "./finance/FinanceSummary";
import PayoutsList from "./finance/PayoutsList";
import BankAccountsList from "./finance/BankAccountsList";

type TabId = "summary" | "payouts" | "bankAccounts";

const TABS: { id: TabId; label: string }[] = [
  { id: "summary", label: "Resumen financiero" },
  { id: "payouts", label: "Liquidaciones" },
  { id: "bankAccounts", label: "Cuentas bancarias" },
];

// Sección "Finanzas" del dashboard de empresa (ver ALCANCE > Módulo de
// liquidaciones, Fase 6): Resumen financiero / Liquidaciones / Cuentas
// bancarias, mismo patrón de tabs locales que Orders.tsx (STATUS_TABS),
// sin sub-rutas de React Router - este dashboard ya funciona por
// vistas/tabs con useState (ver Company.tsx).
export default function Finance() {
  const [tab, setTab] = useState<TabId>("summary");

  return (
    <div>
      <h1 className="text-3xl font-bold">Finanzas</h1>

      <p className="mt-2 text-gray-500">
        Consulta tus ventas, comisiones y liquidaciones mensuales, y administra las cuentas
        bancarias donde recibes tus pagos.
      </p>

      {/* TABS */}
      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === item.id
                ? "bg-[#7A1833] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "summary" && <FinanceSummary />}
        {tab === "payouts" && <PayoutsList />}
        {tab === "bankAccounts" && <BankAccountsList />}
      </div>
    </div>
  );
}
