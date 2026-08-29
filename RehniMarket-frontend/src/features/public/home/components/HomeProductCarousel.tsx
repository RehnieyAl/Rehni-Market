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

const SKELETON_COUNT = 6;
const ITEM_CLASS =
  "w-[150px] shrink-0 snap-start sm:w-[180px] lg:w-[210px] xl:w-[230px]";

// Carrusel horizontal del Home (Ofertas, Novedades). Presentacional: recibe ya
// los productos; cada sección decide de qué endpoint vienen.
export default function HomeProductCarousel({
  title,
  viewAllHref,
  products,
  loading,
  failed,
  emptyMessage,
}: HomeProductCarouselProps) {
  // Un error puntual no debe romper el Home: la sección simplemente no se muestra.
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
        <div className="mt-5 flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {loading
            ? Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                <div key={index} className={ITEM_CLASS}>
                  <ProductCardSkeleton />
                </div>
              ))
            : products.map((product) => (
                <div key={product.id} className={ITEM_CLASS}>
                  <ProductCard product={product} variant="carousel" />
                </div>
              ))}
        </div>
      )}
    </section>
  );
}
