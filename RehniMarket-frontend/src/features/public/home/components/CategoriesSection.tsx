import { useEffect, useState } from "react";

import HomeCategoryCard, {
  HomeCategoryCardSkeleton,
} from "./HomeCategoryCard";
import HomeSectionHeader from "./HomeSectionHeader";

import { getCatalogs } from "@/features/public/products/api/productsService";

import type { PublicCatalog } from "@/features/public/products/types/response";

const MAX_CATEGORIES = 8;

export default function CategoriesSection() {
  const [categories, setCategories] = useState<PublicCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setFailed(false);

        const response = await getCatalogs();

        if (!cancelled) {
          setCategories(response.slice(0, MAX_CATEGORIES));
        }
      } catch (error) {
        console.error("Error cargando categorías:", error);

        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && !failed && categories.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 sm:mt-14">
      <HomeSectionHeader
        title="Explorar categorías"
        subtitle="Encuentra exactamente lo que necesitas"
        viewAllHref="/categories"
      />

      {failed ? (
        <div className="mt-5 rounded-card border border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-hairline dark:text-ink-muted">
          No se pudieron cargar las categorías.
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6 xl:grid-cols-8">
          {loading
            ? Array.from({ length: MAX_CATEGORIES }).map((_, index) => (
                <HomeCategoryCardSkeleton key={index} />
              ))
            : categories.map((category) => (
                <HomeCategoryCard key={category.id} category={category} />
              ))}
        </div>
      )}
    </section>
  );
}
