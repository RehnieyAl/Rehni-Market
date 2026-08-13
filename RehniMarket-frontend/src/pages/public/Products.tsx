import NavBar from "@/shared/components/navbar/navbar";
import Footer from "@/shared/components/Footer";

import ProductsList from "@/features/public/products/components/ProductsList";

export default function Products() {
  return (
    <div>
      <NavBar />
      <ProductsList />
      <Footer />
    </div>
  );
}