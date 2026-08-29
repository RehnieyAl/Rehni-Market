import ProductCard from "@/features/public/home/components/ProductCard";
import ProductCardSkeleton from "@/features/public/home/components/ProductCardSkeleton";

import { buildPageList } from "../utils/pageList";

import type { PublicProductCard } from "@/features/public/home/types/response";

interface ProductGridProps {
  products: PublicProductCard[];
  loading: boolean;
  failed: boolean;
  // Total real (todas las páginas), para "Mostrando X-Y de Z".
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  // Mensaje del estado vacío, propio de cada sección.
  emptyMessage: string;
}

// Grilla de tarjetas + skeleton + estados vacío/error + paginación.
// Presentacional puro: no sabe de dónde salen los productos (catálogo, Ofertas, Novedades).
export default function ProductGrid({
  products,
  loading,
  failed,
  total,
  page,
  totalPages,
  pageSize,
  onPageChange,
  emptyMessage,
}: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {Array.from({ length: pageSize }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (failed) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
        No se pudieron cargar los productos. Intenta de nuevo más tarde.
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
        {emptyMessage}
      </div>
    );
  }

  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const pageList = buildPageList(page, totalPages);

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <p className="text-sm text-gray-500">
          Mostrando {rangeStart}-{rangeEnd} de {total} productos
        </p>

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
            >
              Anterior
            </button>

            {pageList.map((item, index) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-1.5 text-sm text-gray-400"
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => onPageChange(item)}
                  aria-current={item === page}
                  className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-medium transition ${
                    item === page
                      ? "bg-[#6D0F2D] text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {item}
                </button>
              ),
            )}

            <button
              disabled={page === totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </>
  );
}
