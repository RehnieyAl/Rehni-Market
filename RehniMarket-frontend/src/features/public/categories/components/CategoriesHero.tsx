// Bloque "Explorar categorías" (ver ALCANCE > rediseño Categorías): solo
// título + descripción, diseño limpio y sin imagen de fondo - a
// diferencia del Hero del Home (carrusel de anuncios, ver
// features/public/home/components/Hero.tsx), acá no hay nada dinámico que
// mostrar todavía.
//
// Altura reducida (ver ALCANCE > rediseño visual Categorías, alineado con
// Home): py-8/py-10 en vez de py-12/py-16, mismo título+descripción, sin
// el espacio vertical de sobra que tenía antes. Mismo contenedor que
// Home/Navbar/Footer (max-w-[clamp(1280px,90vw,1600px)]) para quedar
// alineado con el resto del sitio.
export default function CategoriesHero() {
  return (
    <section className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto w-full max-w-[clamp(1280px,90vw,1600px)] px-2 py-8 text-center sm:px-4 sm:py-10 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Explorar categorías
        </h1>

        <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500 sm:text-base">
          Encuentra productos increíbles en todas nuestras categorías.
        </p>
      </div>
    </section>
  );
}
