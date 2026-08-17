import { useCallback, useEffect, useState } from "react";
import { MapPin, Plus, Star, Trash2, X } from "lucide-react";

import AddressForm from "@/features/addresses/components/AddressForm";
import AddressDeleteConfirmModal from "@/features/addresses/components/AddressDeleteConfirmModal";
import { getAddresses, deleteAddress, setDefaultAddress } from "@/features/addresses/api/addressService";
import { useAlert } from "@/shared/components/alert/useAlert";

import type { Address } from "@/features/addresses/types/response";

export default function Addresses() {
  const { showAlert } = useAlert();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error("Error cargando direcciones:", error);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Direcciones</h1>

          <p className="mt-2 text-gray-500">
            Administra tus direcciones de envío.
          </p>
        </div>

        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-medium text-white hover:bg-red-800"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancelar" : "Agregar dirección"}
        </button>
      </div>

      {showForm && (
        <div className="mt-6 rounded-2xl border bg-white p-6">
          <AddressForm
            onSaved={handleSaved}
            onCancel={() => setShowForm(false)}
            hasExistingAddresses={addresses.length > 0}
          />
        </div>
      )}

      {loading ? (
        <p className="mt-8 text-gray-500">Cargando direcciones...</p>
      ) : addresses.length === 0 && !showForm ? (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <MapPin className="h-10 w-10 text-red-700" />
          </div>

          <h2 className="text-2xl font-semibold text-gray-900">
            Aún no has registrado direcciones.
          </h2>

          <button
            onClick={() => setShowForm(true)}
            className="mt-6 flex items-center gap-2 rounded-xl bg-red-700 px-6 py-3 text-sm font-medium text-white transition hover:bg-red-800 mx-auto"
          >
            <Plus size={16} />
            Agregar dirección
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="flex items-start justify-between gap-4 rounded-2xl border bg-white p-5"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{address.label ?? "Dirección"}</p>

                  {address.isDefault && (
                    <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      <Star size={11} className="fill-red-700" />
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
                    className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    title="Marcar como predeterminada"
                  >
                    <Star size={16} />
                  </button>
                )}

                <button
                  onClick={() => setDeleteTarget(address)}
                  disabled={actionId === address.id}
                  className="rounded-lg p-2 text-red-700 hover:bg-red-50 disabled:opacity-50"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddressDeleteConfirmModal
        isOpen={!!deleteTarget}
        addressLabel={deleteTarget?.label ?? "esta dirección"}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
