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

export default function Finance() {
  const [tab, setTab] = useState<TabId>("summary");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Finanzas</h1>

      <p className="mt-1 text-sm text-gray-500">
        Consulta tus ventas, comisiones y liquidaciones mensuales, y administra las cuentas
        bancarias donde recibes tus pagos.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            aria-pressed={tab === item.id}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === item.id
                ? "bg-primary text-primary-fg"
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
