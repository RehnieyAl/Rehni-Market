/** Productos recientes del inicio del panel de empresa: los últimos productos del catálogo con precio, stock y estado. */
import { useEffect, useState } from "react";
import { ArrowRight, ImageOff, Package } from "lucide-react";

import DashboardSection from "@/shared/components/dashboard/DashboardSection";
import { Badge, EmptyState, Skeleton } from "@/shared/components/ui";
import { getMyProducts } from "@/features/company/api/productService";

import type { MyProductResponse } from "@/features/company/types/response";

const RECENT_LIMIT = 5;

function ProductThumb({ product }: { product: MyProductResponse }) {
  const [failed, setFailed] = useState(false);

  if (!product.image || failed) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-surface-2 text-ink-muted">
        <ImageOff size={18} aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={product.image}
      alt=""
      width={44}
      height={44}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-11 w-11 shrink-0 rounded-control bg-surface-2 object-contain"
    />
  );
}

export default function RecentProducts({ onViewAll }: { onViewAll: () => void }) {
  const [products, setProducts] = useState<MyProductResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getMyProducts(1, RECENT_LIMIT, "")
      .then((data) => {
        if (!cancelled) setProducts(data.products);
      })
      .catch((error) => console.error("Error al cargar los productos recientes:", error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardSection
      title="Productos recientes"
      icon={<Package size={18} />}
      action={
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex min-h-9 items-center gap-1 rounded-control px-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-secondary brand-link"
        >
          Ver todos
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      }
    >
      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-12 dark:bg-surface-2" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          variant="plain"
          title="Aún no tienes productos publicados"
          description="Crea tu primer producto para empezar a vender."
        />
      ) : (
        <ul className="divide-y divide-hairline">
          {products.map((product) => (
            <li key={product.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <ProductThumb product={product} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{product.name}</p>
                <p className="text-xs text-ink-muted">
                  ${product.price.toLocaleString("es-CO")} · Stock {product.stock}
                </p>
              </div>

              <Badge tone={product.is_active ? "success" : "warning"}>
                {product.is_active ? "Activo" : "Inactivo"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}
