import NavBar from "@/shared/components/navbar/navbar";
import Footer from "@/shared/components/Footer";

import Hero from "@/features/public/home/components/Hero";
import CategoriesSection from "@/features/public/home/components/CategoriesSection";
import OffersSection from "@/features/public/home/components/OffersSection";
import NewProductsSection from "@/features/public/home/components/NewProductsSection";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <NavBar />

      <main className="flex-1 pb-14">
        <section className="pt-3 sm:pt-4">
          <Hero />
        </section>

        <div className="mx-auto w-full max-w-[clamp(1280px,90vw,1600px)] px-2 sm:px-4 lg:px-8">
          <CategoriesSection />
          <OffersSection />
          <NewProductsSection />
        </div>
      </main>

      <Footer />
    </div>
  );
}
