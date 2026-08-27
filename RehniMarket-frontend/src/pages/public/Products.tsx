import NavBar from "@/shared/components/navbar/navbar";

import ProductsList from "@/features/public/products/components/ProductsList";

export default function Products() {
  return (
    <div>
      <NavBar />
      <ProductsList />
    </div>
  );
}