import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { getDailyProducts } from "../api/homeService";
import HomeProductCard, {
  HomeProductCardSkeleton,
} from "./HomeProductCard";

import type { PublicProductCard } from "../types/response";

const DAILY_PRODUCTS_LIMIT = 12;

export default function DailyProducts() {
  const [products, setProducts] = useState<PublicProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setFailed(false);

        const response = await getDailyProducts(DAILY_PRODUCTS_LIMIT);

        if (!cancelled) {
          setProducts(response);
        }
      } catch (error) {
        console.error("Error cargando productos destacados:", error);

        if (!cancelled) {
          setFailed(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (failed && !loading) {
    return null;
  }

  return (
    <section className="mt-10 sm:mt-12">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Productos destacados
        </h2>

        {!loading && products.length > 0 && (
          <Link
            to="/products"
            className="flex items-center gap-1 text-sm font-medium text-[#6D0F2D] transition hover:text-[#530A20]"
          >
            Ver todas
            <ArrowRight size={16} />
          </Link>
        )}
      </div>

      {!loading && products.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-400">
          No hay productos disponibles.
        </div>
      ) : (
        <div className="mt-5 flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="w-[158px] shrink-0 snap-start sm:w-[188px] lg:w-[224px] xl:w-[236px]"
                >
                  <HomeProductCardSkeleton />
                </div>
              ))
            : products.map((product) => (
                <div
                  key={product.id}
                  className="w-[158px] shrink-0 snap-start sm:w-[188px] lg:w-[224px] xl:w-[236px]"
                >
                  <HomeProductCard product={product} />
                </div>
              ))}
        </div>
      )}
    </section>
  );
}
