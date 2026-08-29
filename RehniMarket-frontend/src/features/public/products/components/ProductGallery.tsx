import { ImageOff } from "lucide-react";

import type { PublicProductImage } from "../types/response";

interface ProductGalleryProps {
  images: PublicProductImage[];
  productName: string;
  selectedUrl: string | null;
  onSelect: (url: string) => void;
}

// Galería del detalle: imagen principal + miniaturas (columna a la izquierda en desktop, fila debajo en mobile).
export default function ProductGallery({
  images,
  productName,
  selectedUrl,
  onSelect,
}: ProductGalleryProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {/* MINIATURAS - sm:self-start: no deben estirarse a la altura completa
          de la columna (eso lo hace la imagen principal, ver abajo), solo
          ocupar su alto natural arriba. */}
      {images.length > 1 && (
        <div className="order-2 flex gap-3 overflow-x-auto pb-1 sm:order-1 sm:w-20 sm:shrink-0 sm:flex-col sm:self-start sm:overflow-y-auto sm:pb-0 sm:max-h-[520px]">
          {images.map((image) => {
            const isActive = image.url === selectedUrl;

            return (
              <button
                key={image.id}
                type="button"
                onClick={() => onSelect(image.url)}
                aria-label={`Ver imagen ${productName}`}
                aria-current={isActive}
                className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition ${
                  isActive
                    ? "border-[#6D0F2D] ring-2 ring-[#6D0F2D]/20"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <img src={image.url} alt="" className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>
      )}

      {/* IMAGEN PRINCIPAL - alto FIJO y explícito (h-[...], no min-h ni
          stretch heredado de un ancestro): con una altura solo "mínima" o
          derivada de flex/grid stretch, una imagen con proporciones muy
          verticales terminaba imponiendo su propio tamaño natural (el
          `max-height:100%` del <img> no llega a resolverse contra un
          ancestro sin altura definida en esa pasada de cálculo, así que el
          navegador cae al tamaño intrínseco de la imagen), inflando el
          contenedor Y de paso la fila completa del grid (panel de compra
          incluido, ver ProductDetail.tsx). Con un alto fijo no hay nada que
          resolver: el contenedor mide siempre lo mismo sin importar la
          imagen seleccionada, y `object-contain` sobre `h-full w-full`
          (no max-h/max-w) ajusta la imagen DENTRO de esa caja ya fija -
          nunca la deforma, nunca la recorta, nunca la hace overflow. */}
      {/* flex-1 solo desde sm: en mobile (flex-col, alto = eje principal),
          flex-1 fija flex-basis:0% e ignora el h-[...] explícito para el
          cálculo de tamaño - el mismo problema que el alto fijo venía a
          resolver, reaparecido por otra vía. Sin flex-1 en mobile, el
          h-[320px] se usa directo como flex-basis (flex-grow:0 por
          defecto). Desde sm: (fila), flex-1 solo reparte ANCHO, eje en el
          que no hay conflicto. */}
      <div className="order-1 flex h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:order-2 sm:h-[380px] sm:flex-1 lg:h-[560px]">
        {selectedUrl ? (
          <img
            src={selectedUrl}
            alt={productName}
            className="h-full w-full object-contain"
          />
        ) : (
          <ImageOff size={48} className="text-gray-300" />
        )}
      </div>
    </div>
  );
}
