import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, MapPin, Pencil, ShoppingCart } from "lucide-react";
import axios from "axios";

import { useCart } from "../context/useCart";
import { checkout } from "../api/checkoutService";
import {
  cartHasUnavailableItems,
  isCartItemUnavailable,
} from "../utils/availability";
import { getAddresses } from "@/features/addresses/api/addressService";
import AddressSelectionModal from "@/features/addresses/components/AddressSelectionModal";
import { getMyWallet } from "@/features/wallet/api/walletService";
import { formatPrice } from "@/shared/utils/formatPrice";
import { Button, EmptyState, Skeleton } from "@/shared/components/ui";
import { buttonClasses } from "@/shared/components/ui/buttonVariants";
import { useAlert } from "@/shared/components/alert/useAlert";
import { ErrorCode } from "@/shared/types/ErrorCode";

import type { Address } from "@/features/addresses/types/response";

export default function CheckoutView() {
  const { cart, loading, refreshCart } = useCart();
  const { showAlert } = useAlert();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const [walletBalance, setWalletBalance] = useState<string>("0");

  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [addressList, wallet] = await Promise.all([getAddresses(), getMyWallet()]);

        setWalletBalance(wallet.balance);

        const defaultAddress = addressList.find((a) => a.isDefault) ?? addressList[0] ?? null;
        setSelectedAddress(defaultAddress);

        if (!defaultAddress) {
          setAddressModalOpen(true);
        }
      } catch (error) {
        console.error("Error cargando datos de checkout:", error);
      } finally {
        setAddressesLoaded(true);
      }
    };

    load();
  }, []);

  const items = cart?.items ?? [];

  const handleConfirm = async () => {
    if (!selectedAddress) {
      setAddressModalOpen(true);
      return;
    }

    try {
      setConfirming(true);

      await checkout({ addressId: selectedAddress.id });

      await refreshCart();
      setSuccess(true);
    } catch (error) {
      console.error("Error confirmando el pedido:", error);

      const detail = axios.isAxiosError(error) ? error.response?.data?.detail : undefined;

      if (detail?.code === ErrorCode.ADDRESS_REQUIRED) {
        showAlert("error", detail.message ?? "Debes registrar una dirección para continuar con la compra.");
        setAddressModalOpen(true);
        return;
      }

      if (
        detail?.code === ErrorCode.INSUFFICIENT_STOCK ||
        detail?.code === ErrorCode.PRODUCT_OUT_OF_STOCK ||
        detail?.code === ErrorCode.PRODUCT_NOT_FOUND ||
        detail?.code === ErrorCode.VARIANT_NOT_FOUND
      ) {
        await refreshCart();
        showAlert("error", detail.message ?? "Un producto de tu carrito ya no está disponible.");
        return;
      }

      showAlert("error", detail?.message ?? "No se pudo completar la compra. Intenta de nuevo.");
    } finally {
      setConfirming(false);
    }
  };

  if (success) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success-bg text-success">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          ¡Tu compra fue confirmada!
        </h1>

        <p className="mt-2 text-gray-500">
          Pagaste con RehniCoin. Puedes seguir el estado de tu pedido en "Mis pedidos".
        </p>

        <Link
          to="/user/dashboard?tab=orders"
          className={buttonClasses({ className: "mt-6" })}
        >
          Ver mis pedidos
        </Link>
      </section>
    );
  }

  if (loading || !addressesLoaded) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <Skeleton className="h-9 w-40 rounded-control" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <Skeleton className="h-40 rounded-card" />
            <Skeleton className="h-56 rounded-card" />
          </div>
          <Skeleton className="h-64 rounded-card" />
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={<ShoppingCart size={22} />}
          title="Tu carrito está vacío"
          description="Agrega productos para continuar con tu compra."
          action={
            <Link to="/products" className={buttonClasses({ size: "sm" })}>
              Explorar productos
            </Link>
          }
        />
      </section>
    );
  }

  const subtotal = cart?.subtotal ?? "0";
  const tax = Number(cart?.tax ?? 0);
  const total = Number(cart?.total ?? 0);
  const hasEnoughBalance = Number(walletBalance) >= total;

  const hasUnavailableItems = cartHasUnavailableItems(items);
  const canConfirm = hasEnoughBalance && !hasUnavailableItems;

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Checkout</h1>
        <p className="mt-1 text-sm text-gray-500">
          Confirma tu dirección y finaliza el pago con RehniCoin.
        </p>
      </header>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="rounded-card border border-gray-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                <MapPin size={18} className="text-gray-400" />
                Dirección de envío
              </h2>

              {selectedAddress && (
                <button
                  onClick={() => setAddressModalOpen(true)}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary transition hover:text-primary-hover"
                >
                  <Pencil size={14} />
                  Cambiar
                </button>
              )}
            </div>

            {selectedAddress ? (
              <div className="mt-4 rounded-control bg-gray-50 p-4 text-sm">
                <p className="font-medium text-gray-900">
                  {selectedAddress.label ?? "Dirección"}
                  {selectedAddress.fullName ? ` · ${selectedAddress.fullName}` : ""}
                </p>

                <p className="mt-1 text-gray-600">
                  {selectedAddress.address}, {selectedAddress.city}, {selectedAddress.department}
                </p>

                <p className="mt-1 text-gray-600">Tel: {selectedAddress.phone}</p>
              </div>
            ) : (
              <button
                onClick={() => setAddressModalOpen(true)}
                className="mt-4 w-full rounded-control border border-dashed border-gray-300 py-4 text-sm font-medium text-primary transition hover:bg-gray-50"
              >
                + Agregar dirección de entrega
              </button>
            )}
          </div>

          <div className="rounded-card border border-gray-200 bg-white p-6 shadow-card">
            <h2 className="font-semibold text-gray-900">Productos</h2>

            <ul className="mt-3 divide-y divide-gray-100">
              {items.map((item) => {
                const optionsLabel =
                  item.options.length > 0
                    ? item.options.map((option) => option.value).join(" / ")
                    : item.variantName;

                const unavailable = isCartItemUnavailable(item);

                return (
                  <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
                    <span className="text-gray-700">
                      {item.quantity} × {item.name}
                      {optionsLabel ? ` (${optionsLabel})` : ""}
                      {unavailable && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-danger-bg px-2 py-0.5 text-xs font-bold text-danger">
                          {item.availableStock <= 0 ? "Agotado" : "Sin stock suficiente"}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 font-medium text-gray-900">
                      {formatPrice(item.subtotal)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="rounded-card border border-gray-200 bg-white p-6 shadow-card lg:sticky lg:top-6">
          <h2 className="font-semibold text-gray-900">Resumen</h2>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <dt>Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>

            <div className="flex justify-between text-gray-600">
              <dt>IVA</dt>
              <dd>{tax > 0 ? formatPrice(cart?.tax ?? "0") : "No aplica"}</dd>
            </div>

            <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold text-gray-900">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>

          <div className="mt-4 rounded-control bg-gray-50 p-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Saldo RehniCoin</span>
              <span className="font-medium text-gray-900">{formatPrice(walletBalance)}</span>
            </div>

            {!hasEnoughBalance && (
              <p className="mt-2 text-xs text-danger">
                Tu saldo no alcanza para esta compra.{" "}
                <Link to="/user/dashboard?tab=wallet" className="font-medium underline">
                  Recarga en tu cuenta
                </Link>
                .
              </p>
            )}
          </div>

          {hasUnavailableItems && (
            <p className="mt-4 rounded-control bg-danger-bg p-3 text-xs text-danger">
              Hay productos agotados o sin stock suficiente en tu carrito.{" "}
              <Link to="/cart" className="font-medium underline">
                Vuelve al carrito
              </Link>{" "}
              para eliminarlos o ajustar la cantidad.
            </p>
          )}

          <Button
            className="mt-6"
            fullWidth
            size="lg"
            loading={confirming}
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            {confirming
              ? "Confirmando…"
              : selectedAddress
                ? "Confirmar compra"
                : "Elegir dirección para continuar"}
          </Button>
        </div>
      </div>

      <AddressSelectionModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onSelect={setSelectedAddress}
      />
    </section>
  );
}
