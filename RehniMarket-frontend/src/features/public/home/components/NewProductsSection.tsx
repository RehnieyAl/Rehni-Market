import HomeProductSection from "./HomeProductSection";
import { getPublicNewProducts } from "@/features/public/products/api/productsService";

const HOME_LIMIT = 6;

async function fetchHomeNewProducts() {
  const response = await getPublicNewProducts(1, HOME_LIMIT);
  return response.products;
}

export default function NewProductsSection() {
  return (
    <HomeProductSection
      title="Novedades"
      subtitle="Descubre los últimos productos agregados a RehniMarket"
      badge="Nuevo"
      viewAllHref="/new"
      emptyMessage="No hay novedades disponibles en este momento."
      cardKind="new"
      fetchProducts={fetchHomeNewProducts}
    />
  );
}
