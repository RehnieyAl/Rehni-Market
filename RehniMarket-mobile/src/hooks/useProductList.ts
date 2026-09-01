import { useCallback, useEffect, useRef, useState } from "react";

import type { PublicProductCard, PublicProductsPaginated } from "@/types/product";

type FetchPage = (page: number) => Promise<PublicProductsPaginated>;

interface ProductListState {
  products: PublicProductCard[];
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  failed: boolean;
  total: number;
  loadMore: () => void;
  refresh: () => void;
  retry: () => void;
}

export function useProductList(fetchPage: FetchPage): ProductListState {
  const [products, setProducts] = useState<PublicProductCard[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const requestId = useRef(0);

  const loadFirst = useCallback(
    async (mode: "initial" | "refresh") => {
      const currentRequest = ++requestId.current;

      if (mode === "initial") setLoading(true);
      else setRefreshing(true);
      setFailed(false);

      try {
        const response = await fetchPage(1);
        if (currentRequest !== requestId.current) return;

        setProducts(response.products);
        setPage(response.page);
        setTotalPages(response.total_pages);
        setTotal(response.total);
      } catch (error) {
        if (currentRequest !== requestId.current) return;
        console.error("Error cargando productos:", error);
        setFailed(true);
      } finally {
        if (currentRequest === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [fetchPage],
  );

  useEffect(() => {
    loadFirst("initial");
  }, [loadFirst]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || refreshing || failed) return;
    if (page >= totalPages) return;

    const currentRequest = requestId.current;
    setLoadingMore(true);

    try {
      const response = await fetchPage(page + 1);
      if (currentRequest !== requestId.current) return;

      setProducts((prev) => [...prev, ...response.products]);
      setPage(response.page);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      console.error("Error cargando más productos:", error);
    } finally {
      if (currentRequest === requestId.current) setLoadingMore(false);
    }
  }, [fetchPage, page, totalPages, loading, loadingMore, refreshing, failed]);

  return {
    products,
    loading,
    loadingMore,
    refreshing,
    failed,
    total,
    loadMore,
    refresh: () => loadFirst("refresh"),
    retry: () => loadFirst("initial"),
  };
}
