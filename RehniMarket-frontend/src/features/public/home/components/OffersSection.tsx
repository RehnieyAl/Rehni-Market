import { Percent } from "lucide-react";

import HomeProductSection from "./HomeProductSection";
import { getPublicOffers } from "@/features/public/products/api/productsService";

const HOME_LIMIT = 6;

async function fetchHomeOffers() {
  const response = await getPublicOffers(1, HOME_LIMIT);
  return response.products;
}

export default function OffersSection() {
  return (
    <HomeProductSection
      title="Ofertas especiales"
      subtitle="Aprovecha los mejores precios en tecnología de las mejores marcas."
      icon={<Percent size={18} />}
      viewAllHref="/offers"
      emptyMessage="No hay ofertas disponibles en este momento."
      cardKind="offer"
      fetchProducts={fetchHomeOffers}
    />
  );
}
