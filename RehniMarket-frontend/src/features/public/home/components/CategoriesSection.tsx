import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import CategoryCard from "@/features/public/categories/components/CategoryCard";
import CategoryCardSkeleton from "@/features/public/categories/components/CategoryCardSkeleton";

import { getCatalogs } from "@/features/public/products/api/productsService";

import type { PublicCatalog } from "@/features/public/products/types/response";

// Límites de categorías visibles en el Home (ver ALCANCE > optimización
// de categorías en Home) - NO afecta /categories (página completa, sin
// límite) ni el backend/servicio de catálogos, solo cuánto se renderiza
// acá. MAX_CATEGORIES es el máximo a nivel global (desktop); en
// tablet/mobile se ocultan las categorías por encima de
// TABLET_MOBILE_LIMIT vía CSS (hidden lg:block), no se piden menos datos
// al backend - así no hay "salto" de contenido al redimensionar entre
// breakpoints, ya está cargado.
const MAX_CATEGORIES = 5;
const TABLET_MOBILE_LIMIT = 4;

// Sección "Explorar categorías" del Home (ver ALCANCE > Módulo completo
// de Categorías): Banner → Explorar categorías → Productos destacados.
// Reutiliza CategoryCard/CategoryCardSkeleton tal cual (misma tarjeta que
// la página /categories completa, ver features/public/categories) - acá
// solo cambia el layout (grid, no la página completa con filtros) y el
// límite de resultados.
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
        // get_catalogs_service) - acá solo se recorta a MAX_CATEGORIES,
        // manteniendo ese mismo orden.
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
    // Margen superior propio (ver ALCANCE > auditoría visual, "Secciones
    // vacías") - así, si arriba se retorna null, el margen desaparece
    // con la sección en vez de dejar un <section> vacío con mt- en
    // Home.tsx. Mismo valor que DailyProducts.tsx (ritmo uniforme de
    // 40/48px entre TODAS las secciones del Home).
    <section className="mt-10 sm:mt-12">
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
        // Desktop: 4 columnas (5 tarjetas → 4 + 1). Tablet/mobile: 2
        // columnas, 4 tarjetas (ver ALCANCE > GRID DE CATEGORÍAS /
        // optimización de categorías en Home). La 5ª tarjeta (índice 4)
        // se oculta por debajo de lg en vez de no pedirse/renderizarse,
        // para no re-fetch ni layout shift al cruzar el breakpoint.
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5 lg:grid-cols-5">
          {loading
            ? Array.from({ length: MAX_CATEGORIES }).map((_, index) => (
                <div
                  key={index}
                  className={
                    index >= TABLET_MOBILE_LIMIT ? "hidden lg:block" : undefined
                  }
                >
                  <CategoryCardSkeleton />
                </div>
              ))
            : categories.map((category, index) => (
                <div
                  key={category.id}
                  className={
                    index >= TABLET_MOBILE_LIMIT ? "hidden lg:block" : undefined
                  }
                >
                  <CategoryCard category={category} />
                </div>
              ))}
        </div>
      )}
    </section>
  );
}
