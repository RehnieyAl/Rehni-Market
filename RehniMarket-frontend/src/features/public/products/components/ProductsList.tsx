import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, RotateCcw, Search, X } from "lucide-react";

import ProductCard from "@/features/public/home/components/ProductCard";
import ProductCardSkeleton from "@/features/public/home/components/ProductCardSkeleton";
import { getCatalogs, getPublicProducts } from "../api/productsService";

import type { PublicProductCard } from "@/features/public/home/types/response";
import type { PublicCatalog } from "../types/response";

const PAGE_SIZE = 10;

const SORT_OPTIONS = [
  { value: "", label: "Relevancia" },
  { value: "price_asc", label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
  { value: "discount", label: "Mayor descuento" },
] as const;

// Lista compacta de páginas con "…": ancla 1-3 al inicio, las 2 últimas al final
// y el entorno de la página actual.
function buildPageList(current: number, total: number): (number | "ellipsis")[] {
  const anchors = new Set(
    [1, 2, 3, total - 1, total, current - 1, current, current + 1].filter(
      (n) => n >= 1 && n <= total,
    ),
  );

  const sorted = [...anchors].sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let previous = 0;

  for (const n of sorted) {
    if (previous && n - previous > 1) result.push("ellipsis");
    result.push(n);
    previous = n;
  }

  return result;
}

// Catálogo público con filtros resueltos por GET /public/products.
// El estado de los filtros vive en la URL (searchParams): links como
// "/products?catalog=<id>" llegan ya filtrados y son compartibles.
export default function ProductsList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const catalog = searchParams.get("catalog") ?? "";
  const minPriceParam = searchParams.get("minPrice") ?? "";
  const maxPriceParam = searchParams.get("maxPrice") ?? "";
  const discountOnly = searchParams.get("discount") === "1";
  const inStockOnly = searchParams.get("inStock") === "1";
  // Alimentados por los anuncios dinámicos; sin control propio en el sidebar, solo se honran desde la URL.
  const minDiscountParam = searchParams.get("minDiscount");
  const maxStockParam = searchParams.get("maxStock");
  const daysParam = searchParams.get("days");
  const sort = searchParams.get("sort") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  // Buffer local para los inputs de precio; se debouncean antes de escribir a la URL.
  const [minPriceInput, setMinPriceInput] = useState(minPriceParam);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPriceParam);

  // Buscador "dentro de la categoría": escribe al mismo param `search` (search+catalog con AND).
  const [categorySearchInput, setCategorySearchInput] = useState(search);

  const [catalogs, setCatalogs] = useState<PublicCatalog[]>([]);
  const [products, setProducts] = useState<PublicProductCard[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // Actualiza filtros en la URL; cualquier cambio de filtro vuelve a la página 1.

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

  // Cambiar de categoría limpia la búsqueda "dentro de la categoría".

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

  const hasActiveFilters =
    !!catalog ||
    !!minPriceParam ||
    !!maxPriceParam ||
    discountOnly ||
    inStockOnly ||
    !!minDiscountParam ||
    !!maxStockParam ||
    !!daysParam ||
    !!sort;

  // Catálogos reales para el filtro de categoría.

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

  // Sincroniza los inputs de precio si el filtro cambia desde afuera ("Limpiar filtros", link externo).

  useEffect(() => {
    const timeout = setTimeout(() => {
      setMinPriceInput(minPriceParam);
      setMaxPriceInput(maxPriceParam);
    });

    return () => clearTimeout(timeout);
  }, [minPriceParam, maxPriceParam]);

  // Debounce 400ms de los inputs de precio antes de escribir a la URL.

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (minPriceInput === minPriceParam && maxPriceInput === maxPriceParam) return;

      updateParams({ minPrice: minPriceInput || null, maxPrice: maxPriceInput || null }, true);
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPriceInput, maxPriceInput]);

  // Sincroniza el buscador de categoría si `search` cambia desde afuera.

  useEffect(() => {
    const timeout = setTimeout(() => setCategorySearchInput(search));

    return () => clearTimeout(timeout);
  }, [search]);

  // Debounce 400ms del buscador de categoría; solo activo con una categoría seleccionada.

  useEffect(() => {
    if (!catalog) return;

    const timeout = setTimeout(() => {
      if (categorySearchInput === search) return;

      updateParams({ search: categorySearchInput || null }, true);
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySearchInput, catalog]);

  // El fetch real: la fuente de verdad son los filtros de la URL, no los buffers locales.

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

  // Categoría seleccionada, derivada de la lista de catálogos ya cargada.

  const selectedCatalog = catalog ? catalogs.find((c) => c.id === catalog) : undefined;

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const pageList = buildPageList(page, totalPages);

  return (
    <section className="mx-auto w-full max-w-[clamp(1280px,90vw,1600px)] px-2 py-6 sm:px-4 sm:py-8 lg:px-8">
      {selectedCatalog && !search ? (
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {selectedCatalog.name}
          </h1>

          <p className="mt-1 text-gray-500">
            {loading ? "Cargando productos..." : `${total} productos encontrados`}
          </p>
        </div>
      ) : (
        <div className="mb-5">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            {search ? `Resultados para "${search}"` : "Productos"}
          </h1>

          <p className="mt-1 text-gray-500">
            {loading ? "Cargando productos..." : `${total} productos encontrados`}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr] lg:gap-8">

        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-700" />
              <h2 className="font-semibold text-gray-900">Filtros</h2>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 text-sm font-medium text-[#6D0F2D] hover:underline"
              >
                <RotateCcw size={13} />
                Limpiar todo
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-100">

            <div className="pb-4">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                Categoría
              </label>

              <select
                value={catalog}
                onChange={(e) => handleCatalogChange(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-sm text-gray-700 outline-none transition focus:border-[#6D0F2D]"
              >
                <option value="">Todas las categorías</option>
                {catalogs.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} ({option.product_count})
                  </option>
                ))}
              </select>

              {selectedCatalog && (
                <div className="mt-3">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Buscar dentro de {selectedCatalog.name}
                  </label>

                  <div className="flex h-10 items-center rounded-xl border border-gray-200 bg-white px-3 transition focus-within:border-[#6D0F2D] focus-within:ring-2 focus-within:ring-[#6D0F2D]/10">
                    <Search size={15} className="shrink-0 text-gray-400" aria-hidden="true" />

                    <input
                      type="text"
                      value={categorySearchInput}
                      onChange={(e) => setCategorySearchInput(e.target.value)}
                      placeholder={`Ej. ${selectedCatalog.name}...`}
                      className="ml-2 min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    />

                    {categorySearchInput && (
                      <button
                        type="button"
                        onClick={() => setCategorySearchInput("")}
                        aria-label="Limpiar búsqueda"
                        className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="py-4">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                Precio mínimo y máximo
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  placeholder="Mínimo"
                  className="w-full min-w-0 rounded-xl border border-gray-200 p-2.5 text-sm outline-none transition focus:border-[#6D0F2D]"
                />

                <span className="shrink-0 text-gray-400">–</span>

                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  placeholder="Máximo"
                  className="w-full min-w-0 rounded-xl border border-gray-200 p-2.5 text-sm outline-none transition focus:border-[#6D0F2D]"
                />
              </div>
            </div>

            <div className="space-y-3 py-4">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={discountOnly}
                  onChange={(e) => updateParams({ discount: e.target.checked ? "1" : null })}
                  className="h-4 w-4 rounded border-gray-300 accent-[#6D0F2D]"
                />
                Solo con descuento
              </label>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => updateParams({ inStock: e.target.checked ? "1" : null })}
                  className="h-4 w-4 rounded border-gray-300 accent-[#6D0F2D]"
                />
                Solo disponibles
              </label>
            </div>

            <div className="pt-4">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                Ordenar por
              </label>

              <select
                value={sort}
                onChange={(e) => updateParams({ sort: e.target.value || null })}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-sm text-gray-700 outline-none transition focus:border-[#6D0F2D]"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        <div>
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : failed ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
              No se pudieron cargar los productos. Intenta de nuevo más tarde.
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
              No se encontraron productos con estos filtros.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="mt-8 flex flex-col items-center gap-3">
                <p className="text-sm text-gray-500">
                  Mostrando {rangeStart}-{rangeEnd} de {total} productos
                </p>

                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <button
                      disabled={page === 1}
                      onClick={() => handlePageChange(page - 1)}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
                    >
                      Anterior
                    </button>

                    {pageList.map((item, index) =>
                      item === "ellipsis" ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="px-1.5 text-sm text-gray-400"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => handlePageChange(item)}
                          aria-current={item === page}
                          className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-medium transition ${
                            item === page
                              ? "bg-[#6D0F2D] text-white"
                              : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {item}
                        </button>
                      ),
                    )}

                    <button
                      disabled={page === totalPages}
                      onClick={() => handlePageChange(page + 1)}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
