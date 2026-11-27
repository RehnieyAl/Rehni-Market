/** Acciones rápidas del inicio del panel de empresa: atajos a secciones del panel y al modal Mi tienda. */
import { Package, Plus, Store, Truck, Wallet, Zap } from "lucide-react";

import DashboardSection from "@/shared/components/dashboard/DashboardSection";
import { cn } from "@/shared/utils/cn";

export interface QuickActionTarget {
  tab: string;
  params?: Record<string, string>;
}

/** `store`: abre el modal Mi tienda en lugar de cambiar de sección. */
const ACTIONS: { label: string; icon: typeof Plus; target: QuickActionTarget | "store"; primary?: boolean }[] = [
  { label: "Crear producto", icon: Plus, target: { tab: "products", params: { new: "1" } }, primary: true },
  { label: "Gestionar productos", icon: Package, target: { tab: "products" } },
  { label: "Procesar pedidos", icon: Truck, target: { tab: "orders" } },
  { label: "Ver finanzas", icon: Wallet, target: { tab: "finance" } },
  { label: "Configurar mi tienda", icon: Store, target: "store" },
];

interface QuickActionsProps {
  onSelect: (target: QuickActionTarget) => void;
  onConfigureStore: () => void;
}

export default function QuickActions({ onSelect, onConfigureStore }: QuickActionsProps) {
  return (
    <DashboardSection title="Acciones rápidas" icon={<Zap size={18} />}>
      <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {ACTIONS.map(({ label, icon: Icon, target, primary }) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => (target === "store" ? onConfigureStore() : onSelect(target))}
              className={cn(
                "flex h-11 w-full items-center justify-center gap-2 rounded-control px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
                primary
                  ? "bg-primary text-white fill-hover"
                  : "border border-hairline bg-surface-2 text-ink hover:border-white/20 hover:bg-surface-3",
              )}
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </DashboardSection>
  );
}
