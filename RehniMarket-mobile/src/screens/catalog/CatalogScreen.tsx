import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { getCatalogs } from "@/api/catalogService";
import { getPublicProducts } from "@/api/productsService";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SortChips } from "./components/SortChips";
import { FiltersSheet, EMPTY_CATALOG_FILTERS } from "./components/FiltersSheet";
import type { CatalogFilters } from "./components/FiltersSheet";
import { useProductList } from "@/hooks/useProductList";
import { colors, fontSize, fontWeight, spacing } from "@/theme";
import type { PublicCatalog } from "@/types/catalog";
import type { PublicProductsPaginated, PublicProductsSort } from "@/types/product";

interface Props {
  initialCatalogId?: string;
  initialCatalogName?: string;
}

const PAGE_SIZE = 24;

export function CatalogScreen({ initialCatalogId, initialCatalogName }: Props) {
  const [catalogs, setCatalogs] = useState<PublicCatalog[]>([]);
  const [sort, setSort] = useState<PublicProductsSort>("relevance");
  const [filters, setFilters] = useState<CatalogFilters>({
    ...EMPTY_CATALOG_FILTERS,
    catalogId: initialCatalogId ?? null,
  });
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    getCatalogs()
      .then(setCatalogs)
      .catch((error) => console.error("Error cargando categorías:", error));
  }, []);

  const fetchPage = useCallback(
    (page: number): Promise<PublicProductsPaginated> =>
      getPublicProducts({
        page,
        limit: PAGE_SIZE,
        sort,
        catalogId: filters.catalogId ?? undefined,
        minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        discount: filters.discountOnly || undefined,
        inStock: filters.inStockOnly || undefined,
      }),
    [sort, filters],
  );

  const list = useProductList(fetchPage);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.catalogId) count += 1;
    if (filters.minPrice || filters.maxPrice) count += 1;
    if (filters.discountOnly) count += 1;
    if (filters.inStockOnly) count += 1;
    return count;
  }, [filters]);

  const selectedCatalogName =
    catalogs.find((catalog) => catalog.id === filters.catalogId)?.name ?? initialCatalogName;

  const title = selectedCatalogName ?? "Productos";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScreenHeader
        title={title}
        right={
          <Pressable
            onPress={() => setSheetOpen(true)}
            hitSlop={8}
            style={styles.filterButton}
            accessibilityLabel="Filtros"
          >
            <Ionicons name="options-outline" size={22} color={colors.textPrimary} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        }
      />

      <View style={styles.sortWrapper}>
        <SortChips value={sort} onChange={setSort} />
      </View>

      {!list.loading && !list.failed && (
        <Text style={styles.count}>
          {list.total} {list.total === 1 ? "producto" : "productos"}
        </Text>
      )}

      <ProductGrid
        products={list.products}
        loading={list.loading}
        failed={list.failed}
        onRetry={list.retry}
        emptyMessage="No hay productos que coincidan con tu búsqueda."
        emptyIcon="pricetags-outline"
        onEndReached={list.loadMore}
        loadingMore={list.loadingMore}
        refreshing={list.refreshing}
        onRefresh={list.refresh}
        columnOptions={{ min: 2, max: 6, target: 180 }}
      />

      <FiltersSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        catalogs={catalogs}
        value={filters}
        onApply={(next) => {
          setFilters(next);
          setSheetOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterButton: {
    padding: 2,
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
  },
  sortWrapper: {
    paddingHorizontal: spacing.lg,
  },
  count: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
