import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getDailyProducts } from "@/api/homeService";
import { ProductCard } from "./ProductCard";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { colors, fontSize, fontWeight, spacing } from "@/theme";
import type { PublicProductCard } from "@/types/product";

const DAILY_PRODUCTS_LIMIT = 8;

// Espejo funcional de RehniMarket-frontend/src/features/public/home/
// components/DailyProducts.tsx (mismo endpoint GET /public/products/
// daily). Grid de 2 columnas SIN scroll propio (View con flexWrap, no
// FlatList) - es el mismo layout base que usa la web en mobile
// (grid-cols-2, sm:grid-cols-4 recién a partir de tablet) y evita el
// anidado ScrollView+FlatList vertical que pide evitar esta fase (ver
// Fase Home > SCROLL). Es un conjunto acotado (8 productos), no una lista
// paginada - no necesita virtualización.
export function ProductSection() {
  const [products, setProducts] = useState<PublicProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setFailed(false);

      const response = await getDailyProducts(DAILY_PRODUCTS_LIMIT);
      setProducts(response);
    } catch (error) {
      console.error("Error cargando productos destacados:", error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Productos destacados</Text>

        {!loading && !failed && products.length > 0 && (
          <Link href="/(user)/products" style={styles.linkContent}>
            <View style={styles.linkContent}>
              <Text style={styles.linkText}>Ver todos</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </View>
          </Link>
        )}
      </View>

      {failed ? (
        <ErrorState message="No se pudieron cargar los productos." onRetry={load} />
      ) : loading ? (
        <View style={styles.grid}>
          {Array.from({ length: DAILY_PRODUCTS_LIMIT }).map((_, index) => (
            <View key={index} style={styles.cell}>
              <Skeleton height={200} radius="md" />
            </View>
          ))}
        </View>
      ) : products.length === 0 ? (
        <EmptyState icon="cube-outline" message="No hay productos disponibles todavía." />
      ) : (
        <View style={styles.grid}>
          {products.map((product) => (
            <View key={product.id} style={styles.cell}>
              <ProductCard product={product} />
            </View>
          ))}
        </View>
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  cell: {
    width: "47%",
  },
});
