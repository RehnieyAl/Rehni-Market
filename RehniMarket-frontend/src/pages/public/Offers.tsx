/** Ruta /offers: navegación, catálogo de ofertas con filtros y pie de página. */
import NavBar from "@/shared/components/navbar/navbar";
import Footer from "@/shared/components/Footer";

import OffersCatalog from "@/features/public/products/components/OffersCatalog";

export default function Offers() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <NavBar />

      <main className="flex-1">
        <OffersCatalog />
      </main>

      <Footer />
    </div>
  );
}
