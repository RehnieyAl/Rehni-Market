import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import { EmptyState } from "@/shared/components/ui";

import type { PublicProductCard } from "../types/response";

interface HomeProductCarouselProps {
  title: string;
  viewAllHref: string;
  products: PublicProductCard[];
  loading: boolean;
  failed: boolean;
  emptyMessage: string;
}

const SKELETON_COUNT = 8;

const GRID = "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:gap-5 xl:grid-cols-4";

export default function HomeProductCarousel({
  title,
  viewAllHref,
  products,
  loading,
  failed,
  emptyMessage,
}: HomeProductCarouselProps) {
  if (failed && !loading) return null;

  return (
    <section className="mt-10 sm:mt-12">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h2>

        {!loading && products.length > 0 && (
          <Link
            to={viewAllHref}
            className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary transition hover:text-primary-hover"
          >
            Ver todas
            <ArrowRight size={16} />
          </Link>
        )}
      </div>

      {!loading && products.length === 0 ? (
        <EmptyState variant="plain" className="mt-5" title={emptyMessage} />
      ) : (
        <div className={`mt-5 ${GRID}`}>
          {loading
            ? Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))
            : products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
      )}
    </section>
  );
}
