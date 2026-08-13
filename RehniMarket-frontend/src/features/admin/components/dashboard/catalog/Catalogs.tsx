import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ListTree } from "lucide-react";

import CatalogFormModal from "./CatalogFormModal";
import CatalogDeleteConfirmModal from "./CatalogDeleteConfirmModal";
import SpecificationsModal from "./SpecificationsModal";

import {
  getAdminCatalogs,
  createAdminCatalog,
  updateAdminCatalog,
  deleteAdminCatalog,
} from "@/features/admin/api/catalogService";

import type { AdminCatalogResponse } from "@/features/admin/types/response";

export default function Catalogs() {
  const [catalogs, setCatalogs] = useState<AdminCatalogResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCatalog, setEditingCatalog] =
    useState<AdminCatalogResponse | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] =
    useState<AdminCatalogResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [specsCatalog, setSpecsCatalog] =
    useState<AdminCatalogResponse | null>(null);

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        setLoading(true);

        const response = await getAdminCatalogs();

        setCatalogs(response);
      } catch (error) {
        console.error("Error cargando catálogos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCatalogs();
  }, []);

  const handleOpenCreate = () => {
    setEditingCatalog(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (catalog: AdminCatalogResponse) => {
    setEditingCatalog(catalog);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    if (saving) return;

    setFormOpen(false);
    setEditingCatalog(null);
  };

  const handleSubmitForm = async (name: string) => {
    try {
      setSaving(true);

      if (editingCatalog) {
        const updated = await updateAdminCatalog(editingCatalog.id, { name });

        setCatalogs((current) =>
          current
            .map((catalog) => (catalog.id === updated.id ? updated : catalog))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      } else {
        const created = await createAdminCatalog({ name });

        setCatalogs((current) =>
          [...current, created].sort((a, b) => a.name.localeCompare(b.name)),
        );
      }

      setFormOpen(false);
      setEditingCatalog(null);
    } catch (error) {
      console.error("Error guardando catálogo:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseDelete = () => {
    if (deleting) return;

    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      await deleteAdminCatalog(deleteTarget.id);

      setCatalogs((current) =>
        current.filter((catalog) => catalog.id !== deleteTarget.id),
      );

      setDeleteTarget(null);
    } catch (error) {
      console.error("Error eliminando catálogo:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Catálogos</h2>
          <p className="mt-1 text-sm text-gray-500">
            Categorías de productos y sus especificaciones técnicas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-xl bg-[#7A1833] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#64132a]"
        >
          <Plus size={18} />
          Nuevo catálogo
        </button>
      </div>

      <section className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="h-[420px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 text-center font-medium">Acción</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={2} className="px-5 py-8 text-center text-sm text-gray-500">
                    Cargando catálogos...
                  </td>
                </tr>
              ) : catalogs.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-5 py-8 text-center text-sm text-gray-500">
                    No hay catálogos creados todavía.
                  </td>
                </tr>
              ) : (
                catalogs.map((catalog) => (
                  <tr
                    key={catalog.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                      {catalog.name}
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSpecsCatalog(catalog)}
                          className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
                          title="Especificaciones"
                        >
                          <ListTree size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(catalog)}
                          className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
                          title="Editar catálogo"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(catalog)}
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                          title="Eliminar catálogo"
                        >
                          <Trash2 size={18} />
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

      <CatalogFormModal
        key={formOpen ? (editingCatalog?.id ?? "new") : "closed"}
        isOpen={formOpen}
        catalog={editingCatalog}
        loading={saving}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
      />

      <CatalogDeleteConfirmModal
        isOpen={deleteTarget !== null}
        catalogName={deleteTarget?.name ?? ""}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={handleCloseDelete}
      />

      <SpecificationsModal
        key={specsCatalog?.id ?? "closed"}
        isOpen={specsCatalog !== null}
        catalog={specsCatalog}
        onClose={() => setSpecsCatalog(null)}
      />
    </div>
  );
}
