/** Carrusel del Home con los anuncios activos, a todo el ancho del contenedor y ligado a las plantillas de anuncio. */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { getActiveAdvertisements } from "../api/homeService";
import HeroSkeleton from "./HeroSkeleton";
import HeroBannerImage from "./HeroBannerImage";
import { HERO_FRAME, HERO_FRAME_WEB_ONLY } from "./heroFrame";

import type { PublicAdvertisement } from "../types/response";

const AUTOPLAY_INTERVAL_MS = 4000;
const SWIPE_THRESHOLD_PX = 20;
const ARROW_CLASS =
  "absolute top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 touch-manipulation items-center justify-center rounded-full bg-black/60 text-white transition-colors duration-150 hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none lg:flex";

const isExternalLink = (link: string) => /^https?:\/\//i.test(link);

interface SlideLinkProps {
  link: string | null;
  active: boolean;
  label: string;
  children: React.ReactNode;
}

function SlideLink({ link, active, label, children }: SlideLinkProps) {
  const className = `absolute inset-0 block ${active ? "" : "pointer-events-none"}`;

  if (!link) {
    return <div className={className}>{children}</div>;
  }

  if (isExternalLink(link)) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noreferrer"
        aria-label={label}
        tabIndex={active ? 0 : -1}
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={link} aria-label={label} tabIndex={active ? 0 : -1} className={className}>
      {children}
    </Link>
  );
}

export default function Hero() {
  const [advertisements, setAdvertisements] = useState<PublicAdvertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [minimumLoading, setMinimumLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMinimumLoading(false), 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);

        const response = await getActiveAdvertisements();

        if (!cancelled) {
          setAdvertisements(response);
        }
      } catch (error) {
        console.error("Error cargando anuncios:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasMultiple = advertisements.length > 1;

  const goNext = useCallback(() => {
    setIndex((current) =>
      current === advertisements.length - 1 ? 0 : current + 1,
    );
  }, [advertisements.length]);

  const showSlide = (next: number) => {
    setIndex(next);
    setAnnouncement(`Anuncio ${next + 1} de ${advertisements.length}`);
  };

  const userPrev = () => showSlide(index === 0 ? advertisements.length - 1 : index - 1);
  const userNext = () => showSlide(index === advertisements.length - 1 ? 0 : index + 1);

  // WCAG 2.2.2: el movimiento automático se detiene con el puntero, el foco o la preferencia de movimiento reducido.
  const isPaused = isHovered || hasFocus || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!hasMultiple || isPaused) return;

    const timer = setTimeout(goNext, AUTOPLAY_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [hasMultiple, isPaused, index, goNext]);

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const currentX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const deltaX = currentX - touchStartX.current;

    touchStartX.current = null;

    if (deltaX > SWIPE_THRESHOLD_PX) {
      userPrev();
    } else if (deltaX < -SWIPE_THRESHOLD_PX) {
      userNext();
    }
  };

  if (loading || minimumLoading) {
    return <HeroSkeleton />;
  }

  if (advertisements.length === 0) return null;

  const total = advertisements.length;
  const useMobileArt = advertisements.every((advertisement) => advertisement.mobile_image_url);

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Anuncios destacados"
      className="mx-auto w-full max-w-[clamp(1280px,90vw,1600px)] px-3 sm:px-4 lg:px-8"
    >
      <div
        className={`animate-hero-premium relative touch-pan-y overflow-hidden rounded-2xl border-gray-100 bg-gray-100 shadow-lg dark:border dark:border-hairline dark:bg-surface-1 dark:shadow-none ${
          useMobileArt ? HERO_FRAME : HERO_FRAME_WEB_ONLY
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={(event) => setHasFocus(event.target.matches(":focus-visible"))}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false);
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {advertisements.map((advertisement, slideIndex) => {
          const isActive = slideIndex === index;
          const position = `${slideIndex + 1} de ${total}`;

          return (
            <div
              key={advertisement.id}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={position}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                isActive
                  ? "translate-x-0 opacity-100"
                  : slideIndex < index
                    ? "-translate-x-full opacity-0"
                    : "translate-x-full opacity-0"
              }`}
            >
              <SlideLink link={advertisement.button_link} active={isActive} label={`Abrir anuncio ${position}`}>
                <HeroBannerImage
                  src={advertisement.image_url}
                  mobileSrc={useMobileArt ? advertisement.mobile_image_url : null}
                  priority={slideIndex === 0 ? "high" : "low"}
                />
              </SlideLink>
            </div>
          );
        })}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={userPrev}
              aria-label="Anuncio anterior"
              className={`${ARROW_CLASS} left-3 xl:left-6`}
            >
              <ChevronLeft size={21} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={userNext}
              aria-label="Siguiente anuncio"
              className={`${ARROW_CLASS} right-3 xl:right-6`}
            >
              <ChevronRight size={21} aria-hidden="true" />
            </button>

            <div className="absolute bottom-0.5 left-1/2 z-20 flex -translate-x-1/2 gap-1 sm:bottom-1.5">
              {advertisements.map((advertisement, dotIndex) => (
                <button
                  key={advertisement.id}
                  type="button"
                  onClick={() => showSlide(dotIndex)}
                  aria-label={`Ir al anuncio ${dotIndex + 1} de ${total}`}
                  aria-current={dotIndex === index}
                  className="group grid h-6 min-w-6 touch-manipulation place-items-center rounded-full px-1 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-white"
                >
                  <span
                    aria-hidden="true"
                    className={`block h-2 rounded-full transition-colors duration-150 motion-reduce:transition-none ${
                      dotIndex === index ? "w-7 bg-secondary" : "w-2 bg-white/60 group-hover:bg-white/90"
                    }`}
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}
