import { Link } from "react-router-dom";
import { Heart, ImageOff } from "lucide-react";

import { formatPrice } from "@/shared/utils/formatPrice";

import type { PublicProductCard } from "../types/response";

interface ProductCardProps {
  product: PublicProductCard;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <ImageOff size={40} />
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md"
        >
          <Heart size={18} />
        </button>

        {product.discount_enabled &&
          product.discount_percentage !== null && (
            <span className="absolute left-3 top-3 rounded-xl bg-red-600 px-3 py-1 text-xs font-bold text-white">
              -{product.discount_percentage}%
            </span>
          )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-xs text-gray-500">
          {product.company_name}
        </p>

        <h3 className="line-clamp-2 min-h-[48px] font-semibold text-gray-900">
          {product.name}
        </h3>

        <div className="mt-auto pt-4">
          {product.discount_enabled ? (
            <>
              <p className="text-sm text-gray-400 line-through">
                {formatPrice(product.price)}
              </p>

              <p className="text-xl font-bold text-[#6D0F2D]">
                {formatPrice(product.final_price)}
              </p>
            </>
          ) : (
            <p className="text-xl font-bold text-[#6D0F2D]">
              {formatPrice(product.price)}
            </p>
          )}

          <div className="mt-4 rounded-xl bg-[#6D0F2D] py-3 text-center text-sm font-medium text-white transition hover:bg-[#5b0d26]">
            Ver producto
          </div>
        </div>
      </div>
    </Link>
  );
}