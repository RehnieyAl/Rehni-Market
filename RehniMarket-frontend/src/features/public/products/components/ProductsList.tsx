import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, RotateCcw } from "lucide-react";

import { getCatalogs, getPublicProducts } from "../api/productsService";
import ProductGrid from "./ProductGrid";
import CatalogFilters from "./CatalogFilters";
import { Button, Modal } from "@/shared/components/ui";

import type { PublicProductCard } from "@/features/public/home/types/response";
import type { PublicCatalog } from "../types/response";

const PAGE_SIZE = 12;

export default function ProductsList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const catalog = searchParams.get("catalog") ?? "";
  const minPriceParam = searchParams.get("minPrice") ?? "";
  const maxPriceParam = searchParams.get("maxPrice") ?? "";
  const discountOnly = searchParams.get("discount") === "1";
  const inStockOnly = searchParams.get("inStock") === "1";
  const minDiscountParam = searchParams.get("minDiscount");
  const maxStockParam = searchParams.get("maxStock");
  const daysParam = searchParams.get("days");
  const sort = searchParams.get("sort") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const [minPriceInput, setMinPriceInput] = useState(minPriceParam);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPriceParam);

  const [categorySearchInput, setCategorySearchInput] = useState(search);

  const [catalogs, setCatalogs] = useState<PublicCatalog[]>([]);
  const [products, setProducts] = useState<PublicProductCard[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const updateParams = (changes: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(searchParams);

    for (const [key, value] of Object.entries(changes)) {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    }

    if (resetPage) {
      next.delete("page");
    }

    setSearchParams(next);
  };

  const handleCatalogChange = (nextCatalog: string) => {
    updateParams({ catalog: nextCatalog || null, search: null });
    setCategorySearchInput("");
  };

  const handlePageChange = (nextPage: number) => {
    updateParams({ page: nextPage > 1 ? String(nextPage) : null }, false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearFilters = () => {
    setSearchParams(search && !catalog ? { search } : {});
  };

  const activeFilterCount = [
    !!catalog,
    !!minPriceParam,
    !!maxPriceParam,
    discountOnly,
    inStockOnly,
    !!sort,
  ].filter(Boolean).length;

  const hasActiveFilters =
    activeFilterCount > 0 || !!minDiscountParam || !!maxStockParam || !!daysParam;

  useEffect(() => {
    let cancelled = false;

    getCatalogs()
      .then((response) => {
        if (!cancelled) setCatalogs(response);
      })
      .catch((error) => console.error("Error cargando categorías:", error));

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setMinPriceInput(minPriceParam);
      setMaxPriceInput(maxPriceParam);
    });

    return () => clearTimeout(timeout);
  }, [minPriceParam, maxPriceParam]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (minPriceInput === minPriceParam && maxPriceInput === maxPriceParam) return;

      updateParams({ minPrice: minPriceInput || null, maxPrice: maxPriceInput || null }, true);
    }, 400);

    return () => clearTimeout(timeout);
  }, [minPriceInput, maxPriceInput]);

  useEffect(() => {
    const timeout = setTimeout(() => setCategorySearchInput(search));

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!catalog) return;

    const timeout = setTimeout(() => {
      if (categorySearchInput === search) return;

      updateParams({ search: categorySearchInput || null }, true);
    }, 400);

    return () => clearTimeout(timeout);
  }, [categorySearchInput, catalog]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setFailed(false);

        const response = await getPublicProducts({
          search: search || undefined,
          catalogId: catalog || undefined,
          minPrice: minPriceParam ? Number(minPriceParam) : undefined,
          maxPrice: maxPriceParam ? Number(maxPriceParam) : undefined,
          discount: discountOnly || undefined,
          inStock: inStockOnly || undefined,
          minDiscount: minDiscountParam ? Number(minDiscountParam) : undefined,
          maxStock: maxStockParam ? Number(maxStockParam) : undefined,
          days: daysParam ? Number(daysParam) : undefined,
          sort: (sort || undefined) as "price_asc" | "price_desc" | "discount" | undefined,
          page,
          limit: PAGE_SIZE,
        });

        if (!cancelled) {
          setProducts(response.products);
          setTotal(response.total);
          setTotalPages(response.total_pages || 1);
        }
      } catch (error) {
        console.error("Error cargando productos:", error);

        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [
    search,
    catalog,
    minPriceParam,
    maxPriceParam,
    discountOnly,
    inStockOnly,
    minDiscountParam,
    maxStockParam,
    daysParam,
    sort,
    page,
  ]);

  const selectedCatalog = catalog ? catalogs.find((c) => c.id === catalog) : undefined;


  const filterProps = {
    catalogs,
    catalog,
    onCatalogChange: handleCatalogChange,
    selectedCatalog,
    categorySearch: categorySearchInput,
    onCategorySearchChange: setCategorySearchInput,
    minPrice: minPriceInput,
    maxPrice: maxPriceInput,
    onMinPriceChange: setMinPriceInput,
    onMaxPriceChange: setMaxPriceInput,
    discountOnly,
    inStockOnly,
    onToggle: (key: "discount" | "inStock", checked: boolean) =>
      updateParams({ [key]: checked ? "1" : null }),
    sort,
    onSortChange: (value: string) => updateParams({ sort: value || null }),
  };

  const heading =
    selectedCatalog && !search
      ? selectedCatalog.name
      : search
        ? `Resultados para "${search}"`
        : "Productos";

  return (
    <section className="mx-auto w-full max-w-[clamp(1280px,90vw,1600px)] px-3 py-6 sm:px-4 sm:py-8 lg:px-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{heading}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {loading ? "Buscando productos…" : `${total} productos encontrados`}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[264px_1fr] lg:gap-8">
        <aside className="hidden h-fit rounded-card border border-gray-200 bg-white p-5 shadow-card lg:block">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-700" />
              <h2 className="font-semibold text-gray-900">Filtros</h2>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <RotateCcw size={13} />
                Limpiar
              </button>
            )}
          </div>

          <CatalogFilters {...filterProps} />
        </aside>

        <div>
          <div className="mb-4 lg:hidden">
            <Button
              variant="outline"
              fullWidth
              leadingIcon={<Filter size={16} />}
              onClick={() => setFiltersOpen(true)}
            >
              Filtros
              {activeFilterCount > 0 && (
                <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-fg">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          <ProductGrid
            products={products}
            loading={loading}
            failed={failed}
            total={total}
            page={page}
            totalPages={totalPages}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
            emptyMessage="No se encontraron productos con estos filtros."
          />
        </div>
      </div>

      <Modal
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtros"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                handleClearFilters();
                setFiltersOpen(false);
              }}
              disabled={!hasActiveFilters}
            >
              Limpiar
            </Button>
            <Button onClick={() => setFiltersOpen(false)}>
              Ver {total} productos
            </Button>
          </>
        }
      >
        <CatalogFilters {...filterProps} />
      </Modal>
    </section>
  );
}
