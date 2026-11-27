/** Direcciones de envío del comprador: tarjetas con la predeterminada destacada, alta, marcar como
 * predeterminada y eliminación con confirmación. */
import { useCallback, useEffect, useState } from "react";
import { MapPin, Plus, Star, Trash2, X } from "lucide-react";

import AddressForm from "@/features/addresses/components/AddressForm";
import ConfirmModal from "@/shared/components/ConfirmModal";
import DashboardPageHeader from "@/shared/components/dashboard/DashboardPageHeader";
import DashboardSection from "@/shared/components/dashboard/DashboardSection";
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
    <div className="space-y-6">
      <DashboardPageHeader
        icon={<MapPin size={26} />}
        title="Direcciones"
        description="Administra tus direcciones de envío y elige la predeterminada para tus compras."
        action={
          <Button
            variant={showForm ? "outline" : "primary"}
            leadingIcon={showForm ? <X size={16} /> : <Plus size={16} />}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Cancelar" : "Agregar dirección"}
          </Button>
        }
      />

      {showForm && (
        <DashboardSection title="Nueva dirección" icon={<MapPin size={18} />}>
          <AddressForm
            onSaved={handleSaved}
            onCancel={() => setShowForm(false)}
            hasExistingAddresses={addresses.length > 0}
          />
        </DashboardSection>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-card" />
          ))}
        </div>
      ) : failed ? (
        <ErrorState
          title="No pudimos cargar tus direcciones"
          onRetry={loadAddresses}
        />
      ) : addresses.length === 0 && !showForm ? (
        <EmptyState
          icon={<MapPin size={22} />}
          title="Aún no has registrado direcciones"
          description="Agrega una dirección con el botón de arriba para agilizar tus próximas compras."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <li
              key={address.id}
              className={`flex items-start justify-between gap-4 rounded-card border bg-surface-1 p-5 ${
                address.isDefault ? "border-secondary/40" : "border-hairline"
              }`}
            >
              <div className="flex min-w-0 gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary"
                >
                  <MapPin size={18} />
                </span>
                <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-ink">{address.label ?? "Dirección"}</p>

                  {address.isDefault && (
                    <span className="flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">
                      <Star size={11} className="fill-secondary" aria-hidden="true" />
                      Predeterminada
                    </span>
                  )}
                </div>

                {address.fullName && <p className="mt-1 text-sm text-ink">{address.fullName}</p>}

                <p className="mt-1 text-sm text-ink-muted">
                  {address.address}, {address.city}, {address.department}
                </p>

                <p className="text-sm text-ink-muted">Tel: {address.phone}</p>

                {address.additionalInstructions && (
                  <p className="mt-1 text-xs text-ink-muted">{address.additionalInstructions}</p>
                )}
                </div>
              </div>

              <div className="flex shrink-0 gap-1">
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    disabled={actionId === address.id}
                    className="flex h-9 w-9 items-center justify-center rounded-control text-ink-muted transition hover:bg-white/5 hover:text-secondary disabled:opacity-50"
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
            </li>
          ))}
        </ul>
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
            <span className="font-semibold text-ink">
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
