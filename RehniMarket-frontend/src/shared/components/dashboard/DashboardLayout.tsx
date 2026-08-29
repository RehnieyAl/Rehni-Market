import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/shared/utils/cn";
import SidebarNav, { type SidebarItem } from "./Sidebar";
import Topbar from "./Topbar";

const RAIL_STORAGE_KEY = "rm_dashboard_rail";

interface DashboardLayoutProps {
  navItems: SidebarItem[];
  activeItem: string;
  onNavigate: (id: string) => void;
  title: string;
  description: string;
  roleName: string;
  children: ReactNode;
}

// Estructura responsive del panel: barra lateral fija en escritorio (con modo
// rail), drawer con overlay en móvil/tablet, topbar con botón de menú.
export default function DashboardLayout({
  navItems,
  activeItem,
  onNavigate,
  title,
  description,
  roleName,
  children,
}: DashboardLayoutProps) {
  const [rail, setRail] = useState(() => {
    try {
      return localStorage.getItem(RAIL_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  // drawer: `open` = intención; `render` (en DOM) y `shown` (transición) derivan de él.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRender, setDrawerRender] = useState(false);
  const [drawerShown, setDrawerShown] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const toggleRail = useCallback(() => {
    setRail((current) => {
      const next = !current;
      try {
        localStorage.setItem(RAIL_STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* almacenamiento no disponible */
      }
      return next;
    });
  }, []);

  const openDrawer = useCallback(() => {
    setDrawerRender(true);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerShown(false);
    setDrawerOpen(false);
  }, []);

  const handleNavigate = useCallback(
    (id: string) => {
      onNavigate(id);
      closeDrawer();
    },
    [onNavigate, closeDrawer],
  );

  // Entrada: una vez montado y abierto, activar la transición en el siguiente frame.
  useEffect(() => {
    if (!drawerOpen || !drawerRender) return;
    const frame = requestAnimationFrame(() => setDrawerShown(true));
    return () => cancelAnimationFrame(frame);
  }, [drawerOpen, drawerRender]);

  // Salida: desmontar tras la transición de cierre.
  useEffect(() => {
    if (drawerOpen) return;
    const timer = setTimeout(() => setDrawerRender(false), 220);
    return () => clearTimeout(timer);
  }, [drawerOpen]);

  // Cerrar el drawer si el viewport pasa a escritorio.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (query.matches) closeDrawer();
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [closeDrawer]);

  // Bloqueo de scroll + Esc + foco mientras el drawer está montado.
  useEffect(() => {
    if (!drawerRender) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", onKeyDown, true);

    const focusFrame = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>("button, a")?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown, true);
      cancelAnimationFrame(focusFrame);
      restoreFocusRef.current?.focus?.();
    };
  }, [drawerRender, closeDrawer]);

  return (
    <div className="flex h-dvh bg-gray-50">
      {/* Barra lateral persistente — escritorio */}
      <aside
        className={cn(
          "hidden shrink-0 border-r border-gray-200 transition-[width] duration-200 lg:block",
          rail ? "w-[76px]" : "w-64",
        )}
      >
        <SidebarNav
          items={navItems}
          activeItem={activeItem}
          onItemClick={onNavigate}
          collapsed={rail}
          onToggleCollapse={toggleRail}
        />
      </aside>

      {/* Columna de contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={title}
          description={description}
          roleName={roleName}
          onMenuClick={openDrawer}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Drawer — móvil / tablet */}
      {drawerRender &&
        createPortal(
          <div className="fixed inset-0 z-[90] lg:hidden">
            <div
              onClick={closeDrawer}
              className={cn(
                "absolute inset-0 bg-black/50 transition-opacity duration-200",
                drawerShown ? "opacity-100" : "opacity-0",
              )}
            />

            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Menú de navegación"
              className={cn(
                "absolute inset-y-0 left-0 w-[84%] max-w-72 shadow-pop transition-transform duration-200",
                drawerShown ? "translate-x-0" : "-translate-x-full",
              )}
            >
              <SidebarNav
                items={navItems}
                activeItem={activeItem}
                onItemClick={handleNavigate}
                onClose={closeDrawer}
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
