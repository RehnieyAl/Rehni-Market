import NavBar from "@/shared/components/navbar/navbar";
import Footer from "@/shared/components/Footer";

import Hero from "@/features/public/home/components/Hero";
import CategoriesSection from "@/features/public/home/components/CategoriesSection";
import DailyProducts from "@/features/public/home/components/DailyProducts";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <NavBar />

      <main className="flex-1">
        {/* HERO - fuera del contenedor max-w para ocupar todo el ancho
            horizontal disponible (full-bleed) */}
        <section className="pt-4 sm:pt-6">
          <Hero />
        </section>

        {/* Único contenedor de ancho para el resto del Home (ver
            ALCANCE > auditoría visual, "Unificar contenedores") - mismo
            contenedor que ya usaban DailyProducts y Footer, así que
            Categorías/Productos/Footer quedan alineados sin tocar más
            archivos. Cada sección aplica su propio margen superior (ver
            CategoriesSection.tsx/DailyProducts.tsx) para que, si retorna
            null, el margen desaparezca con ella - acá ya no se envuelve
            en un <section> con mt- propio (eso era el margen huérfano).

            max-w-[clamp(1280px,90vw,1600px)] (ver ALCANCE > ancho
            progresivo desktop): reemplaza max-w-7xl (1280px fijo). Por
            debajo de ~1422px de viewport el piso del clamp (1280px) es
            igual al max-w-7xl anterior, así que tablet/mobile quedan
            matemáticamente sin cambio; a partir de ahí crece con el
            viewport (90vw) hasta un techo de 1600px, sin llegar nunca a
            los bordes. Mismo valor exacto en Hero/HeroSkeleton/Footer/
            navbar - un solo contenedor responsive compartido. */}
        <div className="mx-auto w-full max-w-[clamp(1280px,90vw,1600px)] px-2 sm:px-4 lg:px-8">
          <CategoriesSection />
          <DailyProducts />
        </div>
      </main>

      <Footer />
    </div>
  );
}
