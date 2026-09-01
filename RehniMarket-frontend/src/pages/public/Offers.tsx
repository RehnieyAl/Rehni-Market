import NavBar from "@/shared/components/navbar/navbar";
import Footer from "@/shared/components/Footer";

import CollectionView from "@/features/public/products/components/CollectionView";
import { getPublicOffers } from "@/features/public/products/api/productsService";

export default function Offers() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <NavBar />

      <main className="flex-1">
        <CollectionView
          title="Ofertas"
          subtitle="Productos con descuento vigente en alguna de sus variantes disponibles."
          emptyMessage="No hay ofertas disponibles en este momento."
          fetchPage={getPublicOffers}
        />
      </main>

      <Footer />
    </div>
  );
}
