import { Link } from "react-router-dom";
import { ArrowRight, ImageOff, Package } from "lucide-react";

import type { PublicCatalog } from "@/features/public/products/types/response";

interface CategoryCardProps {
  category: PublicCatalog;
}

// Tarjeta de categoría (ver ALCANCE > rediseño Categorías): imagen real
// (image_url, con placeholder si es null - nunca hardcodeada) + nombre +
// cantidad de productos + indicador de flecha. Toda la tarjeta es
// clickeable y navega al catálogo ya filtrado por esta categoría (ver
// ProductsList.tsx, que lee `?catalog=` de la URL).
export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      to={`/products?catalog=${category.id}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {category.image_url ? (
          <img
            src={category.image_url}
            alt={category.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <ImageOff size={36} />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

        {/* Icono genérico de categoría (ver design/home-reference.png) -
            no es un icono propio de CADA categoría (no existe ese dato en
            el modelo) - se usa uno solo, consistente, como refuerzo
            visual, no como información nueva. */}
        <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#6D0F2D] text-white shadow-md">
          <Package size={16} />
        </span>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-white">{category.name}</h3>

            <p className="mt-0.5 text-sm text-white/85">
              {category.product_count.toLocaleString("es-CO")}{" "}
              {category.product_count === 1 ? "producto" : "productos"}
            </p>
          </div>

          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#6D0F2D] shadow-md transition-transform duration-300 ease-out group-hover:translate-x-0.5">
            <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}
