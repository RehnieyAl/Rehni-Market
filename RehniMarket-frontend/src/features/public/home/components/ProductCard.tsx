/** Tarjeta de producto compartida (inicio, catálogo, ofertas, novedades y tienda): foto real, precio
 * de la variante más conveniente y acciones de comprador (favoritos y carrito) según el rol. */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ImageOff, ShoppingCart, Star, Store } from "lucide-react";
import axios from "axios";

import { formatPrice } from "@/shared/utils/formatPrice";
import { useAuth } from "@/features/public/auth/context/useAuth";
import { useCart } from "@/features/cart/context/useCart";
import { useFavorites } from "@/features/favorites/context/useFavorites";
import { useRedirectToLogin } from "@/features/public/auth/hooks/useRedirectToLogin";
import { useAlert } from "@/shared/components/alert/useAlert";

import type { PublicProductCard } from "../types/response";

interface ProductCardProps {
  product: PublicProductCard;
  /**
   * `new` fuerza el badge "Nuevo" y oculta el precio anterior (secciones de
   * Novedades). `offer`/`default` muestran el badge de descuento y el precio
   * tachado cuando corresponde.
   */
  kind?: "default" | "new" | "offer";
  /** `compact`: sin nombre de la tienda (perfil de la propia empresa) y carrito como botón de icono. */
  layout?: "default" | "compact";
}

export default function ProductCard({ product, kind = "default", layout = "default" }: ProductCardProps) {
  const { role, status } = useAuth();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const redirectToLogin = useRedirectToLogin();
  const { showAlert } = useAlert();

  const [savingFavorite, setSavingFavorite] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [failedImage, setFailedImage] = useState<string | null>(null);

  const isBuyerAction = role === null || role === "user";
  const isFav = isFavorite(product.id);
  const hasRating = product.review_count > 0 && product.average_rating !== null;
  const hasDiscount = product.discount_enabled && product.discount_percentage !== null;
  const showNewBadge = kind === "new";
  const showOldPrice = hasDiscount && kind !== "new";
  const image = product.image && product.image !== failedImage ? product.image : null;
  const productUrl = `/products/${product.id}`;
  const compact = layout === "compact";

  const handleToggleFavorite = async () => {
    if (savingFavorite) return;
    if (status === "loading") return;
    if (role === null) return redirectToLogin();
    if (role !== "user") return;

    try {
      setSavingFavorite(true);
      await toggleFavorite(product.id);
    } catch (error) {
      console.error("Error actualizando favoritos:", error);
    } finally {
      setSavingFavorite(false);
    }
  };

  const handleAddToCart = async () => {
    if (addingToCart) return;
    if (status === "loading") return;
    if (role === null) return redirectToLogin();
    if (role !== "user") return;

    try {
      setAddingToCart(true);
      await addItem(product.id, 1);
      showAlert("success", `"${product.name}" se agregó a tu carrito.`);
    } catch (error) {
      const detail = axios.isAxiosError(error) ? error.response?.data?.detail : undefined;
      showAlert("error", detail?.message ?? "No se pudo agregar el producto al carrito.");
    } finally {
      setAddingToCart(false);
    }
  };

  // Enlace "estirado": el título cubre la tarjeta con ::after, así toda ella navega sin anidar
  // los botones de favoritos y carrito dentro de un <a> (HTML inválido y confuso para lectores).
  return (
    <article className="group relative flex h-full flex-col rounded-card border border-hairline bg-surface-1 p-2.5 transition-[translate,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-white/15 hover:shadow-pop has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-secondary sm:p-3">
      {/* Marco oscuro neutro: la foto se muestra tal cual (sin forzarle un fondo) y la tarjeta conserva el tema. */}
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-control bg-surface-2">
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            width={400}
            height={300}
            onError={() => setFailedImage(image)}
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-400">
            <ImageOff size={26} aria-hidden="true" />
            <span className="text-[11px]">Imagen no disponible</span>
          </div>
        )}

        {showNewBadge ? (
          <span className="absolute left-2 top-2 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-white">
            Nuevo
          </span>
        ) : (
          hasDiscount && (
            <span className="absolute left-2 top-2 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-white">
              -{product.discount_percentage}%
            </span>
          )
        )}
      </div>

      {isBuyerAction && (
        <button
          type="button"
          onClick={handleToggleFavorite}
          disabled={savingFavorite}
          aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
          aria-pressed={isFav}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75 hover:text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary disabled:opacity-60 sm:right-5 sm:top-5"
        >
          <Heart size={16} className={isFav ? "fill-secondary text-secondary" : undefined} />
        </button>
      )}

      <div className="flex min-w-0 flex-1 flex-col px-1 pt-2.5">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-ink">
          <Link
            to={productUrl}
            title={product.name}
            className="outline-none after:absolute after:inset-0 after:rounded-card after:content-['']"
          >
            {product.name}
          </Link>
        </h3>

        {!compact && (
          <p className="mt-1 flex min-w-0 items-center gap-1 text-xs text-ink-muted">
            <Store size={12} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{product.company_name}</span>
          </p>
        )}

        <div className="mt-1 flex h-4 items-center gap-1 text-xs">
          {hasRating ? (
            <>
              <Star size={13} aria-hidden="true" className="fill-amber-400 text-amber-400" />
              <span className="font-semibold text-ink">{product.average_rating?.toFixed(1)}</span>
              <span className="text-ink-muted">
                ({product.review_count}
                <span className="sr-only"> reseñas</span>)
              </span>
            </>
          ) : (
            <span className="text-ink-muted/70">Sin reseñas</span>
          )}
        </div>

        {/* Con precios largos en tarjetas estrechas el carrito baja de línea: el precio no se encoge porque su
            tamaño es el que le da contraste suficiente al rojo. */}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-2">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-xl font-bold tabular-nums text-secondary">
              {formatPrice(hasDiscount ? product.final_price : product.price)}
            </span>
            {showOldPrice && (
              <span className="text-xs text-ink-muted/80 line-through">
                <span className="sr-only">Antes </span>
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {isBuyerAction && compact && (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={addingToCart}
              aria-label={`Agregar ${product.name} al carrito`}
              className="relative z-10 ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary text-white transition fill-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary disabled:opacity-60"
            >
              <ShoppingCart size={17} aria-hidden="true" />
            </button>
          )}
        </div>

        {isBuyerAction && !compact && (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addingToCart}
            aria-label={`Agregar ${product.name} al carrito`}
            className="relative z-10 mt-2.5 flex h-10 w-full items-center justify-center gap-1.5 rounded-control bg-primary text-sm font-semibold text-white transition fill-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary disabled:opacity-60"
          >
            <ShoppingCart size={15} aria-hidden="true" />
            Agregar
          </button>
        )}
      </div>
    </article>
  );
}
