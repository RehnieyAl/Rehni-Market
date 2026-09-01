import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ImageOff, ShoppingCart, Star } from "lucide-react";
import axios from "axios";

import { formatPrice } from "@/shared/utils/formatPrice";
import { cn } from "@/shared/utils/cn";
import { useAuth } from "@/features/public/auth/context/useAuth";
import { useCart } from "@/features/cart/context/useCart";
import { useFavorites } from "@/features/favorites/context/useFavorites";
import { useRedirectToLogin } from "@/features/public/auth/hooks/useRedirectToLogin";
import { useAlert } from "@/shared/components/alert/useAlert";

import type { PublicProductCard } from "../types/response";

interface ProductCardProps {
  product: PublicProductCard;
  variant?: "grid" | "carousel";
}

export default function ProductCard({ product, variant = "grid" }: ProductCardProps) {
  const { role, status } = useAuth();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const redirectToLogin = useRedirectToLogin();
  const { showAlert } = useAlert();

  const [savingFavorite, setSavingFavorite] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const isBuyerAction = role === null || role === "user";
  const isFav = isFavorite(product.id);
  const hasRating = product.review_count > 0 && product.average_rating !== null;
  const hasDiscount =
    product.discount_enabled && product.discount_percentage !== null;

  const handleToggleFavorite = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

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

  const handleAddToCart = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (addingToCart) return;
    if (status === "loading") return;
    if (role === null) return redirectToLogin();
    if (role !== "user") return;

    try {
      setAddingToCart(true);
      await addItem(product.id, 1);
      showAlert("success", `"${product.name}" se agregó a tu carrito.`);
    } catch (error) {
      const detail = axios.isAxiosError(error)
        ? error.response?.data?.detail
        : undefined;
      showAlert(
        "error",
        detail?.message ?? "No se pudo agregar el producto al carrito.",
      );
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-card border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-pop",
        variant === "carousel" && "shadow-card",
      )}
    >
      <div className="relative w-full shrink-0 bg-white pb-[75%]">
        <div className="absolute inset-0 p-3">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300">
              <ImageOff size={32} />
            </div>
          )}
        </div>

        {hasDiscount && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">
            -{product.discount_percentage}%
          </span>
        )}

        {isBuyerAction && (
          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={savingFavorite}
            aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
            aria-pressed={isFav}
            className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm transition hover:text-primary disabled:opacity-60"
          >
            <Heart size={15} className={isFav ? "fill-primary text-primary" : undefined} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col px-3.5 pb-3 pt-2.5">
        <p className="truncate text-xs text-gray-500">{product.company_name}</p>

        <h3 className="mt-0.5 line-clamp-2 min-h-[2.25rem] text-sm font-semibold leading-snug text-gray-900">
          {product.name}
        </h3>

        {hasRating && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            <span className="font-semibold text-gray-900">
              {product.average_rating?.toFixed(1)}
            </span>
            <span className="text-gray-500">({product.review_count})</span>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            {hasDiscount ? (
              <>
                <span className="block text-xs text-gray-400 line-through">
                  {formatPrice(product.price)}
                </span>
                <span className="text-base font-bold text-primary">
                  {formatPrice(product.final_price)}
                </span>
              </>
            ) : (
              <span className="text-base font-bold text-primary">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {isBuyerAction && (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={addingToCart}
              aria-label={`Agregar ${product.name} al carrito`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary text-primary-fg transition hover:bg-primary-hover disabled:opacity-60"
            >
              <ShoppingCart size={16} />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
