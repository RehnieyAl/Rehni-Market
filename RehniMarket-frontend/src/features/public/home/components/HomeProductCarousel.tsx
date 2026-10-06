import type { ReactNode } from "react";

import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import HomeSectionHeader from "./HomeSectionHeader";
import { EmptyState } from "@/shared/components/ui";

import type { PublicProductCard } from "../types/response";

interface HomeProductCarouselProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: string;
  viewAllHref: string;
  products: PublicProductCard[];
  loading: boolean;
  failed: boolean;
  emptyMessage: string;
  cardKind?: "new" | "offer";
}

const SKELETON_COUNT = 6;

const GRID =
  "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6";

export default function HomeProductCarousel({
  title,
  subtitle,
  icon,
  badge,
  viewAllHref,
  products,
  loading,
  failed,
  emptyMessage,
  cardKind = "offer",
}: HomeProductCarouselProps) {
  if (failed && !loading) return null;

  return (
    <section className="mt-12 sm:mt-16">
      <HomeSectionHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        badge={badge}
        viewAllHref={!loading && products.length > 0 ? viewAllHref : undefined}
      />

      {!loading && products.length === 0 ? (
        <EmptyState variant="plain" className="mt-5" title={emptyMessage} />
      ) : (
        <div className={`mt-5 ${GRID}`}>
          {loading
            ? Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))
            : products
                .slice(0, SKELETON_COUNT)
                .map((product) => (
                  <ProductCard key={product.id} product={product} kind={cardKind} />
                ))}
        </div>
      )}
    </section>
  );
}
