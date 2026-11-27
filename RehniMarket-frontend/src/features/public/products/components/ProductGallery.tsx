/** Galería del detalle de producto: carrusel horizontal deslizable con miniaturas sincronizadas. */
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

import { cn } from "@/shared/utils/cn";
import type { PublicProductImage } from "../types/response";

interface ProductGalleryProps {
  images: PublicProductImage[];
  productName: string;
  selectedUrl: string | null;
  onSelect: (url: string) => void;
}

// La proporción reserva el alto antes de que llegue la foto (sin CLS) y crece de forma fluida con el ancho.
const SLIDE_FRAME = "aspect-square sm:aspect-[4/3]";
const ARROW_CLASS =
  "absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 touch-manipulation items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-10 sm:w-10";

const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
// scrollend es Baseline desde 2025-12: donde falta, un scroll con espera hace de respaldo.
const supportsScrollEnd = () => typeof window !== "undefined" && "onscrollend" in window;

export default function ProductGallery({
  images,
  productName,
  selectedUrl,
  onSelect,
}: ProductGalleryProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | undefined>(undefined);
  const [announcement, setAnnouncement] = useState("");
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());

  const selectedIndex = Math.max(
    0,
    images.findIndex((image) => image.url === selectedUrl),
  );
  const hasMany = images.length > 1;

  // La selección puede venir de una miniatura o de un cambio de variante: el carrusel la sigue.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    const target = selectedIndex * track.clientWidth;
    if (Math.abs(track.scrollLeft - target) > 1) {
      track.scrollTo({ left: target, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
  }, [selectedIndex, images]);

  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  const select = (index: number) => {
    onSelect(images[index].url);
    setAnnouncement(`Imagen ${index + 1} de ${images.length}`);
  };

  const goTo = (index: number) => select((index + images.length) % images.length);

  // Al deslizar con el dedo, la imagen que queda centrada pasa a ser la seleccionada.
  const settle = () => {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    if (images[index] && index !== selectedIndex) select(index);
  };

  const handleScroll = () => {
    if (supportsScrollEnd()) return;
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(settle, 120);
  };

  const markFailed = (url: string) =>
    setFailed((previous) => (previous.has(url) ? previous : new Set(previous).add(url)));

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!hasMany) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(selectedIndex + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(selectedIndex - 1);
    }
  };

  if (images.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-2 rounded-xl bg-surface-2 text-ink-muted", SLIDE_FRAME)}>
        <ImageOff size={44} aria-hidden="true" />
        <p className="text-sm">Imagen no disponible</p>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="relative min-w-0">
        {hasMany && (
          <>
            <button
              type="button"
              onClick={() => goTo(selectedIndex - 1)}
              aria-label="Imagen anterior"
              className={`${ARROW_CLASS} left-3`}
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => goTo(selectedIndex + 1)}
              aria-label="Imagen siguiente"
              className={`${ARROW_CLASS} right-3`}
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </>
        )}

        <div
          ref={trackRef}
          role="region"
          aria-roledescription="carrusel"
          aria-label={`Imágenes de ${productName}`}
          tabIndex={0}
          onScroll={handleScroll}
          onScrollEnd={settle}
          onKeyDown={handleKeyDown}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-xl bg-surface-2 outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-secondary/60 [&::-webkit-scrollbar]:hidden"
        >
          {images.map((image, index) => (
            <div
              key={image.id}
              role="group"
              aria-roledescription="imagen"
              aria-label={`${index + 1} de ${images.length}`}
              className={cn("flex w-full shrink-0 snap-center items-center justify-center p-4 sm:p-6", SLIDE_FRAME)}
            >
              {failed.has(image.url) ? (
                <div className="flex flex-col items-center gap-2 text-ink-muted">
                  <ImageOff size={40} aria-hidden="true" />
                  <p className="text-sm">No se pudo cargar esta imagen</p>
                </div>
              ) : (
                <img
                  src={image.url}
                  alt={index === 0 ? productName : `${productName}, imagen ${index + 1}`}
                  width={800}
                  height={800}
                  draggable={false}
                  decoding="async"
                  fetchPriority={index === 0 ? "high" : "low"}
                  loading={index === 0 ? undefined : "lazy"}
                  onError={() => markFailed(image.url)}
                  className="h-full w-full select-none object-contain"
                />
              )}
            </div>
          ))}
        </div>

        {hasMany && (
          <span
            aria-hidden="true"
            className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-white"
          >
            {selectedIndex + 1} / {images.length}
          </span>
        )}
      </div>

      {hasMany && (
        <div className="flex min-w-0 justify-start gap-2 overflow-x-auto overscroll-x-contain p-0.5 [scrollbar-width:thin]">
          {images.map((image, index) => {
            const isActive = index === selectedIndex;

            return (
              <button
                key={image.id}
                type="button"
                onClick={() => select(index)}
                aria-label={`Ver imagen ${index + 1} de ${productName}`}
                aria-current={isActive}
                className={cn(
                  "h-16 w-16 shrink-0 touch-manipulation overflow-hidden rounded-control border-2 bg-surface-2 p-1 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary sm:h-[4.5rem] sm:w-[4.5rem]",
                  isActive ? "border-secondary ring-2 ring-secondary/30" : "border-hairline opacity-70 hover:opacity-100",
                )}
              >
                {failed.has(image.url) ? (
                  <ImageOff size={20} aria-hidden="true" className="m-auto h-full text-ink-muted" />
                ) : (
                  <img
                    src={image.url}
                    alt=""
                    width={72}
                    height={72}
                    decoding="async"
                    onError={() => markFailed(image.url)}
                    className="h-full w-full object-contain"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
