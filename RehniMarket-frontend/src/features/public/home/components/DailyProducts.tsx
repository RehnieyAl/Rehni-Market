import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { getDailyProducts } from "../api/homeService";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";

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
        console.error("Error cargando productos del día:", error);

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
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      {/* ENCABEZADO */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Productos del día
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Selección de productos disponibles hoy en Rehni-Market.
          </p>
        </div>

        {!loading && products.length > 0 && (
          <Link
            to="/products"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#6D0F2D] transition hover:text-[#530A20]"
          >
            Ver todos
            <ArrowRight
              size={17}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        )}
      </div>

      {/* GRID */}
      <div className="mt-7 grid w-full grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-6">
        {loading ? (
          Array.from({ length: DAILY_PRODUCTS_LIMIT }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))
        ) : products.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <p className="text-sm text-gray-400">
              No hay productos disponibles.
            </p>
          </div>
        ) : (
          products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))
        )}
      </div>
    </section>
  );
}