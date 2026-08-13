import { useState } from "react";

import Catalogs from "./catalog/Catalogs";
import Colors from "./color/Colors";

type Tab = "catalogs" | "colors";

export default function CatalogManagement() {
  const [tab, setTab] = useState<Tab>("catalogs");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo</h1>
        <p className="mt-1 text-sm text-gray-500">
          Administra los catálogos, sus especificaciones y la paleta de
          colores del marketplace.
        </p>
      </div>

      <div className="mt-5 flex shrink-0 gap-1 border-b border-gray-200">
        <TabButton
          label="Catálogos"
          active={tab === "catalogs"}
          onClick={() => setTab("catalogs")}
        />
        <TabButton
          label="Colores"
          active={tab === "colors"}
          onClick={() => setTab("colors")}
        />
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        {tab === "catalogs" ? <Catalogs /> : <Colors />}
      </div>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "border-[#7A1833] text-[#7A1833]"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {label}
    </button>
  );
}
