import NavBar from "@/shared/components/navbar/navbar";
import Footer from "@/shared/components/Footer";

import ProductDetail from "@/features/public/products/components/ProductDetail";

// Página delgada: NavBar + detalle de producto + Footer.
export default function ProductsDetail() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <NavBar />

      <main className="flex-1">
        <ProductDetail />
      </main>

      <Footer />
    </div>
  );
}
