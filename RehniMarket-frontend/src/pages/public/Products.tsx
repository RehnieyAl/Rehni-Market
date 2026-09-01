import NavBar from "@/shared/components/navbar/navbar";
import Footer from "@/shared/components/Footer";

import ProductsList from "@/features/public/products/components/ProductsList";

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
