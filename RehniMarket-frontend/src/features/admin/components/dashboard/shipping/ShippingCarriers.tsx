import { useEffect, useState } from "react";
import { Plus, Pencil, Power, Truck } from "lucide-react";

import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  TableSkeleton,
} from "@/shared/components/ui";
import {
  getShippingCarriers,
  changeShippingCarrierStatus,
} from "@/features/admin/api/shippingCarrierService";
import ShippingCarrierFormModal from "./ShippingCarrierFormModal";

import type { ShippingCarrier } from "@/features/admin/types/response";

export default function ShippingCarriers() {
  const [carriers, setCarriers] = useState<ShippingCarrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingCarrier | null>(null);
  const [statusChangingId, setStatusChangingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setFailed(false);

        const list = await getShippingCarriers();
        if (!cancelled) setCarriers(list);
      } catch (error) {
        console.error("Error cargando transportadoras:", error);
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleSaved = (saved: ShippingCarrier) => {
    setCarriers((current) => {
      const exists = current.some((carrier) => carrier.id === saved.id);
      const next = exists
        ? current.map((carrier) => (carrier.id === saved.id ? saved : carrier))
        : [...current, saved];
      return [...next].sort((a, b) => a.name.localeCompare(b.name, "es"));
    });
    setFormOpen(false);
    setEditing(null);
  };

  const handleToggleStatus = async (carrier: ShippingCarrier) => {
    try {
      setStatusChangingId(carrier.id);
      const updated = await changeShippingCarrierStatus(carrier.id, !carrier.is_active);
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
      <div className="flex flex-wrap items-start justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Transportadoras</h1>
          <p className="mt-1 text-sm text-gray-500">
            Catálogo global. Las empresas eligen una transportadora activa al despachar un pedido.
          </p>
        </div>

        <Button
          leadingIcon={<Plus size={18} />}
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          Nueva transportadora
        </Button>
      </div>

      <section className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-card border border-gray-200 bg-surface-1 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">Transportadora</th>
                <th className="px-5 py-3 font-medium">URL de seguimiento</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 text-center font-medium">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-0">
                    <TableSkeleton rows={4} columns={["28%", "42%", "14%", "12%"]} />
                  </td>
                </tr>
              ) : failed ? (
                <tr>
                  <td colSpan={4} className="p-0">
                    <ErrorState
                      variant="plain"
                      title="No se pudieron cargar las transportadoras"
                      onRetry={() => setReloadKey((k) => k + 1)}
                    />
                  </td>
                </tr>
              ) : carriers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-0">
                    <EmptyState
                      icon={<Truck size={22} />}
                      title="Aún no hay transportadoras"
                      description="Crea la primera para que las empresas puedan asignarla a sus envíos."
                    />
                  </td>
                </tr>
              ) : (
                carriers.map((carrier) => (
                  <tr
                    key={carrier.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-5 py-3 text-sm font-semibold text-gray-900">
                      {carrier.name}
                    </td>

                    <td className="max-w-[320px] px-5 py-3 text-sm text-gray-500">
                      <span className="block truncate" title={carrier.tracking_url}>
                        {carrier.tracking_url}
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      <Badge tone={carrier.is_active ? "success" : "neutral"} dot>
                        {carrier.is_active ? "Activa" : "Inactiva"}
                      </Badge>
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(carrier);
                            setFormOpen(true);
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-control text-gray-600 transition hover:bg-gray-100"
                          title="Editar transportadora"
                          aria-label={`Editar ${carrier.name}`}
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(carrier)}
                          disabled={statusChangingId === carrier.id}
                          className={`flex h-9 w-9 items-center justify-center rounded-control transition hover:bg-gray-100 disabled:opacity-50 ${
                            carrier.is_active ? "text-success" : "text-gray-400"
                          }`}
                          title={carrier.is_active ? "Desactivar" : "Activar"}
                          aria-label={
                            carrier.is_active
                              ? `Desactivar ${carrier.name}`
                              : `Activar ${carrier.name}`
                          }
                        >
                          <Power size={18} />
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
        key={formOpen ? (editing?.id ?? "new") : "closed"}
        isOpen={formOpen}
        carrier={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
      />
    </div>
  );
}
