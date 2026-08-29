import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { getActiveAdvertisements } from "../api/homeService";
import HeroSkeleton from "./HeroSkeleton";

import type { PublicAdvertisement } from "../types/response";

const AUTOPLAY_INTERVAL_MS = 4000;
const SWIPE_THRESHOLD_PX = 20;

const isExternalLink = (link: string) => /^https?:\/\//i.test(link);

interface SlideLinkProps {
  link: string | null;
  active: boolean;
  children: React.ReactNode;
}

function SlideLink({ link, active, children }: SlideLinkProps) {
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
        tabIndex={active ? 0 : -1}
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={link} tabIndex={active ? 0 : -1} className={className}>
      {children}
    </Link>
  );
}

export default function Hero() {
  const [advertisements, setAdvertisements] = useState<PublicAdvertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [minimumLoading, setMinimumLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

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

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasMultiple = advertisements.length > 1;

  const goPrev = useCallback(() => {
    setIndex((current) =>
      current === 0 ? advertisements.length - 1 : current - 1,
    );
  }, [advertisements.length]);

  const goNext = useCallback(() => {
    setIndex((current) =>
      current === advertisements.length - 1 ? 0 : current + 1,
    );
  }, [advertisements.length]);

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
      goPrev();
    } else if (deltaX < -SWIPE_THRESHOLD_PX) {
      goNext();
    }
  };

  if (loading || minimumLoading) {
    return <HeroSkeleton />;
  }

  return (
    <section className="mx-auto w-full max-w-[clamp(1280px,90vw,1600px)] px-2 pt-2 sm:px-4 lg:px-8">
      <div
        className="animate-hero-premium relative h-[240px] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-lg sm:h-[300px] md:h-[360px] lg:h-[400px] lg:rounded-3xl"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {advertisements.map((advertisement, slideIndex) => {
          const isActive = slideIndex === index;

          return (
            <div
              key={advertisement.id}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                isActive
                  ? "translate-x-0 opacity-100"
                  : slideIndex < index
                    ? "-translate-x-full opacity-0"
                    : "translate-x-full opacity-0"
              }`}
            >
              <SlideLink link={advertisement.button_link} active={isActive}>
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
                    className="absolute inset-0 h-full w-full object-cover object-center"
                  />
                </picture>
              </SlideLink>
            </div>
          );
        })}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Anuncio anterior"
              className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/40 text-gray-800 shadow-md backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-white/70 lg:flex"
            >
              <ChevronLeft size={21} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={goNext}
              aria-label="Siguiente anuncio"
              className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/40 text-gray-800 shadow-md backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-white/70 lg:flex"
            >
              <ChevronRight size={21} aria-hidden="true" />
            </button>

            <div className="absolute bottom-5 left-6 z-20 flex gap-2 sm:left-10 lg:left-14">
              {advertisements.map((advertisement, dotIndex) => (
                <button
                  key={advertisement.id}
                  type="button"
                  onClick={() => setIndex(dotIndex)}
                  aria-label={`Ir al anuncio ${dotIndex + 1} de ${
                    advertisements.length
                  }`}
                  aria-current={dotIndex === index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    dotIndex === index
                      ? "w-7 bg-[#E11D48]"
                      : "w-2 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
