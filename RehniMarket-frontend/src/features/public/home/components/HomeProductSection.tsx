import { useEffect, useState } from "react";

import HomeProductCarousel from "./HomeProductCarousel";

import type { PublicProductCard } from "../types/response";

interface HomeProductSectionProps {
  title: string;
  viewAllHref: string;
  emptyMessage: string;
  // Trae la primera página de la sección (Ofertas, Novedades). La regla de negocio
  // vive en el endpoint, no aquí.
  fetchProducts: () => Promise<PublicProductCard[]>;
}

// Sección de carrusel del Home con su propio fetch. Cada apartado (Ofertas,
// Novedades) pasa su fuente y sus textos; la presentación es HomeProductCarousel.
export default function HomeProductSection({
  title,
  viewAllHref,
  emptyMessage,
  fetchProducts,
}: HomeProductSectionProps) {
  const [products, setProducts] = useState<PublicProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setFailed(false);

        const response = await fetchProducts();

        if (!cancelled) setProducts(response);
      } catch (error) {
        console.error(`Error cargando la sección "${title}":`, error);
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [fetchProducts, title]);

  return (
    <HomeProductCarousel
      title={title}
      viewAllHref={viewAllHref}
      products={products}
      loading={loading}
      failed={failed}
      emptyMessage={emptyMessage}
    />
  );
}
