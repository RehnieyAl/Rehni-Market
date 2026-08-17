import { useEffect, useMemo, useState } from "react";

import CategoriesHero from "./CategoriesHero";
import CategoriesFilterBar from "./CategoriesFilterBar";
import CategoryCard from "./CategoryCard";
import CategoryCardSkeleton from "./CategoryCardSkeleton";
import CategoriesBenefits from "./CategoriesBenefits";

import { getCatalogs } from "@/features/public/products/api/productsService";

import type { PublicCatalog } from "@/features/public/products/types/response";
import type { CategorySort } from "../utils/categorySort";

const SKELETON_COUNT = 8;

// Página pública "Explorar categorías" (ver ALCANCE > rediseño
// Categorías). Único punto de datos real: GET /public/catalogs (ver
// getCatalogs) - búsqueda/filtro/orden se resuelven en el cliente sobre
// ese resultado, son pocas categorías y no justifican un endpoint aparte.
export default function CategoriesGrid() {
  const [categories, setCategories] = useState<PublicCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [sort, setSort] = useState<CategorySort>("popular");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setFailed(false);

        const response = await getCatalogs();

        if (!cancelled) {
          setCategories(response);
        }
      } catch (error) {
        console.error("Error cargando categorías:", error);

        if (!cancelled) {
          setFailed(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // Nombres reales para el dropdown de categoría (sobre la lista completa,
  // no la ya filtrada) - siempre ofrece todas las opciones disponibles.
  const categoryNames = useMemo(
    () => [...new Set(categories.map((category) => category.name))],
    [categories],
  );

  const visibleCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    let result = categories.filter((category) => {
      const matchesSearch = !query || category.name.toLowerCase().includes(query);
      const matchesSelected = !selectedName || category.name === selectedName;

      return matchesSearch && matchesSelected;
    });

    // "Más populares" no tiene una métrica real detrás (no hay
    // visitas/ventas por categoría en el modelo actual, mismo criterio
    // que company_dashboard_products_summary_service - ver
    // DashboardService/company/Dashboard.py: no se inventan estadísticas
    // que no existen) - se deja el orden real que ya devuelve el backend
    // (alfabético, ver get_catalogs_service) en vez de simular
    // popularidad. "Más productos" sí es un dato real y ordena por él.
    if (sort === "products") {
      result = [...result].sort((a, b) => b.product_count - a.product_count);
    } else if (sort === "az") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, "es"));
    } else if (sort === "za") {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name, "es"));
    }

    return result;
  }, [categories, search, selectedName, sort]);

  return (
    <div>
      <CategoriesHero />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CategoriesFilterBar
          search={search}
          onSearchChange={setSearch}
          categoryNames={categoryNames}
          selectedName={selectedName}
          onSelectedNameChange={setSelectedName}
          sort={sort}
          onSortChange={setSort}
        />

        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                <CategoryCardSkeleton key={index} />
              ))}
            </div>
          ) : failed ? (
            <div className="rounded-2xl border p-12 text-center text-gray-500">
              No se pudieron cargar las categorías.
            </div>
          ) : visibleCategories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
              No hay categorías disponibles.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {visibleCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
      </div>

      <CategoriesBenefits />
    </div>
  );
}
