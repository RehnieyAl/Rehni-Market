/** Sección Catálogo del panel de administración: categorías (con sus atributos) y bancos de la plataforma. */
import { Package } from "lucide-react";
import { useState } from "react";

import Banks from "./catalog/Banks";
import Catalogs from "./catalog/Catalogs";
import DashboardFilterTabs from "@/shared/components/dashboard/DashboardFilterTabs";
import DashboardPageHeader from "@/shared/components/dashboard/DashboardPageHeader";

type CatalogTab = "categories" | "banks";

const TABS: { id: CatalogTab; label: string }[] = [
  { id: "categories", label: "Categorías" },
  { id: "banks", label: "Bancos" },
];

export default function CatalogManagement() {
  const [tab, setTab] = useState<CatalogTab>("categories");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0">
        <DashboardPageHeader
          icon={<Package size={26} />}
          title="Catálogo"
          description="Administra los catálogos del marketplace con sus atributos de producto y de variante, y los bancos disponibles para las cuentas de las empresas."
        />
        <div className="mt-5">
          <DashboardFilterTabs label="Secciones del catálogo" options={TABS} value={tab} onChange={setTab} />
        </div>
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col">{tab === "categories" ? <Catalogs /> : <Banks />}</div>
    </div>
  );
}
