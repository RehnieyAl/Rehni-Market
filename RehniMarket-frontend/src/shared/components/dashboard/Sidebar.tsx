
import {
  useState,
  type ReactNode,
} from "react";

import {
  LogOut,
  ArrowLeft,
  Menu,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import logo from "@/assets/logo.png";

import { useAuth } from "@/features/public/auth/context/useAuth";

export interface SidebarItem {
  id: string;
  text: string;
  icon: ReactNode;
}

interface SidebarProps {
  items: SidebarItem[];
  activeItem: string;
  onItemClick: (id: string) => void;
}

export default function Sidebar({
  items,
  activeItem,
  onItemClick,
}: SidebarProps) {
  const [collapsed, setCollapsed] =
    useState(false);

  const navigate = useNavigate();

  const { logout } = useAuth();

  /*
   * ==========================
   * CERRAR SESIÓN
   * ==========================
   */

  const handleLogout = () => {
    logout();

    navigate("/login");
  };

  return (
    <aside
      className={`flex min-h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
        collapsed
          ? "w-20"
          : "w-64"
      }`}
    >

      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <div
        className={`flex h-20 items-center border-b border-gray-100 px-3 ${
          collapsed
            ? "justify-center"
            : ""
        }`}
      >

        {!collapsed && (
          <img
            src={logo}
            alt="RehniMarket"
            className="w-50 h-auto object-contain"
          />
        )}

        <button
          type="button"
          onClick={() =>
            setCollapsed(!collapsed)
          }
          className={`flex items-center justify-center rounded-xl text-gray-600 transition hover:bg-gray-100 ${
            collapsed
              ? "p-3"
              : "ml-auto p-3"
          }`}
          aria-label={
            collapsed
              ? "Expandir menú"
              : "Contraer menú"
          }
        >
          <Menu size={24} />
        </button>

      </div>

      {/* ========================= */}
      {/* NAVEGACIÓN */}
      {/* ========================= */}

      <nav className="flex-1 px-3 py-6">
        {items.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            text={item.text}
            active={
              activeItem === item.id
            }
            collapsed={collapsed}
            onClick={() =>
              onItemClick(item.id)
            }
          />
        ))}
      </nav>

      {/* ========================= */}
      {/* ACCIONES INFERIORES */}
      {/* ========================= */}

      <div className="border-t border-gray-200 p-3">

        {/* REGRESAR */}
        <Link
          to="/"
          title={
            collapsed
              ? "Regresar"
              : undefined
          }
          className={`mb-2 flex w-full items-center rounded-2xl py-4 text-gray-700 transition-all duration-200 hover:bg-gray-100 ${
            collapsed
              ? "justify-center"
              : "gap-4 px-4"
          }`}
        >
          <ArrowLeft size={22} />

          {!collapsed && (
            <span>
              Regresar
            </span>
          )}
        </Link>

        {/* CERRAR SESIÓN */}
        <SidebarItem
          icon={
            <LogOut size={22} />
          }
          text="Cerrar sesión"
          danger
          collapsed={collapsed}
          onClick={handleLogout}
        />

      </div>
    </aside>
  );
}

/* ========================= */
/* SIDEBAR ITEM */
/* ========================= */

interface SidebarItemProps {
  icon: ReactNode;
  text: string;
  active?: boolean;
  danger?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

function SidebarItem({
  icon,
  text,
  active = false,
  danger = false,
  collapsed = false,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={
        collapsed
          ? text
          : undefined
      }
      className={`mb-2 flex w-full items-center rounded-2xl py-4 text-left transition-all duration-200 ${
        collapsed
          ? "justify-center"
          : "gap-4 px-4"
      } ${
        active
          ? "bg-red-50 font-semibold text-[#7A1833]"
          : danger
            ? "text-red-600 hover:bg-red-50"
            : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {icon}

      {!collapsed && (
        <span>{text}</span>
      )}
    </button>
  );
}

