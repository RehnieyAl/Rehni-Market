import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  House,
  User,
  CirclePlus,
  Package,
  LogOut,
  Truck,
  Store,
} from "lucide-react";

import logo from "../../assets/logo.png";

export type DashboardView =
  | "home"
  | "products"
  | "orders"
  | "process-orders"
  | "company"
  | "profile";

type SidebarProps = {
  view: DashboardView;
  setView: Dispatch<SetStateAction<DashboardView>>;
};

export default function Sidebar({ view, setView }: SidebarProps) {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-8">
        <img src={logo} alt="RehniMarket" className="h-20 w-35 object-cover" />
      </div>

      {/* Menú */}
      <nav className="flex-1 px-4">
        <SidebarItem
          icon={<House size={22} />}
          text="Inicio"
          active={view === "home"}
          onClick={() => setView("home")}
        />

        <SidebarItem
          icon={<Package size={22} />}
          text="Productos"
          active={view === "products"}
          onClick={() => setView("products")}
        />

        <SidebarItem
          icon={<CirclePlus size={22} />}
          text="Pedidos"
          active={view === "orders"}
          onClick={() => setView("orders")}
        />

        <SidebarItem
          icon={<Truck size={22} />}
          text="Procesar pedidos"
          active={view === "process-orders"}
          onClick={() => setView("process-orders")}
        />

        <SidebarItem
  icon={<Store size={22} />}
  text="Mi tienda"
  active={view === "company"}
  onClick={() => setView("company")}
/>

        <SidebarItem
          icon={<User size={22} />}
          text="Mi perfil"
          active={view === "profile"}
          onClick={() => setView("profile")}
        />
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-200 p-4">
        <SidebarItem icon={<LogOut size={22} />} text="Cerrar Sesión" danger />
      </div>
    </aside>
  );
}

type SidebarItemProps = {
  icon: ReactNode;
  text: string;
  active?: boolean;
  danger?: boolean;
  onClick?: () => void;
};

function SidebarItem({
  icon,
  text,
  active = false,
  danger = false,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        mb-2 flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left transition-all duration-200
        ${
          active
            ? "bg-red-50 font-semibold text-[#7A1833]"
            : danger
              ? "text-red-600 hover:bg-red-50"
              : "text-gray-700 hover:bg-gray-100"
        }
      `}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}
