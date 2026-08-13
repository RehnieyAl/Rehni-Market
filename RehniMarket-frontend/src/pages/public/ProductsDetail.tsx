import NavBar from "@/shared/components/navbar/navbar";
import Footer from "@/shared/components/Footer";

import ProductDetail from "@/features/public/products/components/ProductDetail";

export default function ProductsDetail() {
  return (
    <div>
      <NavBar />
      <ProductDetail />
      <Footer />
    </div>
  );
}
