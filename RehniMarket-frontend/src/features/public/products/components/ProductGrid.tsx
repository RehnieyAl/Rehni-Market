/** Cuadrícula de tarjetas de producto con estados de carga, error y vacío, y pie con rango y paginación. */
import type { ReactNode } from "react";
import { PackageSearch } from "lucide-react";

import ProductCard from "@/features/public/home/components/ProductCard";
import ProductCardSkeleton from "@/features/public/home/components/ProductCardSkeleton";
import Pagination from "@/shared/components/Pagination";
import { EmptyState, ErrorState } from "@/shared/components/ui";
import { cn } from "@/shared/utils/cn";

import type { PublicProductCard } from "@/features/public/home/types/response";

interface ProductGridProps {
  products: PublicProductCard[];
  loading: boolean;
  failed: boolean;
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onRetry?: () => void;
  emptyMessage: string;
  emptyDescription?: string;
  /** Sustantivo del contador "Mostrando 1–8 de 60 …". */
  itemLabel?: string;
  /** Columnas propias (p. ej. junto a una barra lateral); por defecto 1 → 2 → 3 → 4. */
  gridClassName?: string;
  /** Control extra a la derecha del pie, como el tamaño de página. */
  footerAside?: ReactNode;
  /** Diseño de las tarjetas; `compact` en el perfil de una empresa. */
  cardLayout?: "default" | "compact";
}

const DEFAULT_GRID = "min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

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
  emptyDescription,
  itemLabel = "productos",
  gridClassName = DEFAULT_GRID,
  footerAside,
  cardLayout = "default",
}: ProductGridProps) {
  const grid = cn("grid grid-cols-1 gap-3 sm:gap-4 lg:gap-5", gridClassName);

  if (loading) {
    return (
      <div className={grid} aria-busy="true">
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
    return (
      <EmptyState
        icon={<PackageSearch size={22} />}
        title={emptyMessage}
        description={emptyDescription}
      />
    );
  }

  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <>
      <div className={grid}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} layout={cardLayout} />
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center gap-4 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
        <p className="text-sm text-ink-muted md:justify-self-start" aria-live="polite">
          Mostrando {rangeStart}–{rangeEnd} de {total} {itemLabel}
        </p>

        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />

        <div className="md:justify-self-end">{footerAside}</div>
      </div>
    </>
  );
}
