import NavBar from "@/shared/components/navbar/navbar";
import Footer from "@/shared/components/Footer";

import CollectionView from "@/features/public/products/components/CollectionView";
import { getPublicNewProducts } from "@/features/public/products/api/productsService";

export default function NewProducts() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-1">
      <NavBar />

      <main className="flex-1">
        <CollectionView
          title="Novedades"
          subtitle="Lo último que se publicó en RehniMarket, de lo más reciente a lo más antiguo."
          emptyMessage="No hay novedades disponibles en este momento."
          fetchPage={getPublicNewProducts}
        />
      </main>

      <Footer />
    </div>
  );
}
