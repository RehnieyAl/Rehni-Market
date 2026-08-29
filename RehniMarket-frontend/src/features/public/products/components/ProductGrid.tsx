import { PackageSearch } from "lucide-react";

import ProductCard from "@/features/public/home/components/ProductCard";
import ProductCardSkeleton from "@/features/public/home/components/ProductCardSkeleton";
import Pagination from "@/shared/components/Pagination";
import { EmptyState, ErrorState } from "@/shared/components/ui";

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
  onRetry?: () => void;
  // Mensaje del estado vacío, propio de cada sección.
  emptyMessage: string;
}

// 2 columnas en móvil, 3 en tablet, 4 en pantallas anchas. Gaps del sistema.
const GRID = "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:gap-5 xl:grid-cols-4";

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
  onRetry,
  emptyMessage,
}: ProductGridProps) {
  if (loading) {
    return (
      <div className={GRID}>
        {Array.from({ length: pageSize }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (failed) {
    return (
      <ErrorState
        title="No se pudieron cargar los productos"
        description="Intenta de nuevo en unos momentos."
        onRetry={onRetry}
      />
    );
  }

  if (products.length === 0) {
    return <EmptyState icon={<PackageSearch size={22} />} title={emptyMessage} />;
  }

  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <>
      <div className={GRID}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <p className="text-sm text-gray-500">
          Mostrando {rangeStart}–{rangeEnd} de {total} productos
        </p>

        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </>
  );
}
