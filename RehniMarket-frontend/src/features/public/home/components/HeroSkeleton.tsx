export default function HeroSkeleton() {
  return (
    <section className="w-full pt-2 lg:max-w-[1500px] lg:mx-auto lg:px-6">
      <div
        className="
          relative
          w-full
          overflow-hidden
          bg-gray-200
          animate-pulse

          h-[260px]
          sm:h-[300px]
          md:h-[420px]
          lg:h-[460px]

          rounded-none
          lg:rounded-[28px]

          shadow-xl
        "
      >
        {/* Fondo simulando imagen */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300" />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Contenido */}
        <div className="absolute inset-0 flex items-end">
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
            <div className="max-w-xl">
              {/* Título */}
              <div className="h-8 w-3/4 rounded-lg bg-white/40 sm:h-10" />

              {/* Descripción */}
              <div className="mt-4 h-4 w-full rounded bg-white/30" />
              <div className="mt-2 h-4 w-5/6 rounded bg-white/30" />

              {/* Botón */}
              <div className="mt-6 h-12 w-40 rounded-xl bg-white/40" />
            </div>
          </div>
        </div>

        {/* Indicadores */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          <div className="h-2 w-8 rounded-full bg-white/50" />
          <div className="h-2 w-2 rounded-full bg-white/30" />
          <div className="h-2 w-2 rounded-full bg-white/30" />
        </div>
      </div>
    </section>
  );
}