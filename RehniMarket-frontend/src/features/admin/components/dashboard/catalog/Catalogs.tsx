import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ListTree, ImageOff, Power } from "lucide-react";

import CatalogFormModal from "./CatalogFormModal";
import CatalogDeleteConfirmModal from "./CatalogDeleteConfirmModal";
import SpecificationsModal from "./SpecificationsModal";

import {
  getAdminCatalogs,
  createAdminCatalog,
  updateAdminCatalog,
  changeAdminCatalogStatus,
  deleteAdminCatalog,
} from "@/features/admin/api/catalogService";

import type { AdminCatalogResponse } from "@/features/admin/types/response";
import type { CatalogFormValues } from "./CatalogFormModal";

const sortCatalogs = (items: AdminCatalogResponse[]) =>
  [...items].sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name));

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

  const [statusChangingId, setStatusChangingId] = useState<string | null>(null);

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        setLoading(true);

        const response = await getAdminCatalogs();

        setCatalogs(sortCatalogs(response));
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

  const handleSubmitForm = async (values: CatalogFormValues) => {
    try {
      setSaving(true);

      if (editingCatalog) {
        const updated = await updateAdminCatalog(editingCatalog.id, {
          name: values.name,
          description: values.description,
          display_order: values.displayOrder,
          is_active: values.isActive,
          ...(values.image ? { image: values.image } : {}),
          ...(values.removeImage ? { remove_image: true } : {}),
        });

        setCatalogs((current) =>
          sortCatalogs(
            current.map((catalog) => (catalog.id === updated.id ? updated : catalog)),
          ),
        );
      } else {
        const created = await createAdminCatalog({
          name: values.name,
          description: values.description || undefined,
          display_order: values.displayOrder,
          is_active: values.isActive,
          ...(values.image ? { image: values.image } : {}),
        });

        setCatalogs((current) => sortCatalogs([...current, created]));
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

  const handleToggleStatus = async (catalog: AdminCatalogResponse) => {
    try {
      setStatusChangingId(catalog.id);

      const updated = await changeAdminCatalogStatus(catalog.id, !catalog.is_active);

      setCatalogs((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (error) {
      console.error("Error cambiando el estado del catálogo:", error);
    } finally {
      setStatusChangingId(null);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Categorías</h2>
          <p className="mt-1 text-sm text-gray-500">
            Categorías del marketplace y sus especificaciones técnicas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-xl bg-[#7A1833] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#64132a]"
        >
          <Plus size={18} />
          Nueva categoría
        </button>
      </div>

      <section className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="h-[420px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">Imagen</th>
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 text-center font-medium">Productos</th>
                <th className="px-5 py-3 text-center font-medium">Orden</th>
                <th className="px-5 py-3 text-center font-medium">Estado</th>
                <th className="px-5 py-3 text-center font-medium">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-500">
                    Cargando categorías...
                  </td>
                </tr>
              ) : catalogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-500">
                    No hay categorías creadas todavía.
                  </td>
                </tr>
              ) : (
                catalogs.map((catalog) => (
                  <tr
                    key={catalog.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-5 py-3">
                      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                        {catalog.image_url ? (
                          <img
                            src={catalog.image_url}
                            alt={catalog.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageOff size={16} className="text-gray-300" />
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                      {catalog.name}
                    </td>

                    <td className="px-5 py-3 text-center text-sm text-gray-600">
                      {catalog.product_count}
                    </td>

                    <td className="px-5 py-3 text-center text-sm text-gray-600">
                      {catalog.display_order}
                    </td>

                    <td className="px-5 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          catalog.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {catalog.is_active ? "Activa" : "Inactiva"}
                      </span>
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
                          onClick={() => handleToggleStatus(catalog)}
                          disabled={statusChangingId === catalog.id}
                          className={`rounded-lg p-2 transition hover:bg-gray-100 disabled:opacity-50 ${
                            catalog.is_active ? "text-green-600" : "text-gray-400"
                          }`}
                          title={catalog.is_active ? "Desactivar categoría" : "Activar categoría"}
                        >
                          <Power size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(catalog)}
                          className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
                          title="Editar categoría"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(catalog)}
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                          title="Eliminar categoría"
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
