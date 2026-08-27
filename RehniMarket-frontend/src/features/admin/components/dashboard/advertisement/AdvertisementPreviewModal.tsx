import { X } from "lucide-react";

import type { AdminAdvertisementResponse } from "@/features/admin/types/response";

interface AdvertisementPreviewModalProps {
  isOpen: boolean;
  advertisement: AdminAdvertisementResponse | null;
  onClose: () => void;
}

// Vista previa de como se ve el anuncio en el Hero del Home publico (ver
// Hero.tsx en features/public/home). Es solo lectura - "visualizar
// anuncio" (ALCANCE > ADMIN/OWNER), no un formulario de edicion.
export default function AdvertisementPreviewModal({
  isOpen,
  advertisement,
  onClose,
}: AdvertisementPreviewModalProps) {
  if (!isOpen || !advertisement) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Vista previa del anuncio
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-gray-100 sm:h-80">
            {/* Mismo criterio de art direction que el Hero público: la
                imagen móvil solo se usa por debajo de md (768px). */}
            <picture>
              {advertisement.mobile_image_url && (
                <source
                  media="(max-width: 767px)"
                  srcSet={advertisement.mobile_image_url}
                />
              )}
              <img
                src={advertisement.image_url}
                alt={advertisement.title}
                className="h-full w-full object-cover"
              />
            </picture>

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <h3 className="text-xl font-bold sm:text-2xl">{advertisement.title}</h3>

              {advertisement.description && (
                <p className="mt-2 max-w-md text-sm text-white/90">
                  {advertisement.description}
                </p>
              )}

              {advertisement.button_text && advertisement.button_link && (
                <span className="mt-4 inline-block rounded-xl bg-[#6D0F2D] px-5 py-2.5 text-sm font-medium text-white">
                  {advertisement.button_text}
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <div className="flex-1 min-w-[140px]">
              <p className="mb-1 text-xs font-medium text-gray-500">Desktop/tablet</p>
              <img
                src={advertisement.image_url}
                alt=""
                className="h-20 w-full rounded-lg border border-gray-200 object-cover"
              />
            </div>

            <div className="flex-1 min-w-[140px]">
              <p className="mb-1 text-xs font-medium text-gray-500">Móvil</p>
              <img
                src={advertisement.mobile_image_url ?? advertisement.image_url}
                alt=""
                className="h-20 w-full rounded-lg border border-gray-200 object-cover"
              />
              {!advertisement.mobile_image_url && (
                <p className="mt-1 text-[11px] text-gray-400">
                  Sin imagen móvil propia - usa la imagen desktop/tablet.
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                advertisement.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {advertisement.is_active ? "Activo" : "Inactivo"}
            </span>

            <span>Orden: {advertisement.order}</span>

            {advertisement.button_link && (
              <span className="truncate">Destino: {advertisement.button_link}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
