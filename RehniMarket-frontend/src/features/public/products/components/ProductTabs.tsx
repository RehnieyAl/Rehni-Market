import { useState } from "react";

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

export default function ProductTabs({
  description,
  attributes,
  reviewCount,
}: ProductTabsProps) {
  const [tab, setTab] = useState<TabId>("description");

  const tabs: { id: TabId | "reviews"; label: string }[] = [
    { id: "description", label: "Descripción" },
    { id: "specifications", label: "Especificaciones" },
    { id: "reviews", label: `Opiniones (${reviewCount})` },
  ];

  return (
    <div className="theme-dark rounded-2xl border border-gray-200 bg-surface-1 dark:border-hairline dark:bg-surface-1">
      <div className="flex gap-6 overflow-x-auto border-b border-gray-200 px-5 dark:border-hairline">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() =>
              item.id === "reviews"
                ? document.getElementById("opiniones")?.scrollIntoView({ behavior: "smooth" })
                : setTab(item.id)
            }
            className={`shrink-0 border-b-2 py-4 text-sm font-medium transition ${
              tab === item.id
                ? "border-primary text-primary dark:border-brand-400 dark:text-brand-300"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-ink-muted dark:hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === "description" ? (
          <p className="whitespace-pre-line leading-7 text-gray-600 dark:text-ink-muted">
            {description}
          </p>
        ) : attributes.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-ink-muted">
            Este producto no tiene especificaciones registradas.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-hairline">
            {attributes.map((row, index) => (
              <div
                key={index}
                className="flex justify-between gap-4 border-b border-gray-100 p-3 text-sm last:border-b-0 odd:bg-gray-50 dark:border-hairline dark:odd:bg-white/5"
              >
                <span className="font-medium text-gray-900 dark:text-ink">{row.name}</span>
                <span className="text-right text-gray-600 dark:text-ink-muted">{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
