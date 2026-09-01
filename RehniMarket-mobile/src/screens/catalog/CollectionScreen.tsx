import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { getPublicNewProducts, getPublicOffers } from "@/api/productsService";
import { ProductGrid } from "@/components/product/ProductGrid";
import { useProductList } from "@/hooks/useProductList";
import { colors, fontSize, fontWeight, spacing } from "@/theme";

interface Props {
  variant: "offers" | "new";
}

const CONFIG = {
  offers: {
    title: "Ofertas especiales",
    subtitle: "Productos con descuento vigente.",
    emptyMessage: "No hay ofertas disponibles en este momento.",
    fetch: getPublicOffers,
  },
  new: {
    title: "Novedades",
    subtitle: "Lo último publicado en RehniMarket.",
    emptyMessage: "No hay novedades disponibles en este momento.",
    fetch: getPublicNewProducts,
  },
} as const;

export function CollectionScreen({ variant }: Props) {
  const router = useRouter();
  const config = CONFIG[variant];

  const fetchPage = useCallback((page: number) => config.fetch(page, 24), [config]);
  const list = useProductList(fetchPage);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.titleGroup}>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.subtitle}>{config.subtitle}</Text>
        </View>
      </View>

      <ProductGrid
        products={list.products}
        loading={list.loading}
        failed={list.failed}
        onRetry={list.retry}
        emptyMessage={config.emptyMessage}
        emptyIcon={variant === "offers" ? "pricetag-outline" : "sparkles-outline"}
        onEndReached={list.loadMore}
        loadingMore={list.loadingMore}
        refreshing={list.refreshing}
        onRefresh={list.refresh}
        columnOptions={{ min: 2, max: 6, target: 180 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  titleGroup: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
