import { ImageOff } from "lucide-react";

import type { PublicProductImage } from "../types/response";

interface ProductGalleryProps {
  images: PublicProductImage[];
  productName: string;
  selectedUrl: string | null;
  onSelect: (url: string) => void;
}

export default function ProductGallery({
  images,
  productName,
  selectedUrl,
  onSelect,
}: ProductGalleryProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
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
                className={`h-20 w-20 shrink-0 overflow-hidden rounded-card border-2 bg-white transition ${
                  isActive
                    ? "border-primary ring-2 ring-brand-600/20"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <img src={image.url} alt="" className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>
      )}

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
