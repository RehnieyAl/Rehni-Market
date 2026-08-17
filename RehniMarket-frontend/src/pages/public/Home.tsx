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

        <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-8">
          {/* EXPLORAR CATEGORÍAS */}
          <section className="mt-8 sm:mt-10">
            <CategoriesSection />
          </section>

          {/* PRODUCTOS DEL DÍA */}
          <section className="mb-10 mt-10 sm:mb-12 sm:mt-12">
            <DailyProducts />
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}