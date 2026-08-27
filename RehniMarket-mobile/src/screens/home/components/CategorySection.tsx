import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getCatalogs } from "@/api/catalogService";
import { CategoryCard } from "./CategoryCard";
import { Skeleton } from "@/components/Skeleton";
import { ErrorState } from "@/components/ErrorState";
import { colors, fontSize, fontWeight, spacing } from "@/theme";
import type { PublicCatalog } from "@/types/catalog";

// Espejo funcional de RehniMarket-frontend/src/features/public/home/
// components/CategoriesSection.tsx (mismo endpoint GET /public/catalogs).
// Diseño horizontal/scroll en vez del grid de la web - así lo pide
// explícitamente references/ux-user.png para esta sección ("Explorar
// categorías" es una fila que se desliza, no un grid que envuelve).
export function CategorySection() {
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

  // Sin categorías activas: se omite la sección entera (mismo criterio
  // que la web).
  if (!loading && !failed && categories.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Explorar categorías</Text>

        <Link href="/(user)/(tabs)/categories" style={styles.link}>
          <View style={styles.linkContent}>
            <Text style={styles.linkText}>Ver todas</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </View>
        </Link>
      </View>

      {failed ? (
        <ErrorState message="No se pudieron cargar las categorías." onRetry={load} />
      ) : loading ? (
        <View style={styles.skeletonRow}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} width={56} height={56} radius="md" />
          ))}
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CategoryCard category={item} />}
          horizontal
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  link: {},
  linkContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  linkText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  skeletonRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
});
