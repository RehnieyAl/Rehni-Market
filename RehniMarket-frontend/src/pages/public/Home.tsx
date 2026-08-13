import NavBar from "@/shared/components/navbar/navbar";
import Footer from "@/shared/components/Footer";

import Hero from "@/features/public/home/components/Hero";
import DailyProducts from "@/features/public/home/components/DailyProducts";
import CommunityBanner from "@/features/public/home/components/CommunityBanner";

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
          {/* PRODUCTOS DEL DÍA */}
          <section className="mt-6 sm:mt-8">
            <DailyProducts />
          </section>

          {/* COMUNIDAD */}
          <section className="mt-6 mb-8 sm:mt-8 sm:mb-10">
            <CommunityBanner />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}