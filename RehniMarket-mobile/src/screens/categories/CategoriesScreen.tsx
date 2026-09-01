import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { getCatalogs } from "@/api/catalogService";
import { CategoryTile } from "./components/CategoryTile";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { useResponsive } from "@/hooks/useResponsive";
import { colors, fontSize, fontWeight, spacing } from "@/theme";
import type { PublicCatalog } from "@/types/catalog";

export function CategoriesScreen() {
  const { columns, gutter, width, contentMaxWidth } = useResponsive();

  const [categories, setCategories] = useState<PublicCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setFailed(false);
      setCategories(await getCatalogs());
    } catch (error) {
      console.error("Error cargando categorías:", error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const numColumns = columns({ min: 2, max: 5, target: 200 });
  const frameWidth = Math.min(width, contentMaxWidth);
  const itemWidth =
    (frameWidth - spacing.lg * 2 - gutter * (numColumns - 1)) / numColumns;

  return (
    <ScreenContainer padded={false}>
      <Text style={styles.title}>Categorías</Text>

      {failed ? (
        <View style={styles.padded}>
          <ErrorState message="No se pudieron cargar las categorías." onRetry={load} />
        </View>
      ) : loading ? (
        <View style={[styles.padded, styles.skeletonGrid]}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} width={150} height={150} radius="lg" />
          ))}
        </View>
      ) : categories.length === 0 ? (
        <View style={styles.padded}>
          <EmptyState icon="grid-outline" message="Todavía no hay categorías." />
        </View>
      ) : (
        <FlatList
          key={numColumns}
          data={categories}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          renderItem={({ item }) => (
            <View style={{ width: itemWidth }}>
              <CategoryTile category={item} />
            </View>
          )}
          columnWrapperStyle={numColumns > 1 ? { gap: gutter } : undefined}
          contentContainerStyle={[styles.listContent, { gap: gutter }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  padded: {
    padding: spacing.lg,
  },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
  },
  listContent: {
    padding: spacing.lg,
  },
});
