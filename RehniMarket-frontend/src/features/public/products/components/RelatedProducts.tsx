import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import ProductCard from "@/features/public/home/components/ProductCard";
import ProductCardSkeleton from "@/features/public/home/components/ProductCardSkeleton";

import { getPublicProducts } from "../api/productsService";

import type { PublicProductCard } from "@/features/public/home/types/response";

const MAX_RELATED = 8;
const FETCH_LIMIT = MAX_RELATED + 1;

interface RelatedProductsProps {
  catalogId: string;
  excludeProductId: string;
}

export default function RelatedProducts({ catalogId, excludeProductId }: RelatedProductsProps) {
  const [products, setProducts] = useState<PublicProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);

        const response = await getPublicProducts({ catalogId, limit: FETCH_LIMIT });

        if (!cancelled) {
          setProducts(
            response.products.filter((product) => product.id !== excludeProductId).slice(0, MAX_RELATED),
          );
        }
      } catch (error) {
        console.error("Error cargando productos relacionados:", error);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [catalogId, excludeProductId]);

  const scroll = (direction: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: direction * 320, behavior: "smooth" });
  };

  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Productos relacionados</h2>

        {!loading && products.length > 2 && (
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Anterior"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-50"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Siguiente"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 scroll-smooth">
        {(loading ? Array.from({ length: 4 }) : products).map((product, index) => (
          <div key={loading ? index : (product as PublicProductCard).id} className="w-44 shrink-0 sm:w-52">
            {loading ? (
              <ProductCardSkeleton />
            ) : (
              <ProductCard product={product as PublicProductCard} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
