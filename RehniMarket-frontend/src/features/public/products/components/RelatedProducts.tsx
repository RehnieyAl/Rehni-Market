/** Productos relacionados del detalle: tarjetas compactas (imagen a la izquierda); fila deslizable en
 * móvil y cuadrícula horizontal desde `sm`. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ImageOff, Star, Store } from "lucide-react";

import { Skeleton } from "@/shared/components/ui";
import { formatPrice } from "@/shared/utils/formatPrice";

import { getPublicProducts } from "../api/productsService";

import type { PublicProductCard } from "@/features/public/home/types/response";

const MAX_RELATED = 5;
const FETCH_LIMIT = MAX_RELATED + 1;
// Móvil: fila con scroll-snap (cada tarjeta ocupa ~85 % del ancho y asoma la siguiente);
// el overscroll queda contenido en el eje x para no arrastrar la página ni el gesto de atrás.
const LIST =
  "-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden " +
  "sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-5";
const ITEM = "w-[85%] max-w-80 shrink-0 snap-start sm:w-auto sm:max-w-none";

interface RelatedProductsProps {
  catalogId: string;
  excludeProductId: string;
}

// Un solo destino por tarjeta: el enlace envuelve el <article> y no contiene otros controles.
function RelatedProductCard({ product }: { product: PublicProductCard }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const image = product.image && product.image !== failedImage ? product.image : null;
  const hasDiscount = product.discount_enabled && product.discount_percentage !== null;
  const hasRating = product.review_count > 0 && product.average_rating !== null;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group block h-full rounded-card border border-hairline bg-surface-1 transition hover:border-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
    >
      <article className="flex h-full gap-3 p-2.5">
        <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-control bg-white sm:w-[5.5rem]">
          {image ? (
            <img
              src={image}
              alt=""
              width={96}
              height={96}
              loading="lazy"
              decoding="async"
              onError={() => setFailedImage(image)}
              className="h-full w-full object-contain p-1.5"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-2 text-ink-muted">
              <ImageOff size={22} aria-hidden="true" />
            </div>
          )}

          {hasDiscount && (
            <span className="absolute left-1 top-1 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-white">
              -{product.discount_percentage}%
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink xl:line-clamp-3" title={product.name}>
            {product.name}
          </h3>

          <p className="flex min-w-0 items-center gap-1 text-xs text-ink-muted">
            <Store size={12} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{product.company_name}</span>
          </p>

          <p className="flex items-center gap-1 text-xs text-ink-muted">
            {hasRating ? (
              <>
                <Star size={12} aria-hidden="true" className="fill-amber-400 text-amber-400" />
                <span className="font-semibold text-ink">{product.average_rating?.toFixed(1)}</span>
                <span>({product.review_count})</span>
              </>
            ) : (
              "Sin reseñas"
            )}
          </p>

          <p className="mt-auto flex flex-wrap items-baseline gap-x-2">
            <span className="text-xl font-bold tabular-nums text-secondary">
              {formatPrice(hasDiscount ? product.final_price : product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-ink-muted line-through">{formatPrice(product.price)}</span>
            )}
          </p>
        </div>
      </article>
    </Link>
  );
}

export default function RelatedProducts({ catalogId, excludeProductId }: RelatedProductsProps) {
  const [products, setProducts] = useState<PublicProductCard[]>([]);
  const [loading, setLoading] = useState(true);

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

    void load();

    return () => {
      cancelled = true;
    };
  }, [catalogId, excludeProductId]);

  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section className="mt-8" aria-labelledby="related-products-title">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 id="related-products-title" className="text-lg font-semibold text-ink sm:text-xl">
          Productos relacionados
        </h2>

        <Link
          to={`/products?catalog=${catalogId}`}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium brand-link"
        >
          Ver todos
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <ul className={LIST} aria-label="Productos relacionados">
        {loading
          ? Array.from({ length: MAX_RELATED }).map((_, index) => (
              <li key={index} className={`${ITEM} flex gap-3 rounded-card border border-hairline p-2.5`}>
                <Skeleton className="aspect-square w-24 shrink-0 rounded-control sm:w-[5.5rem]" />
                <div className="flex flex-1 flex-col gap-2 py-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </li>
            ))
          : products.map((product) => (
              <li key={product.id} className={ITEM}>
                <RelatedProductCard product={product} />
              </li>
            ))}
      </ul>
    </section>
  );
}
