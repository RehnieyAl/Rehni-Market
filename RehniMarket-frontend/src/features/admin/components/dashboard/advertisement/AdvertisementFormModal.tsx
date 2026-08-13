import { useRef, useState } from "react";
import { X, Save, Upload } from "lucide-react";

import type { AdminAdvertisementResponse } from "@/features/admin/types/response";

interface AdvertisementFormValues {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  order: number;
  isActive: boolean;
  // Desktop/tablet
  image: File | null;
  // Mobile - opcional
  mobileImage: File | null;
  // Solo aplica en edición: elimina la imagen móvil actual sin
  // reemplazarla. Se ignora si mobileImage también viene seteado.
  removeMobileImage: boolean;
}

interface AdvertisementFormModalProps {
  isOpen: boolean;
  advertisement: AdminAdvertisementResponse | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: AdvertisementFormValues) => void;
}

// El padre monta este componente con una `key` distinta cada vez que se
// abre (ver Advertisements.tsx), así que el valor inicial de useState ya
// llega "fresco" en cada apertura sin necesitar un efecto para resetearlo
// (mismo patrón que ColorFormModal.tsx).
export default function AdvertisementFormModal({
  isOpen,
  advertisement,
  loading,
  onClose,
  onSubmit,
}: AdvertisementFormModalProps) {
  const [title, setTitle] = useState(advertisement?.title ?? "");
  const [description, setDescription] = useState(advertisement?.description ?? "");
  const [buttonText, setButtonText] = useState(advertisement?.button_text ?? "");
  const [buttonLink, setButtonLink] = useState(advertisement?.button_link ?? "");
  const [order, setOrder] = useState(advertisement?.order ?? 0);
  const [isActive, setIsActive] = useState(advertisement?.is_active ?? true);

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(advertisement?.image_url ?? null);

  const [mobileImage, setMobileImage] = useState<File | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(
    advertisement?.mobile_image_url ?? null,
  );
  const [removeMobileImage, setRemoveMobileImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = advertisement !== null;

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleMobileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setMobileImage(file);
    setMobilePreview(URL.createObjectURL(file));
    setRemoveMobileImage(false);
  };

  const handleRemoveMobileImage = () => {
    setMobileImage(null);
    setMobilePreview(null);
    setRemoveMobileImage(true);

    if (mobileFileInputRef.current) {
      mobileFileInputRef.current.value = "";
    }
  };

  const isValid = title.trim().length >= 2 && (isEditing || image !== null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!isValid) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      buttonText: buttonText.trim(),
      buttonLink: buttonLink.trim(),
      order,
      isActive,
      image,
      mobileImage,
      removeMobileImage,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Editar anuncio" : "Nuevo anuncio"}
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
                Imagen desktop/tablet {!isEditing && <span className="text-red-500">*</span>}
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageChange}
              />

              {preview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative block h-40 w-full overflow-hidden rounded-xl border border-gray-200"
                >
                  <img src={preview} alt="" className="h-full w-full object-cover" />

                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-transparent transition group-hover:bg-black/40 group-hover:text-white">
                    Cambiar imagen
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 transition hover:border-[#7A1833] hover:text-[#7A1833]"
                >
                  <Upload size={24} />
                  <span className="text-sm">Subir imagen</span>
                </button>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Imagen móvil <span className="font-normal text-gray-400">(opcional)</span>
              </label>

              <input
                ref={mobileFileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleMobileImageChange}
              />

              {mobilePreview ? (
                <div className="relative h-40 w-full overflow-hidden rounded-xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => mobileFileInputRef.current?.click()}
                    className="group block h-full w-full"
                  >
                    <img src={mobilePreview} alt="" className="h-full w-full object-cover" />

                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-transparent transition group-hover:bg-black/40 group-hover:text-white">
                      Cambiar imagen
                    </span>
                  </button>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleRemoveMobileImage}
                      className="absolute right-2 top-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-red-600 shadow transition hover:bg-white"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => mobileFileInputRef.current?.click()}
                  className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 transition hover:border-[#7A1833] hover:text-[#7A1833]"
                >
                  <Upload size={24} />
                  <span className="text-sm">Subir imagen móvil</span>
                </button>
              )}

              <p className="mt-2 text-xs text-gray-400">
                Si no se sube una imagen móvil, se usará la imagen
                desktop/tablet en pantallas pequeñas.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Título
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                minLength={2}
                maxLength={150}
                required
                autoFocus
                placeholder="Ej: Nueva colección"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Descripción
              </label>

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Descubre nuestros productos"
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Texto del botón
                </label>

                <input
                  type="text"
                  value={buttonText}
                  onChange={(event) => setButtonText(event.target.value)}
                  maxLength={50}
                  placeholder="Ver productos"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Destino
                </label>

                <input
                  type="text"
                  value={buttonLink}
                  onChange={(event) => setButtonLink(event.target.value)}
                  maxLength={255}
                  placeholder="/products"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
                />
              </div>
            </div>

            <p className="-mt-2 text-xs text-gray-400">
              Si dejas el texto o el destino vacíos, el anuncio no mostrará
              botón.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Orden
                </label>

                <input
                  type="number"
                  value={order}
                  onChange={(event) => setOrder(Number(event.target.value))}
                  min={0}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
                />
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
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-gray-200 bg-gray-50 text-gray-500"
                  }`}
                >
                  {isActive ? "🟢 Activo" : "🔴 Inactivo"}
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
