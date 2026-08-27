import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { getActiveAdvertisements } from "../api/homeService";
import HeroSkeleton from "./HeroSkeleton";

import type { PublicAdvertisement } from "../types/response";

const AUTOPLAY_INTERVAL_MS = 4000;
const SWIPE_THRESHOLD_PX = 20;

const isExternalLink = (link: string) => /^https?:\/\//i.test(link);

export default function Hero() {
  const [advertisements, setAdvertisements] = useState<PublicAdvertisement[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [minimumLoading, setMinimumLoading] = useState(true);

  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
  const timer = setTimeout(() => {
    setMinimumLoading(false);
  }, 500);

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

  if (loading) {
    return <HeroSkeleton />;
  }

  if (loading || minimumLoading) {
  return <HeroSkeleton />;
}

  return (
    // mx-auto max-w-[clamp(1280px,90vw,1600px)] px-4 sm:px-6 lg:px-8 (ver
    // ALCANCE > auditoría de alineación del logo): antes el Hero era
    // full-bleed (sin padding/max-w) por debajo de lg, mientras
    // Navbar/Home/Footer sí tenían px-4 sm:px-6 desde el breakpoint base
    // - eso desalineaba el borde izquierdo del Hero 16px en móvil y 24px
    // en tablet respecto al logo. Ahora usa el mismo contenedor a TODOS
    // los tamaños (antes solo se compartía desde lg), causa raíz
    // corregida en vez de mover solo el logo.
    <section className="mx-auto w-full max-w-[clamp(1280px,90vw,1600px)] px-2 pt-2 sm:px-4 lg:px-8">
      <div
  className="
    relative
    w-full
    overflow-hidden
    bg-gray-100
    h-[260px]
    sm:h-[300px]
    md:h-[420px]
    lg:h-[460px]
    rounded-2xl
    lg:rounded-3xl
    shadow-xl
    animate-hero-premium
  "
  onMouseEnter={() => setIsPaused(true)}
  onMouseLeave={() => setIsPaused(false)}
  onTouchStart={handleTouchStart}
  onTouchEnd={handleTouchEnd}
>
        {advertisements.map((advertisement, slideIndex) => {
          const isActive = slideIndex === index;

          const hasCta = Boolean(
            advertisement.button_text && advertisement.button_link,
          );

          return (
            <div
              key={advertisement.id}
              aria-hidden={!isActive}
              className={`
                  absolute
                  inset-0
                  transition-all
                  duration-700
                  ease-in-out

                  ${
                    isActive
                      ? "translate-x-0 opacity-100"
                      : slideIndex < index
                        ? "-translate-x-full opacity-0"
                        : "translate-x-full opacity-0"
                  }
                `}
            >
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
                  className="
                      absolute
                      inset-0
                      h-full
                      w-full
                      object-cover
                      object-center
                    "
                />
              </picture>

              {/* OSCURECIDO */}
              <div
                className="
                    absolute
                    inset-0
                    bg-gradient-to-r
                    from-black/70
                    via-black/30
                    to-transparent
                  "
              />

              {/* CONTENIDO */}
              <div
                className="
                    absolute
                    inset-0
                    flex
                    items-end
                  "
              >
                <div
                  className="
                      w-full
                      px-6
                      pb-6

                      sm:px-8
                      sm:pb-8

                      lg:px-14
                      lg:pb-10

                      xl:px-20
                    "
                >
                  <div className="max-w-xl text-white">
                    <h1
                      className="
                          text-2xl
                          font-bold
                          leading-tight

                          sm:text-4xl

                          lg:text-5xl
                          xl:text-5xl
                        "
                    >
                      {advertisement.title}
                    </h1>

                    {advertisement.description && (
                      <p
                        className="
                            mt-3
                            max-w-lg
                            text-sm
                            text-white/90

                            sm:text-base

                            lg:text-base
                          "
                      >
                        {advertisement.description}
                      </p>
                    )}

                    {hasCta &&
                      (isExternalLink(advertisement.button_link as string) ? (
                        <a
                          href={advertisement.button_link as string}
                          target="_blank"
                          rel="noreferrer"
                          tabIndex={isActive ? 0 : -1}
                          className="
                              mt-5
                              inline-flex
                              items-center
                              gap-2
                              rounded-xl
                              bg-[#6D0F2D]
                              px-6
                              py-3
                              text-sm
                              font-semibold
                              text-white
                              transition
                              hover:bg-[#530A20]

                              sm:px-7
                              sm:py-3.5
                              sm:text-base
                            "
                        >
                          {advertisement.button_text}

                          <ArrowRight size={18} aria-hidden="true" />
                        </a>
                      ) : (
                        <Link
                          to={advertisement.button_link as string}
                          tabIndex={isActive ? 0 : -1}
                          className="
                              mt-5
                              inline-flex
                              items-center
                              gap-2
                              rounded-xl
                              bg-[#6D0F2D]
                              px-6
                              py-3
                              text-sm
                              font-semibold
                              text-white
                              transition
                              hover:bg-[#530A20]

                              sm:px-7
                              sm:py-3.5
                              sm:text-base
                            "
                        >
                          {advertisement.button_text}

                          <ArrowRight size={18} aria-hidden="true" />
                        </Link>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* FLECHA ANTERIOR */}
        {hasMultiple && (
          <>
            {/* FLECHA ANTERIOR */}
<button
  type="button"
  onClick={goPrev}
  aria-label="Anuncio anterior"
  className="
    absolute
    left-4
    top-1/2
    z-20

    hidden
    lg:flex

    h-11
    w-11

    -translate-y-1/2
    items-center
    justify-center

    rounded-full
    bg-white/40
    backdrop-blur-md

    text-gray-800
    shadow-md

    transition-all
    duration-200

    hover:scale-105
    hover:bg-white/70
  "
>
  <ChevronLeft size={21} aria-hidden="true" />
</button>

            {/* FLECHA SIGUIENTE */}
<button
  type="button"
  onClick={goNext}
  aria-label="Siguiente anuncio"
  className="
    absolute
    right-4
    top-1/2
    z-20

    hidden
    lg:flex

    h-11
    w-11

    -translate-y-1/2
    items-center
    justify-center

    rounded-full
    bg-white/40
    backdrop-blur-md

    text-gray-800
    shadow-md

    transition-all
    duration-200

    hover:scale-105
    hover:bg-white/70
  "
>
  <ChevronRight size={21} aria-hidden="true" />
</button>

            {/* INDICADORES */}
            <div
              className="
                absolute
                bottom-4
                left-1/2
                z-20
                flex
                -translate-x-1/2
                gap-2
              "
            >
              {advertisements.map((advertisement, dotIndex) => (
                <button
                  key={advertisement.id}
                  type="button"
                  onClick={() => setIndex(dotIndex)}
                  aria-label={`Ir al anuncio ${dotIndex + 1} de ${
                    advertisements.length
                  }`}
                  aria-current={dotIndex === index}
                  className={`
                      h-2
                      rounded-full
                      transition-all
                      duration-300

                      ${
                        dotIndex === index
                          ? "w-7 bg-white"
                          : "w-2 bg-white/50 hover:bg-white/80"
                      }
                    `}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
