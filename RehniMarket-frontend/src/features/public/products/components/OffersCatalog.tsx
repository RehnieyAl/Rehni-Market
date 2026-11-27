/** Página Ofertas: productos con descuento vigente, con búsqueda, filtro por categoría, orden y paginación.
 * Usa /public/products con discount + in_stock, el mismo criterio de oferta que /public/products/offers. */
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";

import ProductGrid from "./ProductGrid";
import { Input, Select } from "@/shared/components/ui";
import { getCatalogs, getPublicProducts } from "../api/productsService";

import type { PublicCatalog, PublicProductsFilters, PublicProductsPaginated } from "../types/response";

type OfferSort = "discount" | "recent" | "price_asc" | "price_desc";

const PAGE_SIZES = [8, 12, 24] as const;
const DEFAULT_PAGE_SIZE = 12;
const DEFAULT_SORT: OfferSort = "discount";
const SEARCH_DELAY_MS = 400;

const SORT_LABELS: Record<OfferSort, string> = {
  discount: "Mayor descuento",
  recent: "Más recientes",
  price_asc: "Menor precio",
  price_desc: "Mayor precio",
};

function parseSort(value: string | null): OfferSort {
  return value && value in SORT_LABELS ? (value as OfferSort) : DEFAULT_SORT;
}

function parsePageSize(value: string | null): number {
  const size = Number(value);
  return (PAGE_SIZES as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE;
}

export default function OffersCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const catalogId = searchParams.get("catalog") ?? "";
  const sort = parseSort(searchParams.get("sort"));
  const pageSize = parsePageSize(searchParams.get("limit"));
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const [searchInput, setSearchInput] = useState(search);
  const [syncedSearch, setSyncedSearch] = useState(search);
  const [catalogs, setCatalogs] = useState<PublicCatalog[]>([]);
  const [result, setResult] = useState<PublicProductsPaginated | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Atrás/adelante o un enlace cambian ?q=: el campo se alinea con la URL sin un efecto extra.
  if (search !== syncedSearch) {
    setSyncedSearch(search);
    setSearchInput(search);
  }

  const updateParams = useCallback(
    (changes: Record<string, string | null>, resetPage = true) => {
      const next = new URLSearchParams(searchParams);

      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }

      if (resetPage) next.delete("page");

      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    getCatalogs()
      .then(setCatalogs)
      .catch((error) => console.error("Error cargando categorías:", error));
  }, []);

  useEffect(() => {
    if (searchInput.trim() === search) return;

    const timeout = setTimeout(
      () => updateParams({ q: searchInput.trim() || null }),
      SEARCH_DELAY_MS,
    );

    return () => clearTimeout(timeout);
  }, [searchInput, search, updateParams]);

  useEffect(() => {
    let cancelled = false;

    const filters: PublicProductsFilters = {
      discount: true,
      inStock: true,
      search: search || undefined,
      catalogId: catalogId || undefined,
      sort: sort === "recent" ? undefined : sort,
      page,
      limit: pageSize,
    };

    const load = async () => {
      try {
        setLoading(true);
        setFailed(false);
        const response = await getPublicProducts(filters);
        if (!cancelled) setResult(response);
      } catch (error) {
        console.error("Error cargando ofertas:", error);
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [search, catalogId, sort, page, pageSize, reloadKey]);

  const handlePageChange = (nextPage: number) => {
    updateParams({ page: nextPage > 1 ? String(nextPage) : null }, false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filtering = Boolean(search || catalogId);

  return (
    <section className="mx-auto w-full max-w-[clamp(1280px,90vw,1600px)] px-3 py-6 sm:px-4 sm:py-8 lg:px-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Ofertas</h1>
        <p className="mt-1 text-sm text-ink-muted sm:text-base">
          Productos con descuento vigente en alguna de sus variantes disponibles.
        </p>
      </header>

      <div role="search" className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          className="min-w-0 flex-1"
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Buscar en ofertas…"
          aria-label="Buscar en ofertas"
          leadingIcon={<Search size={16} />}
        />

        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:flex">
          <Select
            className="md:w-56"
            aria-label="Filtrar ofertas por categoría"
            value={catalogId}
            onChange={(event) => updateParams({ catalog: event.target.value || null })}
          >
            <option value="">Todas las categorías</option>
            {catalogs.map((catalog) => (
              <option key={catalog.id} value={catalog.id}>
                {catalog.name}
              </option>
            ))}
          </Select>

          <Select
            className="md:w-48"
            aria-label="Ordenar ofertas"
            value={sort}
            onChange={(event) =>
              updateParams({ sort: event.target.value === DEFAULT_SORT ? null : event.target.value })
            }
          >
            {(Object.keys(SORT_LABELS) as OfferSort[]).map((value) => (
              <option key={value} value={value}>
                {search && value === "recent" ? "Más relevantes" : SORT_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-6 sm:mt-8">
        <ProductGrid
          products={result?.products ?? []}
          loading={loading}
          failed={failed}
          total={result?.total ?? 0}
          page={page}
          totalPages={result?.total_pages || 1}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onRetry={() => setReloadKey((key) => key + 1)}
          emptyMessage={
            filtering ? "No hay ofertas que coincidan con tu búsqueda." : "No hay ofertas disponibles en este momento."
          }
          emptyDescription={filtering ? "Prueba con otra palabra o con todas las categorías." : undefined}
          itemLabel="ofertas"
          footerAside={
            <Select
              aria-label="Ofertas por página"
              value={String(pageSize)}
              onChange={(event) =>
                updateParams({
                  limit: Number(event.target.value) === DEFAULT_PAGE_SIZE ? null : event.target.value,
                })
              }
              selectClassName="h-10"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} por página
                </option>
              ))}
            </Select>
          }
        />
      </div>
    </section>
  );
}
