import { Link, useNavigate } from "react-router-dom";
import { ImageOff, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import axios from "axios";

import { useCart } from "../context/useCart";
import { formatPrice } from "@/shared/utils/formatPrice";
import { useAlert } from "@/shared/components/alert/useAlert";
import { EmptyState, Skeleton } from "@/shared/components/ui";
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

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold">Mi carrito</h1>

      {loading ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-card" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-card" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          className="mt-8"
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
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">

          <div className="space-y-4">
            {items.map((item) => {
              const outOfStock = item.availableStock <= 0;
              const hasDiscount =
                item.discountPercentage != null && item.discountPercentage > 0;

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-2xl border bg-white p-4"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-20 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-300">
                      <ImageOff size={24} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">{item.companyName}</p>

                    <h3 className="truncate font-semibold text-gray-900">
                      {item.name}
                    </h3>

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

                    {item.sku && (
                      <p className="mt-0.5 text-xs text-gray-400">SKU: {item.sku}</p>
                    )}

                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-bold text-[#6D0F2D]">
                        {formatPrice(item.unitPrice)}
                      </span>

                      {hasDiscount && (
                        <>
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice(item.basePrice)}
                          </span>
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                            -{item.discountPercentage}%
                          </span>
                        </>
                      )}
                    </div>

                    {outOfStock && (
                      <p className="mt-1 text-xs font-semibold text-red-600">
                        Este producto ya no tiene stock disponible.
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-3">
                    <button
                      onClick={() =>
                        run(() => removeItem(item.id), "No se pudo eliminar el producto.")
                      }
                      className="text-gray-400 transition hover:text-red-600"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>

                    <div className="flex items-center rounded-xl border">
                      <button
                        onClick={() =>
                          run(
                            () => updateItem(item.id, Math.max(1, item.quantity - 1)),
                            "No se pudo actualizar la cantidad.",
                          )
                        }
                        disabled={item.quantity <= 1}
                        className="px-3 py-1.5 disabled:opacity-40"
                      >
                        <Minus size={14} />
                      </button>

                      <span className="w-8 text-center text-sm">{item.quantity}</span>

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
                        disabled={outOfStock || item.quantity >= item.availableStock}
                        className="px-3 py-1.5 disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => run(() => clear(), "No se pudo vaciar el carrito.")}
              className="text-sm font-medium text-red-600 hover:underline"
            >
              Vaciar carrito
            </button>
          </div>

          <div className="h-fit rounded-2xl border bg-white p-6">
            <h2 className="mb-4 font-semibold text-gray-900">Resumen</h2>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Productos ({cart?.totalItems ?? 0})</span>
              <span>{formatPrice(cart?.subtotal ?? "0")}</span>
            </div>

            <p className="mt-1 text-xs text-gray-400">
              Impuestos y total final se calculan en el checkout.
            </p>

            <button
              onClick={() => navigate("/checkout")}
              className="mt-6 w-full rounded-xl bg-[#6D0F2D] py-3 font-medium text-white transition hover:bg-[#530A20]"
            >
              Ir a pagar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
