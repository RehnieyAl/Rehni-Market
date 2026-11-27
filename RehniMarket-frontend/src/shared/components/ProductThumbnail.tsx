/** Miniatura cuadrada de producto con la imagen real o un marcador neutro; la usan la búsqueda y los desplegables
 * de favoritos y carrito del navbar. Es decorativa: el nombre del producto va siempre en el texto contiguo. */
import { ImageOff } from "lucide-react";

export default function ProductThumbnail({ src }: { src: string | null }) {
  return src ? (
    <img src={src} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-control bg-surface-0 object-contain p-1" />
  ) : (
    <div
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-surface-2 text-ink-muted"
    >
      <ImageOff size={18} />
    </div>
  );
}
