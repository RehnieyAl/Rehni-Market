import { useEffect, useMemo, useState } from "react";

import CategoriesHero from "./CategoriesHero";
import CategoriesFilterBar from "./CategoriesFilterBar";
import CategoryCard from "./CategoryCard";
import CategoryCardSkeleton from "./CategoryCardSkeleton";
import Pagination from "@/shared/components/Pagination";

import { getCatalogs } from "@/features/public/products/api/productsService";

import type { PublicCatalog } from "@/features/public/products/types/response";
import type { CategorySort } from "../utils/categorySort";

const PAGE_SIZE = 8;
const SKELETON_COUNT = PAGE_SIZE;

// Página "Explorar categorías". Datos: GET /public/catalogs; búsqueda/orden/paginación en el cliente.
export default function CategoriesGrid() {
  const [categories, setCategories] = useState<PublicCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [sort, setSort] = useState<CategorySort>("popular");
  const [page, setPage] = useState(1);

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

  // Nombres para el dropdown de categoría, sobre la lista completa.
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

    // "Más populares" no tiene métrica real (sin visitas/ventas por categoría): se deja el orden del backend.
    // "Más productos" sí es un dato real.
    if (sort === "products") {
      result = [...result].sort((a, b) => b.product_count - a.product_count);
    } else if (sort === "az") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, "es"));
    } else if (sort === "za") {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name, "es"));
    }

    return result;
  }, [categories, search, selectedName, sort]);

  const totalPages = Math.max(1, Math.ceil(visibleCategories.length / PAGE_SIZE));

  // Si `page` queda fuera de rango tras filtrar, se recalcula acá (derivado, no en un efecto).
  const currentPage = Math.min(page, totalPages);

  const pagedCategories = useMemo(
    () => visibleCategories.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [visibleCategories, currentPage],
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleSelectedNameChange = (value: string) => {
    setSelectedName(value);
    setPage(1);
  };

  const handleSortChange = (value: CategorySort) => {
    setSort(value);
    setPage(1);
  };

  return (
    <div>
      <CategoriesHero />

      <div className="mx-auto w-full max-w-[clamp(1280px,90vw,1600px)] px-2 py-6 sm:px-4 sm:py-8 lg:px-8">
        <CategoriesFilterBar
          search={search}
          onSearchChange={handleSearchChange}
          categoryNames={categoryNames}
          selectedName={selectedName}
          onSelectedNameChange={handleSelectedNameChange}
          sort={sort}
          onSortChange={handleSortChange}
        />

        <div className="mt-6 sm:mt-8">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
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
            <>
              <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                {pagedCategories.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>

              <div className="mt-8">
                <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
