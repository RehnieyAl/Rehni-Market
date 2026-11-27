/** Tarjeta de categoría: imagen real del catálogo, nombre, cantidad de productos y enlace al listado filtrado. */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ImageOff } from "lucide-react";

import type { PublicCatalog } from "@/features/public/products/types/response";

interface CategoryCardProps {
  category: PublicCatalog;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const image = category.image_url && category.image_url !== failedSrc ? category.image_url : null;
  const countLabel = `${category.product_count.toLocaleString("es-CO")} ${
    category.product_count === 1 ? "producto" : "productos"
  }`;

  return (
    <Link
      to={`/products?catalog=${category.id}`}
      className="group flex flex-col overflow-hidden rounded-card border border-hairline bg-surface-1 transition duration-300 ease-out hover:-translate-y-0.5 hover:border-white/15 hover:shadow-pop focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-surface-2">
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            width={640}
            height={400}
            onError={() => setFailedSrc(image)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-gray-400">
            <ImageOff size={28} aria-hidden="true" />
            <span className="text-xs">Imagen no disponible</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-ink" title={category.name}>
            {category.name}
          </h3>
          <p className="mt-0.5 text-sm text-ink-muted">{countLabel}</p>
        </div>

        <ArrowRight
          size={20}
          aria-hidden="true"
          className="shrink-0 text-secondary transition-transform duration-300 ease-out group-hover:translate-x-1"
        />
      </div>
    </Link>
  );
}
