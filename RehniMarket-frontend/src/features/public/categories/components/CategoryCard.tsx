import { Link } from "react-router-dom";
import { ArrowRight, ImageOff } from "lucide-react";

import type { PublicCatalog } from "@/features/public/products/types/response";

interface CategoryCardProps {
  category: PublicCatalog;
}

// Tarjeta de categoría: imagen (con placeholder si es null) + nombre + conteo. Navega al catálogo filtrado por `?catalog=`.
export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      to={`/products?catalog=${category.id}`}
      className="group flex flex-col overflow-hidden rounded-card border border-gray-200 bg-white shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-pop"
    >
      <div className="aspect-video w-full overflow-hidden bg-gray-100">
        {category.image_url ? (
          <img
            src={category.image_url}
            alt={category.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <ImageOff size={32} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-base font-semibold text-gray-900">
            {category.name}
          </h3>

          <p className="mt-0.5 text-sm text-gray-500">
            {category.product_count.toLocaleString("es-CO")}{" "}
            {category.product_count === 1 ? "producto" : "productos"}
          </p>
        </div>

        <ArrowRight
          size={18}
          className="shrink-0 text-primary transition-transform duration-300 ease-out group-hover:translate-x-1"
        />
      </div>
    </Link>
  );
}
