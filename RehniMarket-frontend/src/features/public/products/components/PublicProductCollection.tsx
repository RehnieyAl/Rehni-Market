import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ProductGrid from "./ProductGrid";

import type { PublicProductsPaginated } from "../types/response";

const PAGE_SIZE = 12;

interface PublicProductCollectionProps {
  // Fuente de los productos: /offers, /new, etc. Cada apartado pasa la suya.
  fetchPage: (page: number, limit: number) => Promise<PublicProductsPaginated>;
  emptyMessage: string;
}

// Colección pública paginada de productos, parametrizada por su fuente de datos.
// La página vive en la URL (?page=N) para que sea compartible y sobreviva al back.
// La lógica de qué productos traer NO vive aquí: llega como `fetchPage`.
export default function PublicProductCollection({
  fetchPage,
  emptyMessage,
}: PublicProductCollectionProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const [products, setProducts] = useState<PublicProductsPaginated["products"]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const handlePageChange = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);

    if (nextPage > 1) {
      next.set("page", String(nextPage));
    } else {
      next.delete("page");
    }

    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setFailed(false);

        const response = await fetchPage(page, PAGE_SIZE);

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
  }, [fetchPage, page]);

  return (
    <ProductGrid
      products={products}
      loading={loading}
      failed={failed}
      total={total}
      page={page}
      totalPages={totalPages}
      pageSize={PAGE_SIZE}
      onPageChange={handlePageChange}
      emptyMessage={emptyMessage}
    />
  );
}
