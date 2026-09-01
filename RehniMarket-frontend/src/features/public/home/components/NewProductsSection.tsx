import HomeProductSection from "./HomeProductSection";
import { getPublicNewProducts } from "@/features/public/products/api/productsService";

const HOME_LIMIT = 12;

async function fetchHomeNewProducts() {
  const response = await getPublicNewProducts(1, HOME_LIMIT);
  return response.products;
}

export default function NewProductsSection() {
  return (
    <HomeProductSection
      title="Novedades"
      viewAllHref="/new"
      emptyMessage="No hay novedades disponibles en este momento."
      fetchProducts={fetchHomeNewProducts}
    />
  );
}
