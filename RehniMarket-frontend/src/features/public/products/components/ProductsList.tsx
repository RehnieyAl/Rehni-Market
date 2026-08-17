import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, ImageOff } from "lucide-react";

import ProductCard from "@/features/public/home/components/ProductCard";
import ProductCardSkeleton from "@/features/public/home/components/ProductCardSkeleton";
import { getCatalogs, getPublicProducts } from "../api/productsService";

import type { PublicProductCard } from "@/features/public/home/types/response";
import type { PublicCatalog } from "../types/response";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "", label: "Relevancia" },
  { value: "price_asc", label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
  { value: "discount", label: "Mayor descuento" },
] as const;

// Catálogo público con filtros reales (ver ALCANCE > catálogo público):
// Categoría, Precio, Descuento, Disponibilidad y Ordenamiento, todos
// resueltos por GET /public/products (ver
// app/services/publicService/Products.py > list_public_products_service).
// El estado de los filtros vive en la URL (searchParams), no en state
// aparte - así un link como "/products?catalog=<id>" (ver
// features/public/categories/components/CategoryCard.tsx) o
// "/products?search=<q>" (ver navbar.tsx) llega ya filtrado, y los
// filtros son compartibles/recargables.
export default function ProductsList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const catalog = searchParams.get("catalog") ?? "";
  const minPriceParam = searchParams.get("minPrice") ?? "";
  const maxPriceParam = searchParams.get("maxPrice") ?? "";
  const discountOnly = searchParams.get("discount") === "1";
  const inStockOnly = searchParams.get("inStock") === "1";
  // Alimentados por los anuncios dinámicos por reglas (ver ALCANCE >
  // Anuncios dinámicos: PROMOTION/BLACK_FRIDAY/CYBER_DAYS/LIQUIDATION/
  // NEW_RELEASE) - no tienen controles propios en el sidebar (ver
  // ALCANCE > "no modificar diseño actual"), solo se honran cuando
  // llegan en la URL (ej. desde el botón de un anuncio).
  const minDiscountParam = searchParams.get("minDiscount");
  const maxStockParam = searchParams.get("maxStock");
  const daysParam = searchParams.get("days");
  const sort = searchParams.get("sort") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  // Buffer local para los inputs de precio: se debouncean antes de
  // reflejarse en la URL (y disparar el fetch) para no hacer un request
  // por cada tecla (mismo criterio que el buscador de Products.tsx en el
  // dashboard de empresa).
  const [minPriceInput, setMinPriceInput] = useState(minPriceParam);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPriceParam);

  const [catalogs, setCatalogs] = useState<PublicCatalog[]>([]);
  const [products, setProducts] = useState<PublicProductCard[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // Actualiza uno o varios filtros en la URL de una sola vez. Cambiar
  // cualquier filtro vuelve a la página 1 (salvo que el propio cambio sea
  // de página, ver handlePageChange) - un filtro nuevo casi nunca tiene
  // suficientes resultados para seguir en la página en la que ibas.
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

  const handlePageChange = (nextPage: number) => {
    updateParams({ page: nextPage > 1 ? String(nextPage) : null }, false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearFilters = () => {
    setSearchParams(search ? { search } : {});
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

  // Catálogos reales para el filtro de categoría (ver ALCANCE > "No
  // utilizar datos hardcodeados").
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

  // Sincroniza los inputs de precio si el filtro cambia desde afuera (ej.
  // "Limpiar filtros" o un link externo con ?minPrice=) - diferido con
  // setTimeout (mismo patrón usado en el resto del dashboard, ver
  // Orders.tsx) para no hacer setState de forma síncrona dentro del
  // efecto.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setMinPriceInput(minPriceParam);
      setMaxPriceInput(maxPriceParam);
    });

    return () => clearTimeout(timeout);
  }, [minPriceParam, maxPriceParam]);

  // Debounce: los inputs de precio solo escriben a la URL 400ms después
  // de que el usuario deja de escribir.
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (minPriceInput === minPriceParam && maxPriceInput === maxPriceParam) return;

      updateParams({ minPrice: minPriceInput || null, maxPrice: maxPriceInput || null }, true);
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPriceInput, maxPriceInput]);

  // El fetch real: única fuente de verdad son los filtros ya reflejados
  // en la URL (no los buffers locales de precio).
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

  // Categoría seleccionada (ver ALCANCE > "Página detalle de categoría"):
  // se deriva de la misma lista de catálogos ya cargada para el filtro de
  // arriba, sin pedirla de nuevo.
  const selectedCatalog = catalog ? catalogs.find((c) => c.id === catalog) : undefined;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {selectedCatalog && !search ? (
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-gray-100 sm:h-20 sm:w-20">
            {selectedCatalog.image_url ? (
              <img
                src={selectedCatalog.image_url}
                alt={selectedCatalog.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageOff size={24} className="text-gray-300" />
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{selectedCatalog.name}</h1>

            <p className="mt-1 text-gray-500">
              {selectedCatalog.product_count.toLocaleString("es-CO")}{" "}
              {selectedCatalog.product_count === 1 ? "producto" : "productos"}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            {search ? `Resultados para "${search}"` : "Productos"}
          </h1>

          <p className="mt-2 text-gray-500">
            {loading ? "Cargando productos..." : `${total} productos encontrados`}
          </p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* FILTROS */}
        <aside className="h-fit rounded-2xl border bg-white p-5">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter size={18} />
              <h2 className="font-semibold">Filtros</h2>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-sm font-medium text-[#6D0F2D] hover:underline"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="space-y-5">
            {/* CATEGORÍA */}
            <div>
              <label className="mb-2 block text-sm font-medium">Categoría</label>

              <select
                value={catalog}
                onChange={(e) => updateParams({ catalog: e.target.value || null })}
                className="w-full rounded-xl border p-3"
              >
                <option value="">Todas</option>
                {catalogs.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} ({option.product_count})
                  </option>
                ))}
              </select>
            </div>

            {/* PRECIO */}
            <div>
              <label className="mb-2 block text-sm font-medium">Precio</label>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  placeholder="Mín"
                  className="w-full rounded-xl border p-3"
                />

                <span className="text-gray-400">–</span>

                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  placeholder="Máx"
                  className="w-full rounded-xl border p-3"
                />
              </div>
            </div>

            {/* DESCUENTO */}
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
              <input
                type="checkbox"
                checked={discountOnly}
                onChange={(e) => updateParams({ discount: e.target.checked ? "1" : null })}
                className="h-4 w-4 rounded border-gray-300 accent-[#6D0F2D]"
              />
              Solo con descuento
            </label>

            {/* DISPONIBILIDAD */}
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => updateParams({ inStock: e.target.checked ? "1" : null })}
                className="h-4 w-4 rounded border-gray-300 accent-[#6D0F2D]"
              />
              Solo disponibles
            </label>

            {/* ORDENAMIENTO */}
            <div>
              <label className="mb-2 block text-sm font-medium">Ordenar por</label>

              <select
                value={sort}
                onChange={(e) => updateParams({ sort: e.target.value || null })}
                className="w-full rounded-xl border p-3"
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

        {/* PRODUCTOS */}
        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : failed ? (
            <div className="rounded-2xl border p-10 text-center text-gray-500">
              No se pudieron cargar los productos. Intenta de nuevo más tarde.
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border p-10 text-center text-gray-500">
              No se encontraron productos con estos filtros.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-5">
                  <button
                    disabled={page === 1}
                    onClick={() => handlePageChange(page - 1)}
                    className="rounded-xl border px-4 py-2 disabled:opacity-50"
                  >
                    Anterior
                  </button>

                  <span className="text-sm text-gray-600">
                    Página {page} de {totalPages}
                  </span>

                  <button
                    disabled={page === totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    className="rounded-xl border px-4 py-2 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
