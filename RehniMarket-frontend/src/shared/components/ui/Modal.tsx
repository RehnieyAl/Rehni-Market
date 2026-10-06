import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/shared/utils/cn";

export type ModalSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-5xl",
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  size?: ModalSize;
  children: ReactNode;
  footer?: ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  hideClose?: boolean;
  busy?: boolean;
  className?: string;
  ariaLabel?: string;
}

let openModalCount = 0;

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  hideClose = false,
  busy = false,
  className,
  ariaLabel,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const headingId = useId();
  const descId = useId();

  const requestClose = useCallback(() => {
    if (!busy) onClose();
  }, [busy, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    openModalCount += 1;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      openModalCount -= 1;
      if (openModalCount === 0) document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    const firstFocusable = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (firstFocusable ?? panel)?.focus();

    return () => {
      restoreFocusRef.current?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEsc) {
        event.stopPropagation();
        requestClose();
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen, closeOnEsc, requestClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="animate-overlay-in fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && closeOnOverlayClick) {
          requestClose();
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? headingId : undefined}
        aria-label={!title ? ariaLabel : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "animate-pop-in flex max-h-[90vh] w-full flex-col overflow-hidden rounded-card bg-surface-1 shadow-pop outline-none",
          SIZE_CLASS[size],
          className,
        )}
      >
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
            <div className="min-w-0">
              {title && (
                <h2 id={headingId} className="text-lg font-semibold text-gray-900">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="mt-0.5 text-sm text-gray-500">
                  {description}
                </p>
              )}
            </div>

            {!hideClose && (
              <button
                type="button"
                onClick={requestClose}
                disabled={busy}
                aria-label="Cerrar"
                className="-mr-1.5 shrink-0 rounded-control p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 px-5 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
