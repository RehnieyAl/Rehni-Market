import { useEffect, useState } from "react";
import { X, Plus, Pencil, Trash2, Check, XCircle } from "lucide-react";

import {
  getAdminSpecifications,
  createAdminSpecification,
  updateAdminSpecification,
  deleteAdminSpecification,
} from "@/features/admin/api/catalogService";

import type {
  AdminCatalogResponse,
  AdminSpecificationResponse,
} from "@/features/admin/types/response";

interface SpecificationsModalProps {
  isOpen: boolean;
  catalog: AdminCatalogResponse | null;
  onClose: () => void;
}

interface DraftSpecification {
  name: string;
  type: string;
  required: boolean;
}

const EMPTY_DRAFT: DraftSpecification = {
  name: "",
  type: "text",
  required: false,
};

export default function SpecificationsModal({
  isOpen,
  catalog,
  onClose,
}: SpecificationsModalProps) {
  const [specifications, setSpecifications] = useState<
    AdminSpecificationResponse[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newSpec, setNewSpec] = useState<DraftSpecification>(EMPTY_DRAFT);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<DraftSpecification>(EMPTY_DRAFT);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !catalog) return;

    const load = async () => {
      try {
        setLoading(true);

        const response = await getAdminSpecifications(catalog.id);

        setSpecifications(response);
      } catch (error) {
        console.error("Error cargando especificaciones:", error);
      } finally {
        setLoading(false);
      }
    };

    load();

    // No hace falta resetear newSpec/editingId/confirmDeleteId aquí: el
    // padre (Catalogs.tsx) monta este modal con una `key` distinta por
    // catálogo, así que cada apertura ya arranca con el estado inicial
    // "fresco" de useState.
  }, [isOpen, catalog]);

  if (!isOpen || !catalog) return null;

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    const name = newSpec.name.trim();

    if (name.length < 2) return;

    try {
      setSaving(true);

      const created = await createAdminSpecification(catalog.id, {
        name,
        type: newSpec.type.trim() || "text",
        required: newSpec.required,
      });

      setSpecifications((current) =>
        [...current, created].sort((a, b) => a.name.localeCompare(b.name)),
      );

      setNewSpec(EMPTY_DRAFT);
    } catch (error) {
      console.error("Error creando especificación:", error);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (specification: AdminSpecificationResponse) => {
    setEditingId(specification.id);
    setEditDraft({
      name: specification.name,
      type: specification.type,
      required: specification.required,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(EMPTY_DRAFT);
  };

  const handleUpdate = async (specificationId: string) => {
    const name = editDraft.name.trim();

    if (name.length < 2) return;

    try {
      setSaving(true);

      const updated = await updateAdminSpecification(specificationId, {
        name,
        type: editDraft.type.trim() || "text",
        required: editDraft.required,
      });

      setSpecifications((current) =>
        current
          .map((item) => (item.id === specificationId ? updated : item))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );

      cancelEdit();
    } catch (error) {
      console.error("Error actualizando especificación:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (specificationId: string) => {
    try {
      setSaving(true);

      await deleteAdminSpecification(specificationId);

      setSpecifications((current) =>
        current.filter((item) => item.id !== specificationId),
      );

      setConfirmDeleteId(null);
    } catch (error) {
      console.error("Error eliminando especificación:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Especificaciones
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Catálogo: <span className="font-medium text-gray-700">{catalog.name}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">

          <form
            onSubmit={handleCreate}
            className="mb-5 flex flex-col gap-3 rounded-xl border border-dashed border-gray-300 p-4 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                Nombre
              </label>
              <input
                type="text"
                value={newSpec.name}
                onChange={(event) =>
                  setNewSpec({ ...newSpec, name: event.target.value })
                }
                placeholder="Ej: Procesador"
                minLength={2}
                maxLength={100}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
              />
            </div>

            <div className="w-full sm:w-32">
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                Tipo
              </label>
              <input
                type="text"
                value={newSpec.type}
                onChange={(event) =>
                  setNewSpec({ ...newSpec, type: event.target.value })
                }
                placeholder="text"
                maxLength={50}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
              />
            </div>

            <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={newSpec.required}
                onChange={(event) =>
                  setNewSpec({ ...newSpec, required: event.target.checked })
                }
                className="h-4 w-4 accent-[#7A1833]"
              />
              Obligatoria
            </label>

            <button
              type="submit"
              disabled={saving || newSpec.name.trim().length < 2}
              className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#7A1833] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#64132a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={16} />
              Agregar
            </button>
          </form>

          {loading ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Cargando especificaciones...
            </p>
          ) : specifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Este catálogo todavía no tiene especificaciones.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
              {specifications.map((specification) => (
                <li key={specification.id} className="px-4 py-3">
                  {editingId === specification.id ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <input
                        type="text"
                        value={editDraft.name}
                        onChange={(event) =>
                          setEditDraft({ ...editDraft, name: event.target.value })
                        }
                        minLength={2}
                        maxLength={100}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
                      />

                      <input
                        type="text"
                        value={editDraft.type}
                        onChange={(event) =>
                          setEditDraft({ ...editDraft, type: event.target.value })
                        }
                        maxLength={50}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20 sm:w-28"
                      />

                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={editDraft.required}
                          onChange={(event) =>
                            setEditDraft({
                              ...editDraft,
                              required: event.target.checked,
                            })
                          }
                          className="h-4 w-4 accent-[#7A1833]"
                        />
                        Obligatoria
                      </label>

                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdate(specification.id)}
                          disabled={saving}
                          className="rounded-lg p-2 text-green-600 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Guardar"
                        >
                          <Check size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={saving}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Cancelar"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    </div>
                  ) : confirmDeleteId === specification.id ? (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-gray-700">
                        ¿Eliminar <strong>{specification.name}</strong>?
                      </p>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={saving}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Cancelar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(specification.id)}
                          disabled={saving}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {saving ? "Eliminando..." : "Sí, eliminar"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {specification.name}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {specification.type}
                          {specification.required && (
                            <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
                              Obligatoria
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(specification)}
                          className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(specification.id)}
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-5 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
