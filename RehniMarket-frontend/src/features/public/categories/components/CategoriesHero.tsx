// Bloque "Explorar categorías" (ver ALCANCE > rediseño Categorías): solo
// título + descripción, diseño limpio y sin imagen de fondo - a
// diferencia del Hero del Home (carrusel de anuncios, ver
// features/public/home/components/Hero.tsx), acá no hay nada dinámico que
// mostrar todavía.
export default function CategoriesHero() {
  return (
    <section className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Explorar categorías
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-base text-gray-500 sm:text-lg">
          Encuentra productos increíbles en todas nuestras categorías.
        </p>
      </div>
    </section>
  );
}
