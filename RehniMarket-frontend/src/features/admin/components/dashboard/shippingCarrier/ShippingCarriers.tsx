import { useEffect, useState } from "react";
import { Plus, Pencil, Power } from "lucide-react";

import ShippingCarrierFormModal from "./ShippingCarrierFormModal";

import {
  getAdminShippingCarriers,
  createAdminShippingCarrier,
  updateAdminShippingCarrier,
  changeAdminShippingCarrierStatus,
} from "@/features/admin/api/shippingCarrierService";

import type { AdminShippingCarrierResponse } from "@/features/admin/types/response";

// CRUD de transportadoras (ver ALCANCE > Transportadoras) - mismo
// patrón que Catalogs.tsx: activar/desactivar en vez de eliminar (no hay
// endpoint de borrado físico, ver backend > ModelShippingCarrier.py),
// para no romper la referencia de los pedidos que ya usaron una
// transportadora.
export default function ShippingCarriers() {
  const [carriers, setCarriers] = useState<AdminShippingCarrierResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] =
    useState<AdminShippingCarrierResponse | null>(null);
  const [saving, setSaving] = useState(false);

  const [statusChangingId, setStatusChangingId] = useState<string | null>(null);

  useEffect(() => {
    const loadCarriers = async () => {
      try {
        setLoading(true);

        const response = await getAdminShippingCarriers();

        setCarriers(response);
      } catch (error) {
        console.error("Error cargando transportadoras:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCarriers();
  }, []);

  const handleOpenCreate = () => {
    setEditingCarrier(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (carrier: AdminShippingCarrierResponse) => {
    setEditingCarrier(carrier);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    if (saving) return;

    setFormOpen(false);
    setEditingCarrier(null);
  };

  const handleSubmitForm = async (name: string, trackingUrl: string, isActive: boolean) => {
    try {
      setSaving(true);

      if (editingCarrier) {
        const updated = await updateAdminShippingCarrier(editingCarrier.id, {
          name,
          tracking_url: trackingUrl,
          is_active: isActive,
        });

        setCarriers((current) =>
          current
            .map((carrier) => (carrier.id === updated.id ? updated : carrier))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      } else {
        const created = await createAdminShippingCarrier({
          name,
          tracking_url: trackingUrl,
          is_active: isActive,
        });

        setCarriers((current) =>
          [...current, created].sort((a, b) => a.name.localeCompare(b.name)),
        );
      }

      setFormOpen(false);
      setEditingCarrier(null);
    } catch (error) {
      console.error("Error guardando transportadora:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (carrier: AdminShippingCarrierResponse) => {
    try {
      setStatusChangingId(carrier.id);

      const updated = await changeAdminShippingCarrierStatus(carrier.id, !carrier.is_active);

      setCarriers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (error) {
      console.error("Error cambiando el estado de la transportadora:", error);
    } finally {
      setStatusChangingId(null);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Transportadoras</h2>
          <p className="mt-1 text-sm text-gray-500">
            Empresas transportadoras disponibles para que las empresas envíen sus pedidos.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-xl bg-[#7A1833] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#64132a]"
        >
          <Plus size={18} />
          Nueva transportadora
        </button>
      </div>

      <section className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="h-[420px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">URL de seguimiento</th>
                <th className="px-5 py-3 text-center font-medium">Estado</th>
                <th className="px-5 py-3 text-center font-medium">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500">
                    Cargando transportadoras...
                  </td>
                </tr>
              ) : carriers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500">
                    No hay transportadoras creadas todavía.
                  </td>
                </tr>
              ) : (
                carriers.map((carrier) => (
                  <tr
                    key={carrier.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                      {carrier.name}
                    </td>

                    <td className="max-w-xs truncate px-5 py-3 text-sm text-gray-500">
                      {carrier.tracking_url}
                    </td>

                    <td className="px-5 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          carrier.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {carrier.is_active ? "Activa" : "Inactiva"}
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(carrier)}
                          disabled={statusChangingId === carrier.id}
                          className={`rounded-lg p-2 transition hover:bg-gray-100 disabled:opacity-50 ${
                            carrier.is_active ? "text-green-600" : "text-gray-400"
                          }`}
                          title={carrier.is_active ? "Desactivar transportadora" : "Activar transportadora"}
                        >
                          <Power size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(carrier)}
                          className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
                          title="Editar transportadora"
                        >
                          <Pencil size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ShippingCarrierFormModal
        key={formOpen ? (editingCarrier?.id ?? "new") : "closed"}
        isOpen={formOpen}
        carrier={editingCarrier}
        loading={saving}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
      />
    </div>
  );
}
