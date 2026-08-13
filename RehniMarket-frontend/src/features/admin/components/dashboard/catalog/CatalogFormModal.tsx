import { useState } from "react";
import { X, Save } from "lucide-react";

import type { AdminCatalogResponse } from "@/features/admin/types/response";

interface CatalogFormModalProps {
  isOpen: boolean;
  catalog: AdminCatalogResponse | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

// El padre monta este componente con una `key` distinta cada vez que se
// abre (ver Catalogs.tsx), así que el valor inicial de useState ya llega
// "fresco" en cada apertura sin necesitar un efecto para resetearlo.
export default function CatalogFormModal({
  isOpen,
  catalog,
  loading,
  onClose,
  onSubmit,
}: CatalogFormModalProps) {
  const [name, setName] = useState(catalog?.name ?? "");

  const isEditing = catalog !== null;

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmed = name.trim();

    if (trimmed.length < 2) return;

    onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Editar catálogo" : "Nuevo catálogo"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Nombre del catálogo
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={100}
              required
              autoFocus
              placeholder="Ej: Computadoras"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading || name.trim().length < 2}
              className="flex items-center gap-2 rounded-xl bg-[#7A1833] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#64132a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} />
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
