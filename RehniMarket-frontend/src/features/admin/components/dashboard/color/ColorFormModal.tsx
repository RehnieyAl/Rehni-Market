import { useState } from "react";
import { X, Save } from "lucide-react";

import type { AdminColorResponse } from "@/features/admin/types/response";

interface ColorFormModalProps {
  isOpen: boolean;
  color: AdminColorResponse | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (name: string, hexColor: string) => void;
}

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

// El padre monta este componente con una `key` distinta cada vez que se
// abre, así que el valor inicial de useState ya llega
// "fresco" en cada apertura sin necesitar un efecto para resetearlo.
export default function ColorFormModal({
  isOpen,
  color,
  loading,
  onClose,
  onSubmit,
}: ColorFormModalProps) {
  const [name, setName] = useState(color?.name ?? "");
  const [hexColor, setHexColor] = useState(color?.hex_color ?? "#7A1833");

  const isEditing = color !== null;

  if (!isOpen) return null;

  const isValidHex = HEX_PATTERN.test(hexColor);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmed = name.trim();

    if (trimmed.length < 2 || !isValidHex) return;

    onSubmit(trimmed, hexColor.toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Editar color" : "Nuevo color"}
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
          <div className="space-y-5 px-6 py-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Nombre del color
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={50}
                required
                autoFocus
                placeholder="Ej: Rojo"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Color
              </label>

              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={isValidHex ? hexColor : "#000000"}
                  onChange={(event) => setHexColor(event.target.value)}
                  className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-gray-300 p-1"
                />

                <input
                  type="text"
                  value={hexColor}
                  onChange={(event) => setHexColor(event.target.value)}
                  placeholder="#7A1833"
                  className={`w-full rounded-xl border px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 ${
                    isValidHex
                      ? "border-gray-300 focus:border-[#7A1833] focus:ring-[#7A1833]/20"
                      : "border-red-300 focus:border-red-500 focus:ring-red-200"
                  }`}
                />
              </div>

              {!isValidHex && (
                <p className="mt-2 text-xs text-red-600">
                  Formato inválido. Debe ser un hexadecimal de 6 dígitos, ej: #7A1833.
                </p>
              )}
            </div>
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
              disabled={loading || name.trim().length < 2 || !isValidHex}
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
