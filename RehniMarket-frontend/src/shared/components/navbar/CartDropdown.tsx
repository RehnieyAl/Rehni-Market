/** Desplegable del carrito del navbar: productos del CartProvider con variante, cantidad y subtotales calculados por
 * el backend, acceso al carrito completo y "Pagar", que solo navega al checkout existente (no cobra nada aquí). */
import { ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "@/features/cart/context/useCart";
import { cartHasUnavailableItems, isCartItemUnavailable } from "@/features/cart/utils/availability";
import ProductThumbnail from "@/shared/components/ProductThumbnail";
import { Button, buttonClasses } from "@/shared/components/ui";
import { formatAttributePairs } from "@/shared/utils/formatAttributes";
import { formatPrice } from "@/shared/utils/formatPrice";
import NavDropdown from "./NavDropdown";

interface CartDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerClassName: string;
}

export default function CartDropdown({ open, onOpenChange, triggerClassName }: CartDropdownProps) {
  const { cart, loading } = useCart();
  const navigate = useNavigate();
  const items = cart?.items ?? [];
  const totalItems = cart?.totalItems ?? 0;
  const blocked = cartHasUnavailableItems(items);
  const close = () => onOpenChange(false);

  return (
    <NavDropdown
      id="cart-menu"
      open={open}
      onOpenChange={onOpenChange}
      triggerLabel="Mi carrito"
      triggerClassName={triggerClassName}
      trigger={
        <>
          <ShoppingCart size={22} aria-hidden="true" />
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-semibold tabular-nums text-white">
              {totalItems}
            </span>
          )}
        </>
      }
      panelLabel="Carrito"
      panelClassName="flex max-h-[calc(100dvh-6rem)] w-[min(26rem,calc(100vw-2rem))] flex-col"
    >
      <div className="flex items-baseline justify-between gap-3 border-b border-hairline px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">Carrito</h2>
        {totalItems > 0 && (
          <span className="text-xs tabular-nums text-ink-muted">
            {totalItems} {totalItems === 1 ? "producto" : "productos"}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-8 text-center">
          {loading ? (
            <p className="text-sm text-ink-muted">Cargando carrito…</p>
          ) : (
            <>
              <p className="text-sm font-medium text-ink">Tu carrito está vacío</p>
              <Link to="/products" onClick={close} className="brand-link mt-3 inline-block text-sm font-medium">
                Explorar productos
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          <ul className="min-h-0 flex-1 divide-y divide-hairline overflow-y-auto overscroll-contain">
            {items.map((item) => {
              const variant = formatAttributePairs(item.options) || item.variantName;

              return (
                <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                  <ProductThumbnail src={item.image} />

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/products/${item.productId}`}
                      onClick={close}
                      className="line-clamp-2 text-sm font-medium text-ink hover:underline"
                    >
                      {item.name}
                    </Link>
                    {variant && <p className="mt-0.5 truncate text-xs text-ink-muted">{variant}</p>}
                    <p className="mt-0.5 text-xs tabular-nums text-ink-muted">
                      Cantidad: {item.quantity} · {formatPrice(item.unitPrice)} c/u
                    </p>
                    {isCartItemUnavailable(item) && <p className="text-xs text-danger">Sin stock suficiente</p>}
                  </div>

                  <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">{formatPrice(item.subtotal)}</span>
                </li>
              );
            })}
          </ul>

          <div className="space-y-3 border-t border-hairline p-4">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-ink-muted">Subtotal</span>
              <span className="font-semibold tabular-nums text-ink">{formatPrice(cart?.subtotal ?? "0")}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link to="/cart" onClick={close} className={buttonClasses({ variant: "outline", size: "sm" })}>
                Ver carrito
              </Link>
              <Button
                size="sm"
                disabled={blocked}
                onClick={() => {
                  close();
                  void navigate("/checkout");
                }}
              >
                Pagar
              </Button>
            </div>

            <p className="text-center text-xs text-ink-muted">
              {blocked
                ? "Ajusta en el carrito los productos sin stock para continuar al pago."
                : "El IVA y el total definitivo se confirman en el checkout."}
            </p>
          </div>
        </>
      )}
    </NavDropdown>
  );
}
