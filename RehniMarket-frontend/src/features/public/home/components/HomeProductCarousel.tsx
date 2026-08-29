import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import HomeProductCard, { HomeProductCardSkeleton } from "./HomeProductCard";

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
  "w-[158px] shrink-0 snap-start sm:w-[188px] lg:w-[224px] xl:w-[236px]";

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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h2>

        {!loading && products.length > 0 && (
          <Link
            to={viewAllHref}
            className="flex items-center gap-1 text-sm font-medium text-[#6D0F2D] transition hover:text-[#530A20]"
          >
            Ver todas
            <ArrowRight size={16} />
          </Link>
        )}
      </div>

      {!loading && products.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="mt-5 flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {loading
            ? Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                <div key={index} className={ITEM_CLASS}>
                  <HomeProductCardSkeleton />
                </div>
              ))
            : products.map((product) => (
                <div key={product.id} className={ITEM_CLASS}>
                  <HomeProductCard product={product} />
                </div>
              ))}
        </div>
      )}
    </section>
  );
}
