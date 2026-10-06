import { Link } from "react-router-dom";
import { ImageOff } from "lucide-react";

import type { PublicCatalog } from "@/features/public/products/types/response";

interface HomeCategoryCardProps {
  category: PublicCatalog;
}

export default function HomeCategoryCard({ category }: HomeCategoryCardProps) {
  return (
    <Link
      to={`/products?catalog=${category.id}`}
      className="group flex flex-col overflow-hidden rounded-card border border-gray-200 bg-surface-1 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg dark:border-hairline dark:bg-surface-1 dark:hover:border-white/15 dark:hover:shadow-none"
    >
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-gray-50 p-2.5 dark:bg-surface-0">
        {category.image_url ? (
          <img
            src={category.image_url}
            alt={category.name}
            loading="lazy"
            className="h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-ink-muted/40">
            <ImageOff size={26} />
          </div>
        )}
      </div>

      <div className="px-3 py-2.5">
        <h3 className="line-clamp-1 text-sm font-semibold text-gray-900 dark:text-ink">
          {category.name}
        </h3>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-ink-muted">
          {category.product_count.toLocaleString("es-CO")}{" "}
          {category.product_count === 1 ? "producto" : "productos"}
        </p>
      </div>
    </Link>
  );
}

export function HomeCategoryCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col overflow-hidden rounded-card border border-gray-200 bg-surface-1 dark:border-hairline dark:bg-surface-1">
      <div className="aspect-[4/3] w-full bg-gray-100 dark:bg-surface-2" />
      <div className="px-3 py-2.5">
        <div className="h-4 w-3/5 rounded bg-gray-200 dark:bg-surface-2" />
        <div className="mt-1.5 h-3 w-2/5 rounded bg-gray-200 dark:bg-surface-2" />
      </div>
    </div>
  );
}
