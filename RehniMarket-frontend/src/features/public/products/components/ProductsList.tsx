import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Filter, ImageOff } from "lucide-react";

import { getDailyProducts } from "@/features/public/home/api/homeService";
import ProductCardSkeleton from "@/features/public/home/components/ProductCardSkeleton";
import { getCatalogs } from "../api/productsService";
import { formatPrice } from "@/shared/utils/formatPrice";

import type { PublicProductCard } from "@/features/public/home/types/response";
import type { PublicCatalog } from "../types/response";

// TODO(backend): no existe todavía un endpoint público de listado de
// productos con paginación/búsqueda/filtro por catálogo
// (GET /public/products?search=&catalog_id=&page=...). Mientras no exista,
// este listado reutiliza GET /public/products/daily (límite máximo 24, ver
// app/routers/publicRouters.py) como la única fuente pública de "varios
// productos" disponible, y filtra/ordena en el cliente sobre ese resultado.
// Cuando se agregue ese endpoint, reemplazar DAILY_PRODUCTS_LIMIT +
// getDailyProducts por el nuevo service con paginación real.
const PRODUCTS_LIST_LIMIT = 24;

export default function ProductsList() {
  const [searchParams] = useSearchParams();

  const search = searchParams.get("search")?.toLowerCase() ?? "";

  const [products, setProducts] = useState<PublicProductCard[]>([]);
  const [catalogs, setCatalogs] = useState<PublicCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setFailed(false);

        const [productsResponse, catalogsResponse] = await Promise.all([
          getDailyProducts(PRODUCTS_LIST_LIMIT),
          getCatalogs(),
        ]);

        if (!cancelled) {
          setProducts(productsResponse);
          setCatalogs(catalogsResponse);
        }
      } catch (error) {
        console.error("Error cargando productos:", error);

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

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) =>
      product.name.toLowerCase().includes(search),
    );

    // TODO(backend): PublicProductCardResponse no incluye catalog_id /
    // catalog_name (ver app/schemas/SchemaPublic.py), así que este listado
    // no puede filtrar por categoría en el cliente todavía. El selector de
    // abajo ya usa catálogos reales (getCatalogs), pero la selección no
    // filtra hasta que el backend exponga la categoría en la tarjeta de
    // producto (selectedCategory queda declarado y controla el <select>,
    // a la espera de ese campo).

    if (sortBy === "priceAsc") {
      result = [...result].sort(
        (a, b) => Number(a.final_price) - Number(b.final_price),
      );
    }

    if (sortBy === "priceDesc") {
      result = [...result].sort(
        (a, b) => Number(b.final_price) - Number(a.final_price),
      );
    }

    return result;
  }, [products, search, sortBy]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {search ? `Resultados para "${search}"` : "Productos"}
        </h1>

        <p className="mt-2 text-gray-500">
          {loading ? "Cargando productos..." : `${filteredProducts.length} productos encontrados`}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* FILTROS */}
        <aside className="h-fit rounded-2xl border bg-white p-5">
          <div className="mb-5 flex items-center gap-2">
            <Filter size={18} />
            <h2 className="font-semibold">Filtros</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Categoría
              </label>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl border p-3"
              >
                <option value="">Todas</option>
                {catalogs.map((catalog) => (
                  <option key={catalog.id} value={catalog.id}>
                    {catalog.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Ordenar por
              </label>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-xl border p-3"
              >
                <option value="">Relevancia</option>
                <option value="priceAsc">Menor precio</option>
                <option value="priceDesc">Mayor precio</option>
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
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border p-10 text-center">
              No se encontraron productos.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-56 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-56 w-full items-center justify-center bg-gray-100 text-gray-300">
                      <ImageOff size={32} />
                    </div>
                  )}

                  <div className="p-4">
                    <span className="text-xs text-gray-500">
                      {product.company_name}
                    </span>

                    <h3 className="mt-1 font-semibold">
                      {product.name}
                    </h3>

                    <p className="mt-2 text-xl font-bold text-[#6D0F2D]">
                      {formatPrice(
                        product.discount_enabled ? product.final_price : product.price,
                      )}
                    </p>

                    <div className="mt-4 rounded-xl bg-[#6D0F2D] py-3 text-center text-white">
                      Ver producto
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
