import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, MapPin, Pencil } from "lucide-react";
import axios from "axios";

import { useCart } from "../context/useCart";
import { checkout } from "../api/checkoutService";
import { getAddresses } from "@/features/addresses/api/addressService";
import AddressSelectionModal from "@/features/addresses/components/AddressSelectionModal";
import { getMyWallet } from "@/features/wallet/api/walletService";
import { formatPrice } from "@/shared/utils/formatPrice";
import { useAlert } from "@/shared/components/alert/useAlert";
import { ErrorCode } from "@/shared/types/ErrorCode";

import type { Address } from "@/features/addresses/types/response";

// Checkout con dirección obligatoria; se gestiona desde AddressSelectionModal, sin redirigir a otra pantalla.
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

        // Sin dirección registrada: abre el modal de una vez, no un checkout que no se puede completar.
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
    // Comprar sin dirección seleccionada abre el modal (el backend ADDRESS_REQUIRED se maneja abajo como resguardo).
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

      // Stock agotado o variante retirada mientras el carrito estaba abierto: el backend rechaza
      // y aquí se recarga para reflejar el estado real antes de reintentar.
      if (
        detail?.code === ErrorCode.INSUFFICIENT_STOCK ||
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
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          ¡Tu compra fue confirmada!
        </h1>

        <p className="mt-2 text-gray-500">
          Pagaste con RehniCoin. Puedes seguir el estado de tu pedido en "Mis pedidos".
        </p>

        <Link
          to="/user/dashboard?tab=orders"
          className="mt-6 inline-block rounded-xl bg-[#6D0F2D] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#530A20]"
        >
          Ver mis pedidos
        </Link>
      </section>
    );
  }

  if (loading || !addressesLoaded) {
    return <p className="mx-auto max-w-5xl px-4 py-16 text-gray-500">Cargando...</p>;
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-lg text-gray-700">Tu carrito está vacío.</p>

        <Link
          to="/products"
          className="mt-6 inline-block rounded-xl bg-[#6D0F2D] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#530A20]"
        >
          Explorar productos
        </Link>
      </section>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0);
  const tax = subtotal * 0.19;
  const total = subtotal + tax;
  const hasEnoughBalance = Number(walletBalance) >= total;

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">

          <div className="rounded-2xl border bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                <MapPin size={18} />
                Dirección de envío
              </h2>

              {selectedAddress && (
                <button
                  onClick={() => setAddressModalOpen(true)}
                  className="flex items-center gap-1.5 text-sm font-medium text-[#6D0F2D] hover:underline"
                >
                  <Pencil size={14} />
                  Cambiar
                </button>
              )}
            </div>

            {selectedAddress ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
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
                className="w-full rounded-xl border border-dashed border-gray-300 py-4 text-sm font-medium text-[#6D0F2D] hover:bg-gray-50"
              >
                + Agregar dirección de entrega
              </button>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-6">
            <h2 className="mb-4 font-semibold text-gray-900">Productos</h2>

            <div className="divide-y divide-gray-100">
              {items.map((item) => {
                const optionsLabel =
                  item.options.length > 0
                    ? item.options.map((option) => option.value).join(" / ")
                    : item.variantName;

                return (
                  <div key={item.id} className="flex justify-between gap-3 py-3 text-sm">
                    <span className="text-gray-700">
                      {item.quantity} × {item.name}
                      {optionsLabel ? ` (${optionsLabel})` : ""}
                    </span>
                    <span className="font-medium">{formatPrice(item.subtotal)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="h-fit rounded-2xl border bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-900">Resumen</h2>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span>Impuestos (19%)</span>
              <span>{formatPrice(tax)}</span>
            </div>

            <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 p-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Saldo RehniCoin</span>
              <span className="font-medium">{formatPrice(walletBalance)}</span>
            </div>

            {!hasEnoughBalance && (
              <p className="mt-2 text-xs text-red-600">
                Tu saldo no alcanza para esta compra.{" "}
                <Link to="/user/dashboard?tab=profile" className="underline">
                  Recarga en tu cuenta
                </Link>
                .
              </p>
            )}
          </div>

          <button
            onClick={handleConfirm}
            disabled={confirming || !hasEnoughBalance}
            className="mt-6 w-full rounded-xl bg-[#6D0F2D] py-3 font-medium text-white transition hover:bg-[#530A20] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirming
              ? "Confirmando..."
              : selectedAddress
                ? "Confirmar compra"
                : "Elegir dirección para continuar"}
          </button>
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
