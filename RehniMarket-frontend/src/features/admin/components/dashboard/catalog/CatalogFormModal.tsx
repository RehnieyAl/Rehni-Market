import { useRef, useState } from "react";
import { X, Save, Upload } from "lucide-react";

import type { AdminCatalogResponse } from "@/features/admin/types/response";

export interface CatalogFormValues {
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  image: File | null;
  removeImage: boolean;
}

interface CatalogFormModalProps {
  isOpen: boolean;
  catalog: AdminCatalogResponse | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: CatalogFormValues) => void;
}

export default function CatalogFormModal({
  isOpen,
  catalog,
  loading,
  onClose,
  onSubmit,
}: CatalogFormModalProps) {
  const [name, setName] = useState(catalog?.name ?? "");
  const [description, setDescription] = useState(catalog?.description ?? "");
  const [displayOrder, setDisplayOrder] = useState(catalog?.display_order ?? 0);
  const [isActive, setIsActive] = useState(catalog?.is_active ?? true);

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(catalog?.image_url ?? null);
  const [removeImage, setRemoveImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = catalog !== null;

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreview(null);
    setRemoveImage(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isValid = name.trim().length >= 2;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!isValid) return;

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      displayOrder,
      isActive,
      image,
      removeImage,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-card bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Editar categoría" : "Nueva categoría"}
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
                Imagen <span className="font-normal text-gray-400">(opcional)</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageChange}
              />

              {preview ? (
                <div className="relative h-40 w-full overflow-hidden rounded-xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group block h-full w-full"
                  >
                    <img src={preview} alt="" className="h-full w-full object-cover" />

                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-transparent transition group-hover:bg-black/40 group-hover:text-white">
                      Cambiar imagen
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute right-2 top-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-danger shadow transition hover:bg-white"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 transition hover:border-primary hover:text-primary"
                >
                  <Upload size={24} />
                  <span className="text-sm">Subir imagen</span>
                </button>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Nombre
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
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Descripción <span className="font-normal text-gray-400">(opcional)</span>
              </label>

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Describe brevemente esta categoría"
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Orden visual
                </label>

                <input
                  type="number"
                  value={displayOrder}
                  onChange={(event) => {
                    const parsed = Number(event.target.value);
                    setDisplayOrder(Number.isFinite(parsed) ? parsed : 0);
                  }}
                  min={0}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
                />

                <p className="mt-1.5 text-xs text-gray-400">Menor número aparece primero.</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Estado
                </label>

                <button
                  type="button"
                  onClick={() => setIsActive((current) => !current)}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "border-green-200 bg-success-bg text-success"
                      : "border-gray-200 bg-gray-50 text-gray-500"
                  }`}
                >
                  {isActive ? "Activa" : "Inactiva"}
                </button>
              </div>
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
              disabled={loading || !isValid}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} />
              {loading ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
