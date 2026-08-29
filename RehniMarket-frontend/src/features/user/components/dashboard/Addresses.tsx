import { useCallback, useEffect, useState } from "react";
import { MapPin, Plus, Star, Trash2, X } from "lucide-react";

import AddressForm from "@/features/addresses/components/AddressForm";
import ConfirmModal from "@/shared/components/ConfirmModal";
import { getAddresses, deleteAddress, setDefaultAddress } from "@/features/addresses/api/addressService";
import { useAlert } from "@/shared/components/alert/useAlert";
import { Button, EmptyState, ErrorState, Skeleton } from "@/shared/components/ui";

import type { Address } from "@/features/addresses/types/response";

export default function Addresses() {
  const { showAlert } = useAlert();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true);
      setFailed(false);
      const data = await getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error("Error cargando direcciones:", error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(loadAddresses);
    return () => clearTimeout(timeout);
  }, [loadAddresses]);

  const handleSaved = (created: Address) => {
    setAddresses((prev) => [created, ...prev]);
    setShowForm(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await deleteAddress(deleteTarget.id);

      setAddresses((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      showAlert("success", "Dirección eliminada.");
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error eliminando dirección:", error);
      showAlert("error", "No se pudo eliminar la dirección.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      setActionId(addressId);
      await setDefaultAddress(addressId);
      await loadAddresses();
    } catch (error) {
      console.error("Error marcando dirección predeterminada:", error);
      showAlert("error", "No se pudo marcar la dirección como predeterminada.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Direcciones</h1>

          <p className="mt-1 text-sm text-gray-500">
            Administra tus direcciones de envío.
          </p>
        </div>

        <Button
          variant={showForm ? "outline" : "primary"}
          leadingIcon={showForm ? <X size={16} /> : <Plus size={16} />}
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Cancelar" : "Agregar dirección"}
        </Button>
      </div>

      {showForm && (
        <div className="mt-6 rounded-card border border-gray-200 bg-white p-6 shadow-card">
          <AddressForm
            onSaved={handleSaved}
            onCancel={() => setShowForm(false)}
            hasExistingAddresses={addresses.length > 0}
          />
        </div>
      )}

      {loading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-card" />
          ))}
        </div>
      ) : failed ? (
        <ErrorState
          className="mt-8"
          title="No pudimos cargar tus direcciones"
          onRetry={loadAddresses}
        />
      ) : addresses.length === 0 && !showForm ? (
        <EmptyState
          className="mt-8"
          icon={<MapPin size={22} />}
          title="Aún no has registrado direcciones"
          description="Agrega una dirección para agilizar tus próximas compras."
          action={
            <Button size="sm" leadingIcon={<Plus size={16} />} onClick={() => setShowForm(true)}>
              Agregar dirección
            </Button>
          }
        />
      ) : (
        <div className="mt-8 space-y-3">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="flex items-start justify-between gap-4 rounded-card border border-gray-200 bg-white p-5 shadow-card"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{address.label ?? "Dirección"}</p>

                  {address.isDefault && (
                    <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-primary">
                      <Star size={11} className="fill-primary" />
                      Predeterminada
                    </span>
                  )}
                </div>

                {address.fullName && (
                  <p className="mt-1 text-sm text-gray-700">{address.fullName}</p>
                )}

                <p className="mt-1 text-sm text-gray-500">
                  {address.address}, {address.city}, {address.department}
                </p>

                <p className="text-sm text-gray-500">Tel: {address.phone}</p>

                {address.additionalInstructions && (
                  <p className="mt-1 text-xs text-gray-400">{address.additionalInstructions}</p>
                )}
              </div>

              <div className="flex shrink-0 gap-1">
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    disabled={actionId === address.id}
                    className="flex h-9 w-9 items-center justify-center rounded-control text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
                    title="Marcar como predeterminada"
                    aria-label={`Marcar ${address.label ?? "dirección"} como predeterminada`}
                  >
                    <Star size={16} />
                  </button>
                )}

                <button
                  onClick={() => setDeleteTarget(address)}
                  disabled={actionId === address.id}
                  className="flex h-9 w-9 items-center justify-center rounded-control text-danger transition hover:bg-danger-bg disabled:opacity-50"
                  title="Eliminar"
                  aria-label={`Eliminar ${address.label ?? "dirección"}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Eliminar dirección"
        tone="danger"
        confirmLabel="Eliminar dirección"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
        message={
          <>
            Estás a punto de eliminar{" "}
            <span className="font-semibold text-gray-900">
              {deleteTarget?.label ?? "esta dirección"}
            </span>
            .{" "}
            <span className="font-medium text-danger">
              Esta acción no se puede deshacer.
            </span>
          </>
        }
      />
    </div>
  );
}
