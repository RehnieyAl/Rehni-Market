import type { ReactNode } from "react";
import { LogOut, ArrowLeft, PanelLeftClose, PanelLeft, X } from "lucide-react";
import { Link } from "react-router-dom";

import logo from "@/assets/logo.png";
import { useAuth } from "@/features/public/auth/context/useAuth";
import { cn } from "@/shared/utils/cn";

export interface SidebarItem {
  id: string;
  text: string;
  icon: ReactNode;
}

interface SidebarNavProps {
  items: SidebarItem[];
  activeItem: string;
  onItemClick: (id: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}

export default function SidebarNav({
  items,
  activeItem,
  onItemClick,
  collapsed = false,
  onToggleCollapse,
  onClose,
}: SidebarNavProps) {
  const { logout } = useAuth();

  const rail = collapsed && !onClose;

  const handleLogout = () => {
    logout();
    window.location.replace("/");
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-1">
      <div
        className={cn(
          "flex h-16 items-center gap-2 border-b border-gray-100 px-3",
          rail && "justify-center",
        )}
      >
        {!rail && (
          <img src={logo} alt="RehniMarket" className="h-8 w-auto object-contain" />
        )}

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="ml-auto rounded-control p-2 text-gray-500 transition hover:bg-gray-100"
          >
            <X size={22} />
          </button>
        ) : (
          onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
              aria-pressed={collapsed}
              className={cn(
                "rounded-control p-2 text-gray-500 transition hover:bg-gray-100",
                !rail && "ml-auto",
              )}
            >
              {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
            </button>
          )
        )}
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => (
          <NavButton
            key={item.id}
            icon={item.icon}
            text={item.text}
            active={activeItem === item.id}
            rail={rail}
            onClick={() => onItemClick(item.id)}
          />
        ))}
      </nav>

      <div className="space-y-1 border-t border-gray-200 p-3">
        <Link
          to="/"
          onClick={onClose}
          title={rail ? "Volver a la tienda" : undefined}
          className={cn(
            "flex min-h-11 w-full items-center rounded-control text-sm font-medium text-gray-700 transition hover:bg-gray-100",
            rail ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
          )}
        >
          <ArrowLeft size={20} className="shrink-0" />
          {!rail && <span>Volver a la tienda</span>}
        </Link>

        <NavButton
          icon={<LogOut size={20} />}
          text="Cerrar sesión"
          danger
          rail={rail}
          onClick={handleLogout}
        />
      </div>
    </div>
  );
}

interface NavButtonProps {
  icon: ReactNode;
  text: string;
  active?: boolean;
  danger?: boolean;
  rail?: boolean;
  onClick?: () => void;
}

function NavButton({ icon, text, active, danger, rail, onClick }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={rail ? text : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 w-full items-center rounded-control text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40",
        rail ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
        active
          ? "bg-brand-50 font-semibold text-primary"
          : danger
            ? "text-danger hover:bg-danger-bg"
            : "text-gray-700 hover:bg-gray-100",
      )}
    >
      <span className="shrink-0">{icon}</span>
      {!rail && <span className="truncate">{text}</span>}
    </button>
  );
}
