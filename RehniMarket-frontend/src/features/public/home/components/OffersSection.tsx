import HomeProductSection from "./HomeProductSection";
import { getPublicOffers } from "@/features/public/products/api/productsService";

const HOME_LIMIT = 12;

async function fetchHomeOffers() {
  const response = await getPublicOffers(1, HOME_LIMIT);
  return response.products;
}

export default function OffersSection() {
  return (
    <HomeProductSection
      title="Ofertas"
      viewAllHref="/offers"
      emptyMessage="No hay ofertas disponibles en este momento."
      fetchProducts={fetchHomeOffers}
    />
  );
}
