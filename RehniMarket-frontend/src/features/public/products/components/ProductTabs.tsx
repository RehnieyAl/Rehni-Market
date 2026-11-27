/** Pestañas del detalle (descripción y especificaciones) y enlace a las opiniones de la misma página. */
import { useId, useRef, useState, type KeyboardEvent } from "react";

import { cn } from "@/shared/utils/cn";

type TabId = "description" | "specifications";

interface ProductAttributeRow {
  name: string;
  value: string;
}

interface ProductTabsProps {
  description: string;
  attributes: ProductAttributeRow[];
  reviewCount: number;
}

const TABS: { id: TabId; label: string }[] = [
  { id: "description", label: "Descripción" },
  { id: "specifications", label: "Especificaciones" },
];

const TAB_CLASS = "relative shrink-0 py-3 text-sm font-medium transition";

export default function ProductTabs({
  description,
  attributes,
  reviewCount,
}: ProductTabsProps) {
  const [tab, setTab] = useState<TabId>("description");
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Sin dependencias nuevas: navegación con flechas de un tablist (la selección sigue al foco).
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = TABS.findIndex((item) => item.id === tab);
    const moves: Record<string, number> = {
      ArrowRight: (current + 1) % TABS.length,
      ArrowLeft: (current - 1 + TABS.length) % TABS.length,
      Home: 0,
      End: TABS.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="rounded-card border border-hairline bg-surface-1">
      <div className="flex items-center gap-6 overflow-x-auto border-b border-hairline px-4 sm:px-5">
        <div role="tablist" aria-label="Información del producto" className="flex gap-6" onKeyDown={handleKeyDown}>
          {TABS.map((item, index) => {
            const selected = tab === item.id;

            return (
              <button
                key={item.id}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                type="button"
                role="tab"
                id={`${baseId}-${item.id}-tab`}
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => setTab(item.id)}
                className={cn(
                  TAB_CLASS,
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
                  selected
                    ? "text-ink after:absolute after:inset-x-0 after:bottom-0 after:border-b-2 after:border-secondary"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <a href="#opiniones" className={cn(TAB_CLASS, "text-ink-muted hover:text-ink")}>
          Opiniones ({reviewCount})
        </a>
      </div>

      {TABS.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          aria-labelledby={`${baseId}-${item.id}-tab`}
          hidden={tab !== item.id}
          tabIndex={0}
        >
          <div className="p-4 sm:p-5">
            {item.id === "description" ? (
              <p className="whitespace-pre-line text-sm leading-6 text-ink-muted">{description}</p>
            ) : attributes.length === 0 ? (
              <p className="text-sm text-ink-muted">Este producto no tiene especificaciones registradas.</p>
            ) : (
              <dl className="overflow-hidden rounded-xl border border-hairline">
                {attributes.map((row, index) => (
                  <div
                    key={index}
                    className="flex justify-between gap-4 border-b border-hairline p-3 text-sm last:border-b-0 odd:bg-white/5"
                  >
                    <dt className="font-medium text-ink">{row.name}</dt>
                    <dd className="text-right text-ink-muted">{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
