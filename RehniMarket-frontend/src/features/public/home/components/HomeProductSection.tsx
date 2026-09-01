import { useEffect, useState } from "react";

import HomeProductCarousel from "./HomeProductCarousel";

import type { PublicProductCard } from "../types/response";

interface HomeProductSectionProps {
  title: string;
  viewAllHref: string;
  emptyMessage: string;
  fetchProducts: () => Promise<PublicProductCard[]>;
}

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
