import { Link, useNavigate } from "react-router-dom";
import { ImageOff, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

import { useCart } from "../context/useCart";
import { formatPrice } from "@/shared/utils/formatPrice";

export default function CartView() {
  const navigate = useNavigate();
  const { cart, loading, updateItem, removeItem, clear } = useCart();

  const items = cart?.items ?? [];

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold">Mi carrito</h1>

      {loading ? (
        <p className="mt-8 text-gray-500">Cargando carrito...</p>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <ShoppingCart className="h-10 w-10 text-[#6D0F2D]" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900">
            Tu carrito está vacío.
          </h2>

          <Link
            to="/products"
            className="mt-6 inline-block rounded-xl bg-[#6D0F2D] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#530A20]"
          >
            Explorar productos
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* ITEMS */}
          <div className="space-y-4">
            {items.map((item) => (
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

                  {item.variantName && (
                    <p className="text-sm text-gray-500">{item.variantName}</p>
                  )}

                  {item.color && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <span
                        className="h-3 w-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: item.color.hex_color }}
                      />
                      {item.color.name}
                    </div>
                  )}

                  <p className="mt-2 font-bold text-[#6D0F2D]">
                    {formatPrice(item.unitPrice)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-3">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-400 transition hover:text-red-600"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>

                  <div className="flex items-center rounded-xl border">
                    <button
                      onClick={() =>
                        updateItem(item.id, Math.max(1, item.quantity - 1))
                      }
                      disabled={item.quantity <= 1}
                      className="px-3 py-1.5 disabled:opacity-40"
                    >
                      <Minus size={14} />
                    </button>

                    <span className="w-8 text-center text-sm">{item.quantity}</span>

                    <button
                      onClick={() =>
                        updateItem(
                          item.id,
                          Math.min(item.availableStock, item.quantity + 1),
                        )
                      }
                      disabled={item.quantity >= item.availableStock}
                      className="px-3 py-1.5 disabled:opacity-40"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => clear()}
              className="text-sm font-medium text-red-600 hover:underline"
            >
              Vaciar carrito
            </button>
          </div>

          {/* RESUMEN */}
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
