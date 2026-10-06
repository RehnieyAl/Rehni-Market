import { Modal, Badge } from "@/shared/components/ui";

import type { AdminAdvertisementResponse } from "@/features/admin/types/response";

interface AdvertisementPreviewModalProps {
  isOpen: boolean;
  advertisement: AdminAdvertisementResponse | null;
  onClose: () => void;
}

export default function AdvertisementPreviewModal({
  isOpen,
  advertisement,
  onClose,
}: AdvertisementPreviewModalProps) {
  if (!advertisement) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vista previa del anuncio"
      size="lg"
    >
      <div className="relative aspect-[16/7] w-full overflow-hidden rounded-card bg-gray-100">
        <picture>
          {advertisement.mobile_image_url && (
            <source
              media="(max-width: 767px)"
              srcSet={advertisement.mobile_image_url}
            />
          )}
          <img
            src={advertisement.image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        </picture>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">Desktop / tablet</p>
          <img
            src={advertisement.image_url}
            alt=""
            className="h-20 w-full rounded-control border border-gray-200 object-cover"
          />
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">Móvil</p>
          <img
            src={advertisement.mobile_image_url ?? advertisement.image_url}
            alt=""
            className="h-20 w-full rounded-control border border-gray-200 object-cover"
          />
          {!advertisement.mobile_image_url && (
            <p className="mt-1 text-[11px] text-gray-400">
              Sin imagen móvil propia — usa la de desktop.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-500">
        <Badge tone={advertisement.is_active ? "success" : "neutral"} dot>
          {advertisement.is_active ? "Activo" : "Inactivo"}
        </Badge>

        <span>Orden: {advertisement.order}</span>

        {advertisement.target_type === "CATEGORY" && advertisement.minimum_discount ? (
          <span>Descuento promocional: {advertisement.minimum_discount}%</span>
        ) : null}

        {advertisement.button_link && (
          <span className="truncate">Destino: {advertisement.button_link}</span>
        )}
      </div>
    </Modal>
  );
}
