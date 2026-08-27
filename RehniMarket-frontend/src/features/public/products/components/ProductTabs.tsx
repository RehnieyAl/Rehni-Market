import { useState } from "react";

import type { PublicProductSpecification } from "../types/response";

type TabId = "description" | "specifications";

interface ProductTabsProps {
  description: string;
  specifications: PublicProductSpecification[];
  reviewCount: number;
}

// Pestañas Descripción / Especificaciones / Opiniones (ver ALCANCE >
// rediseño detalle de producto, requisito 6 y referencia
// design/products-detail-reference.png). Descripción y Especificaciones
// alternan contenido acá mismo (mismo patrón de tabs con línea inferior
// activa que STATUS_TABS en Orders.tsx, adaptado a subrayado en vez de
// píldoras). "Opiniones" no oculta/muestra nada acá: en la referencia esa
// sección ya se ve siempre, debajo de este bloque (ver
// ReviewsSection.tsx) - la pestaña solo hace scroll hasta ahí, evitando
// duplicar el panel de reseñas dentro de un tab y otra vez abajo.
export default function ProductTabs({
  description,
  specifications,
  reviewCount,
}: ProductTabsProps) {
  const [tab, setTab] = useState<TabId>("description");

  const tabs: { id: TabId | "reviews"; label: string }[] = [
    { id: "description", label: "Descripción" },
    { id: "specifications", label: "Especificaciones" },
    { id: "reviews", label: `Opiniones (${reviewCount})` },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="flex gap-6 overflow-x-auto border-b border-gray-200 px-5">
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
                ? "border-[#6D0F2D] text-[#6D0F2D]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === "description" ? (
          <p className="whitespace-pre-line leading-7 text-gray-600">{description}</p>
        ) : specifications.length === 0 ? (
          <p className="text-sm text-gray-500">
            Este producto no tiene especificaciones registradas.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-100">
            {specifications.map((spec, index) => (
              <div
                key={index}
                className="flex justify-between gap-4 border-b border-gray-100 p-3 text-sm last:border-b-0 odd:bg-gray-50"
              >
                <span className="font-medium text-gray-900">{spec.name}</span>
                <span className="text-right text-gray-600">{spec.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
