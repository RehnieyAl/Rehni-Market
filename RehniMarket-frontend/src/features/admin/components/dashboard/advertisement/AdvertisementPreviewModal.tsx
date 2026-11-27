/** Vista previa de un anuncio del Hero con el mismo marco y ajuste que en el Home. */
import { Modal, Badge } from "@/shared/components/ui";
import HeroBannerImage from "@/features/public/home/components/HeroBannerImage";
import { HERO_FRAME, HERO_FRAME_WEB_ONLY, HERO_MOBILE_ASPECT, HERO_WEB_ASPECT } from "@/features/public/home/components/heroFrame";

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
      <div className={`relative overflow-hidden rounded-card bg-gray-100 ${advertisement.mobile_image_url ? HERO_FRAME : HERO_FRAME_WEB_ONLY}`}>
        <HeroBannerImage src={advertisement.image_url} mobileSrc={advertisement.mobile_image_url} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">Desktop / tablet</p>
          <div className={`relative ${HERO_WEB_ASPECT} w-full overflow-hidden rounded-control border border-gray-200`}>
            <HeroBannerImage src={advertisement.image_url} />
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">Móvil</p>
          <div className={`relative ${advertisement.mobile_image_url ? HERO_MOBILE_ASPECT : "aspect-[4/1]"} w-full overflow-hidden rounded-control border border-gray-200`}>
            <HeroBannerImage src={advertisement.mobile_image_url ?? advertisement.image_url} />
          </div>
          {!advertisement.mobile_image_url && (
            <p className="mt-1 text-[11px] text-gray-400">
              Sin imagen móvil propia: usa la de desktop en 4:1, recortada a su zona segura.
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
