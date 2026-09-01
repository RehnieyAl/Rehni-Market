import { useEffect, useState } from "react";
import { MapPin, Plus } from "lucide-react";

import AddressForm from "./AddressForm";
import { getAddresses } from "../api/addressService";
import { useAlert } from "@/shared/components/alert/useAlert";
import { Modal, Button, EmptyState, Spinner } from "@/shared/components/ui";

import type { Address } from "../types/response";

interface AddressSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: Address) => void;
}

export default function AddressSelectionModal({
  isOpen,
  onClose,
  onSelect,
}: AddressSelectionModalProps) {
  const { showAlert } = useAlert();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadAddresses = async () => {
    try {
      setLoading(true);

      const data = await getAddresses();

      setAddresses(data);

      const defaultAddress = data.find((a) => a.isDefault) ?? data[0];
      setSelectedId(defaultAddress?.id ?? null);

      setShowForm(data.length === 0);
    } catch (error) {
      console.error("Error cargando direcciones:", error);
      showAlert("error", "No se pudieron cargar tus direcciones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const timeout = setTimeout(loadAddresses);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  const handleSaved = (created: Address) => {
    setAddresses((prev) => [created, ...prev]);
    setSelectedId(created.id);
    setShowForm(false);
  };

  const handleContinue = () => {
    const selected = addresses.find((a) => a.id === selectedId);

    if (!selected) {
      showAlert("error", "Selecciona una dirección para continuar.");
      return;
    }

    onSelect(selected);
    onClose();
  };

  const canContinue = !loading && !showForm && addresses.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dirección de entrega"
      footer={
        canContinue ? (
          <Button fullWidth onClick={handleContinue}>
            Continuar
          </Button>
        ) : undefined
      }
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
          <Spinner /> Cargando direcciones...
        </div>
      ) : showForm ? (
        <AddressForm
          onSaved={handleSaved}
          onCancel={() => setShowForm(false)}
          hasExistingAddresses={addresses.length > 0}
        />
      ) : (
        <div>
          {addresses.length === 0 ? (
            <EmptyState
              variant="plain"
              icon={<MapPin size={22} />}
              title="No tienes direcciones registradas"
              description="Agrega una para continuar con tu compra."
            />
          ) : (
            <div className="space-y-2">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-control border p-4 text-sm transition ${
                    selectedId === address.id
                      ? "border-primary bg-brand-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedId === address.id}
                    onChange={() => setSelectedId(address.id)}
                    className="mt-1 accent-primary"
                  />

                  <span>
                    <span className="block font-medium text-gray-900">
                      {address.label ?? "Dirección"}
                      {address.isDefault && (
                        <span className="ml-2 text-xs font-normal text-primary">
                          (predeterminada)
                        </span>
                      )}
                    </span>

                    <span className="mt-0.5 block text-gray-500">{address.address}</span>
                    <span className="block text-gray-500">{address.city}</span>
                  </span>
                </label>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowForm(true)}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Plus size={16} />
            Nueva dirección
          </button>
        </div>
      )}
    </Modal>
  );
}
