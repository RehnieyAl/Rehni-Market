import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ImageOff, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import axios from "axios";

import { useCart } from "../context/useCart";
import {
  cartHasUnavailableItems,
  cartItemExceedsStock,
} from "../utils/availability";
import { formatPrice } from "@/shared/utils/formatPrice";
import { useAlert } from "@/shared/components/alert/useAlert";
import { Button, EmptyState, Skeleton } from "@/shared/components/ui";
import { buttonClasses } from "@/shared/components/ui/buttonVariants";

export default function CartView() {
  const navigate = useNavigate();
  const { cart, loading, updateItem, removeItem, clear } = useCart();
  const { showAlert } = useAlert();

  const items = cart?.items ?? [];

  const run = async (action: () => Promise<void>, fallback: string) => {
    try {
      await action();
    } catch (error) {
      const detail = axios.isAxiosError(error) ? error.response?.data?.detail : undefined;
      showAlert("error", detail?.message ?? fallback);
    }
  };

  const tax = Number(cart?.tax ?? 0);

  const hasUnavailableItems = cartHasUnavailableItems(items);

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Mi carrito</h1>
        <p className="mt-1 text-sm text-gray-500">
          Revisa tus productos antes de continuar al pago.
        </p>
      </header>

      {loading ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <Skeleton className="h-72 rounded-card" />
          <Skeleton className="h-56 rounded-card" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={<ShoppingCart size={22} />}
          title="Tu carrito está vacío"
          description="Agrega productos y vuelve aquí para finalizar tu compra."
          action={
            <Link to="/products" className={buttonClasses({ size: "sm" })}>
              Explorar productos
            </Link>
          }
        />
      ) : (
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-card border border-gray-200 bg-surface-1 shadow-card">
              {items.map((item) => {
                const outOfStock = item.availableStock <= 0;
                const exceedsStock = cartItemExceedsStock(item);
                const hasDiscount =
                  item.discountPercentage != null && item.discountPercentage > 0;

                return (
                  <li key={item.id} className="flex gap-4 p-4 sm:p-5">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-20 w-20 shrink-0 rounded-control bg-gray-50 object-contain p-1.5"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-control bg-gray-50 text-gray-300">
                        <ImageOff size={24} />
                      </div>
                    )}

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">{item.companyName}</p>
                          <h3 className="mt-0.5 line-clamp-1 font-semibold text-gray-900">
                            {item.name}
                          </h3>
                          {outOfStock ? (
                            <span className="mt-1 inline-flex items-center rounded-full bg-danger-bg px-2 py-0.5 text-xs font-bold text-danger">
                              Agotado
                            </span>
                          ) : (
                            exceedsStock && (
                              <span className="mt-1 inline-flex items-center rounded-full bg-danger-bg px-2 py-0.5 text-xs font-bold text-danger">
                                Sin stock suficiente
                              </span>
                            )
                          )}
                        </div>

                        <button
                          onClick={() =>
                            run(() => removeItem(item.id), "No se pudo eliminar el producto.")
                          }
                          className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-gray-400 transition hover:bg-danger-bg hover:text-danger"
                          aria-label={`Eliminar ${item.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {item.options.length > 0 ? (
                        <p className="mt-0.5 text-sm text-gray-500">
                          {item.options
                            .map((option) => `${option.attribute}: ${option.value}`)
                            .join(" · ")}
                        </p>
                      ) : (
                        item.variantName && (
                          <p className="mt-0.5 text-sm text-gray-500">{item.variantName}</p>
                        )
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-bold text-primary">
                          {formatPrice(item.unitPrice)}
                        </span>

                        {hasDiscount && (
                          <>
                            <span className="text-sm text-gray-400 line-through">
                              {formatPrice(item.basePrice)}
                            </span>
                            <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">
                              -{item.discountPercentage}%
                            </span>
                          </>
                        )}
                      </div>

                      {outOfStock && (
                        <p className="mt-1 text-xs font-semibold text-danger">
                          Este producto ya no tiene stock disponible. Elimínalo para
                          continuar con el pago.
                        </p>
                      )}

                      {exceedsStock && (
                        <p className="mt-1 text-xs font-semibold text-danger">
                          Solo quedan {item.availableStock} unidad
                          {item.availableStock === 1 ? "" : "es"}. Reduce la cantidad
                          para continuar con el pago.
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                        {outOfStock ? (
                          <button
                            onClick={() =>
                              run(
                                () => removeItem(item.id),
                                "No se pudo eliminar el producto.",
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-control border border-danger/30 px-3 py-1.5 text-sm font-medium text-danger transition hover:bg-danger-bg"
                          >
                            <Trash2 size={14} />
                            Eliminar producto
                          </button>
                        ) : (
                          <div className="inline-flex items-center rounded-control border border-gray-200">
                            <button
                              onClick={() =>
                                run(
                                  () =>
                                    updateItem(
                                      item.id,
                                      Math.max(
                                        1,
                                        Math.min(item.quantity - 1, item.availableStock),
                                      ),
                                    ),
                                  "No se pudo actualizar la cantidad.",
                                )
                              }
                              disabled={item.quantity <= 1}
                              className="flex h-9 w-9 items-center justify-center text-gray-600 transition hover:text-gray-900 disabled:opacity-40"
                              aria-label="Quitar una unidad"
                            >
                              <Minus size={14} />
                            </button>

                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                run(
                                  () =>
                                    updateItem(
                                      item.id,
                                      Math.min(item.availableStock, item.quantity + 1),
                                    ),
                                  "No se pudo actualizar la cantidad.",
                                )
                              }
                              disabled={item.quantity >= item.availableStock}
                              className="flex h-9 w-9 items-center justify-center text-gray-600 transition hover:text-gray-900 disabled:opacity-40"
                              aria-label="Agregar una unidad"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        )}

                        <span className="text-sm font-semibold text-gray-900">
                          {formatPrice(item.subtotal)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <button
              onClick={() => run(() => clear(), "No se pudo vaciar el carrito.")}
              className="text-sm font-medium text-danger transition hover:underline"
            >
              Vaciar carrito
            </button>
          </div>

          <div className="rounded-card border border-gray-200 bg-surface-1 p-6 shadow-card lg:sticky lg:top-6">
            <h2 className="font-semibold text-gray-900">Resumen</h2>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between text-gray-600">
                <dt>Subtotal ({cart?.totalItems ?? 0} producto{(cart?.totalItems ?? 0) === 1 ? "" : "s"})</dt>
                <dd>{formatPrice(cart?.subtotal ?? "0")}</dd>
              </div>

              <div className="flex items-center justify-between text-gray-600">
                <dt>IVA</dt>
                <dd>{tax > 0 ? formatPrice(cart?.tax ?? "0") : "No aplica"}</dd>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-base font-bold text-gray-900">
                <dt>Total</dt>
                <dd>{formatPrice(cart?.total ?? "0")}</dd>
              </div>
            </dl>

            <Button
              className="mt-6"
              fullWidth
              size="lg"
              trailingIcon={<ArrowRight size={18} />}
              disabled={hasUnavailableItems}
              onClick={() => navigate("/checkout")}
            >
              Ir a pagar
            </Button>

            <p className="mt-3 text-center text-xs text-gray-400">
              {hasUnavailableItems
                ? "Elimina o ajusta los productos sin stock para continuar al pago."
                : "El total definitivo se confirma en el checkout."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
