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
      className="group flex flex-col items-center overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex aspect-square w-full items-center justify-center">
        {category.image_url ? (
          <img
            src={category.image_url}
            alt={category.name}
            className="h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <ImageOff size={28} />
          </div>
        )}
      </div>

      <h3 className="mt-3 line-clamp-1 text-sm font-semibold text-gray-900">
        {category.name}
      </h3>

      <p className="mt-0.5 text-xs text-gray-500">
        {category.product_count.toLocaleString("es-CO")}{" "}
        {category.product_count === 1 ? "producto" : "productos"}
      </p>
    </Link>
  );
}

export function HomeCategoryCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col items-center rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="aspect-square w-full rounded-xl bg-gray-100" />
      <div className="mt-3 h-4 w-3/5 rounded bg-gray-200" />
      <div className="mt-1.5 h-3 w-2/5 rounded bg-gray-200" />
    </div>
  );
}
