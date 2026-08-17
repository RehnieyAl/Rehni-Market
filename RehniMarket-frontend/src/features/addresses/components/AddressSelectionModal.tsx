import { useEffect, useState } from "react";
import { MapPin, Plus } from "lucide-react";

import Modal from "@/shared/components/modal";
import AddressForm from "./AddressForm";
import { getAddresses } from "../api/addressService";
import { useAlert } from "@/shared/components/alert/useAlert";

import type { Address } from "../types/response";

interface AddressSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Se llama con la dirección elegida al presionar "Continuar" - el
  // llamador decide qué hacer con ella (ver CheckoutView.tsx).
  onSelect: (address: Address) => void;
}

// Componente reutilizable (ver ALCANCE > Modal de direcciones): se abre
// cuando el usuario intenta comprar/hacer checkout sin una dirección
// seleccionada. Envuelve el Modal genérico del proyecto (ver
// shared/components/modal.tsx) - no crea un overlay/backdrop propio.
//
// Maneja su propio listado (no depende de que el llamador ya tenga uno
// cargado) para poder usarse desde cualquier lugar sin duplicar el
// fetch.
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

      // Estado 1 (sin direcciones, ver ALCANCE): entra directo al
      // formulario - no tiene sentido mostrarle un listado vacío antes.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSaved = (created: Address) => {
    setAddresses((prev) => [created, ...prev]);
    // 3. Seleccionar automáticamente la nueva dirección. 4. Cerrar
    // formulario. 5. Mantener abierto el modal principal (ver ALCANCE >
    // GUARDAR).
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dirección de entrega">
      {loading ? (
        <p className="py-8 text-center text-sm text-gray-500">Cargando direcciones...</p>
      ) : showForm ? (
        <AddressForm
          onSaved={handleSaved}
          onCancel={() => setShowForm(false)}
          hasExistingAddresses={addresses.length > 0}
        />
      ) : (
        <div>
          {addresses.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <MapPin className="h-8 w-8 text-red-700" />
              </div>

              <p className="text-gray-700">No tienes direcciones registradas.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm transition ${
                    selectedId === address.id
                      ? "border-red-700 bg-red-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedId === address.id}
                    onChange={() => setSelectedId(address.id)}
                    className="mt-1 accent-red-700"
                  />

                  <span>
                    <span className="block font-medium text-gray-900">
                      {address.label ?? "Dirección"}
                      {address.isDefault && (
                        <span className="ml-2 text-xs font-normal text-red-700">
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
            className="mt-4 flex items-center gap-2 text-sm font-medium text-red-700 hover:underline"
          >
            <Plus size={16} />
            Nueva dirección
          </button>

          {addresses.length > 0 && (
            <button
              onClick={handleContinue}
              className="mt-6 w-full rounded-xl bg-red-700 py-3 text-sm font-medium text-white hover:bg-red-800"
            >
              Continuar
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
