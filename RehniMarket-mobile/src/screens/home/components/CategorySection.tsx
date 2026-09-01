import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { getCatalogs } from "@/api/catalogService";
import { CategoryCard, CATEGORY_CARD_GAP } from "./CategoryCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/Skeleton";
import { ErrorState } from "@/components/ErrorState";
import { useResponsive } from "@/hooks/useResponsive";
import { spacing } from "@/theme";
import type { PublicCatalog } from "@/types/catalog";

export function CategorySection() {
  const router = useRouter();
  const { isTablet, columns } = useResponsive();

  const [categories, setCategories] = useState<PublicCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setFailed(false);

      const response = await getCatalogs();
      setCategories(response);
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

  if (!loading && !failed && categories.length === 0) {
    return null;
  }

  const gridColumns = columns({ min: 4, max: 8, target: 96 });

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Explorar categorías"
        actionLabel="Ver todas"
        onPressAction={() => router.push("/(user)/(tabs)/categories")}
      />

      {failed ? (
        <ErrorState message="No se pudieron cargar las categorías." onRetry={load} />
      ) : loading ? (
        <View style={styles.skeletonRow}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} width={56} height={56} radius="md" />
          ))}
        </View>
      ) : isTablet ? (
        <View style={styles.grid}>
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              style={{ width: `${100 / gridColumns}%`, paddingHorizontal: CATEGORY_CARD_GAP / 2 }}
            />
          ))}
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CategoryCard category={item} style={styles.horizontalCard} />}
          horizontal
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ width: CATEGORY_CARD_GAP }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  skeletonRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: spacing.lg,
  },
  horizontalCard: {
    width: 84,
  },
});
