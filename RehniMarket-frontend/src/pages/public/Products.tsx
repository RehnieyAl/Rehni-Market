import NavBar from "@/shared/components/navbar/navbar";
import Footer from "@/shared/components/Footer";

import ProductsList from "@/features/public/products/components/ProductsList";

// Página delgada: NavBar + catálogo + Footer. Toda la lógica vive en features/public/products/*.
export default function Products() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <NavBar />

      <main className="flex-1">
        <ProductsList />
      </main>

      <Footer />
    </div>
  );
}
