import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import CategoryCard from "@/features/public/categories/components/CategoryCard";
import CategoryCardSkeleton from "@/features/public/categories/components/CategoryCardSkeleton";

import { getCatalogs } from "@/features/public/products/api/productsService";

import type { PublicCatalog } from "@/features/public/products/types/response";

const MAX_CATEGORIES = 8;

// Sección "Explorar categorías" del Home (ver ALCANCE > Módulo completo
// de Categorías): Banner → Explorar categorías → Productos destacados.
// Reutiliza CategoryCard/CategoryCardSkeleton tal cual (misma tarjeta que
// la página /categories completa, ver features/public/categories) - acá
// solo cambia el layout (grid fijo de 8, no la página completa con
// filtros) y el límite de resultados.
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

        // El backend ya devuelve solo categorías activas, ordenadas por
        // display_order ASC (ver publicService/Products.py >
        // get_catalogs_service) - acá solo se recorta a 8.
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

  // Ninguna categoría activa todavía - se omite la sección entera en vez
  // de mostrar un bloque vacío en el Home.
  if (!loading && !failed && categories.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Explorar categorías
        </h2>

        <Link
          to="/categories"
          className="flex items-center gap-1 text-sm font-medium text-[#6D0F2D] hover:underline"
        >
          Ver todas
          <ArrowRight size={16} />
        </Link>
      </div>

      {failed ? (
        <div className="mt-5 rounded-2xl border p-8 text-center text-sm text-gray-500">
          No se pudieron cargar las categorías.
        </div>
      ) : (
        // Desktop: 4 columnas × 2 filas (8 tarjetas). Tablet/mobile: 2
        // columnas (ver ALCANCE > GRID DE CATEGORÍAS).
        <div className="mt-5 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {loading
            ? Array.from({ length: MAX_CATEGORIES }).map((_, index) => (
                <CategoryCardSkeleton key={index} />
              ))
            : categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
        </div>
      )}
    </section>
  );
}
