import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import HomeCategoryCard, {
  HomeCategoryCardSkeleton,
} from "./HomeCategoryCard";

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
    <section className="mt-10 sm:mt-12">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Explorar categorías
        </h2>

        <Link
          to="/categories"
          className="flex items-center gap-1 text-sm font-medium text-primary transition hover:text-primary-hover"
        >
          Ver todas
          <ArrowRight size={16} />
        </Link>
      </div>

      {failed ? (
        <div className="mt-5 rounded-card border border-gray-200 p-8 text-center text-sm text-gray-500">
          No se pudieron cargar las categorías.
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-6 lg:grid-cols-8">
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
