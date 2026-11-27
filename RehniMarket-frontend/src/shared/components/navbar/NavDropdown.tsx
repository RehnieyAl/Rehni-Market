/** Desplegable del navbar de escritorio (perfil, favoritos y carrito): botón con aria-expanded y aria-controls y un
 * panel anclado debajo. Es un patrón de divulgación, no role="menu": sus enlaces y botones siguen en el orden de
 * Tab. El navbar decide cuál está abierto, así que abrir uno cierra los demás. */
import { useCallback, useRef, type ReactNode } from "react";

import { useDismiss } from "@/hooks/useDismiss";
import { cn } from "@/shared/utils/cn";

interface NavDropdownProps {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  triggerClassName: string;
  /** Nombre accesible del botón cuando solo muestra un icono. */
  triggerLabel?: string;
  panelLabel: string;
  panelClassName?: string;
  children: ReactNode;
}

export default function NavDropdown({
  id,
  open,
  onOpenChange,
  trigger,
  triggerClassName,
  triggerLabel,
  panelLabel,
  panelClassName,
  children,
}: NavDropdownProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  useDismiss(open, close, containerRef, triggerRef);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={triggerLabel}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => onOpenChange(!open)}
        className={triggerClassName}
      >
        {trigger}
      </button>

      {open && (
        <div
          id={id}
          role="region"
          aria-label={panelLabel}
          className={cn(
            "animate-pop-in absolute right-0 top-full z-50 mt-3 overflow-hidden rounded-card border border-hairline bg-surface-1 shadow-pop",
            panelClassName,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
