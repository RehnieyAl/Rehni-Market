import NavBar from "@/shared/components/navbar/navbar";
import Footer from "@/shared/components/Footer";

import Hero from "@/features/public/home/components/Hero";
import HomeInfoCards from "@/features/public/home/components/HomeInfoCards";
import CategoriesSection from "@/features/public/home/components/CategoriesSection";
import NewProductsSection from "@/features/public/home/components/NewProductsSection";
import OffersSection from "@/features/public/home/components/OffersSection";
import BusinessCtaSection from "@/features/public/home/components/BusinessCtaSection";

export default function Home() {
  return (
    <div className="theme-dark flex min-h-screen flex-col bg-canvas text-ink">
      <NavBar />

      <main className="flex-1 pb-4">
        <section className="pt-3 sm:pt-5">
          <Hero />
        </section>

        <div className="mx-auto w-full max-w-[clamp(1280px,90vw,1600px)] px-3 sm:px-4 lg:px-8">
          <div className="mt-4 sm:mt-6">
            <HomeInfoCards />
          </div>

          <CategoriesSection />

          {/* Novedades SIEMPRE antes de Ofertas. */}
          <NewProductsSection />
          <OffersSection />

          <BusinessCtaSection />
        </div>
      </main>

      <Footer />
    </div>
  );
}
