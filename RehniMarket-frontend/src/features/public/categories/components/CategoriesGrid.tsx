/** Página Explorar categorías: búsqueda, filtro y orden en cliente sobre /public/catalogs, con paginación. */
import { useEffect, useMemo, useState } from "react";
import { FolderSearch } from "lucide-react";

import CategoriesFilterBar from "./CategoriesFilterBar";
import CategoryCard from "./CategoryCard";
import CategoryCardSkeleton from "./CategoryCardSkeleton";
import Pagination from "@/shared/components/Pagination";
import { EmptyState, ErrorState } from "@/shared/components/ui";

import { getCatalogs } from "@/features/public/products/api/productsService";

import type { PublicCatalog } from "@/features/public/products/types/response";
import type { CategorySort } from "../utils/categorySort";

const PAGE_SIZE = 8;
const SKELETON_COUNT = PAGE_SIZE;
// 1 columna en móviles muy estrechos, 2 en móvil ancho y tablet, 3 en escritorio estándar y 4 en grande.
const GRID =
  "grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4";

export default function CategoriesGrid() {
  const [categories, setCategories] = useState<PublicCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [sort, setSort] = useState<CategorySort>("featured");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

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

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

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
    <div className="mx-auto w-full max-w-[clamp(1280px,90vw,1600px)] px-3 py-6 sm:px-4 sm:py-8 lg:px-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Explorar categorías
        </h1>
        <p className="mt-1 text-sm text-ink-muted sm:text-base">
          Encuentra productos increíbles en todas nuestras categorías.
        </p>
      </header>

      <div className="mt-6">
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
            <div className={GRID}>
              {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                <CategoryCardSkeleton key={index} />
              ))}
            </div>
          ) : failed ? (
            <ErrorState
              title="No se pudieron cargar las categorías"
              description="Intenta de nuevo en unos momentos."
              onRetry={() => setReloadKey((k) => k + 1)}
            />
          ) : visibleCategories.length === 0 ? (
            <EmptyState
              icon={<FolderSearch size={22} />}
              title={
                search || selectedName
                  ? "No hay categorías que coincidan con tu búsqueda."
                  : "Aún no hay categorías disponibles."
              }
            />
          ) : (
            <>
              <div className={GRID}>
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
