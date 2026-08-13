import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

import ColorFormModal from "./ColorFormModal";
import ColorDeleteConfirmModal from "./ColorDeleteConfirmModal";

import {
  getAdminColors,
  createAdminColor,
  updateAdminColor,
  deleteAdminColor,
} from "@/features/admin/api/colorService";

import type { AdminColorResponse } from "@/features/admin/types/response";

export default function Colors() {
  const [colors, setColors] = useState<AdminColorResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<AdminColorResponse | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminColorResponse | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadColors = async () => {
      try {
        setLoading(true);

        const response = await getAdminColors();

        setColors(response);
      } catch (error) {
        console.error("Error cargando colores:", error);
      } finally {
        setLoading(false);
      }
    };

    loadColors();
  }, []);

  const handleOpenCreate = () => {
    setEditingColor(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (color: AdminColorResponse) => {
    setEditingColor(color);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    if (saving) return;

    setFormOpen(false);
    setEditingColor(null);
  };

  const handleSubmitForm = async (name: string, hexColor: string) => {
    try {
      setSaving(true);

      if (editingColor) {
        const updated = await updateAdminColor(editingColor.id, {
          name,
          hex_color: hexColor,
        });

        setColors((current) =>
          current
            .map((color) => (color.id === updated.id ? updated : color))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      } else {
        const created = await createAdminColor({ name, hex_color: hexColor });

        setColors((current) =>
          [...current, created].sort((a, b) => a.name.localeCompare(b.name)),
        );
      }

      setFormOpen(false);
      setEditingColor(null);
    } catch (error) {
      console.error("Error guardando color:", error);
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

      await deleteAdminColor(deleteTarget.id);

      setColors((current) =>
        current.filter((color) => color.id !== deleteTarget.id),
      );

      setDeleteTarget(null);
    } catch (error) {
      console.error("Error eliminando color:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Colores</h2>
          <p className="mt-1 text-sm text-gray-500">
            Paleta de colores disponible para variantes de producto.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-xl bg-[#7A1833] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#64132a]"
        >
          <Plus size={18} />
          Nuevo color
        </button>
      </div>

      <section className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="h-[420px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">Color</th>
                <th className="px-5 py-3 font-medium">Hex</th>
                <th className="px-5 py-3 text-center font-medium">Acción</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-sm text-gray-500">
                    Cargando colores...
                  </td>
                </tr>
              ) : colors.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-sm text-gray-500">
                    No hay colores creados todavía.
                  </td>
                </tr>
              ) : (
                colors.map((color) => (
                  <tr
                    key={color.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-6 w-6 shrink-0 rounded-full border border-gray-200"
                          style={{ backgroundColor: color.hex_color }}
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {color.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-3 text-sm text-gray-500">
                      {color.hex_color}
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(color)}
                          className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
                          title="Editar color"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(color)}
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                          title="Eliminar color"
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

      <ColorFormModal
        key={formOpen ? (editingColor?.id ?? "new") : "closed"}
        isOpen={formOpen}
        color={editingColor}
        loading={saving}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
      />

      <ColorDeleteConfirmModal
        isOpen={deleteTarget !== null}
        colorName={deleteTarget?.name ?? ""}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={handleCloseDelete}
      />
    </div>
  );
}
