import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { getPublicProducts } from "@/api/productsService";
import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState } from "@/components/EmptyState";
import { useProductList } from "@/hooks/useProductList";
import { colors, fontSize, radii, spacing } from "@/theme";
import type { PublicProductsPaginated } from "@/types/product";

const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

export function SearchScreen() {
  const router = useRouter();

  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setQuery(input.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input]);

  const active = query.length >= MIN_QUERY_LENGTH;

  const fetchPage = useCallback(
    (page: number): Promise<PublicProductsPaginated> => {
      if (!active) {
        return Promise.resolve({ page: 1, limit: 24, total: 0, total_pages: 0, products: [] });
      }
      return getPublicProducts({ search: query, page, limit: 24, sort: "relevance" });
    },
    [query, active],
  );

  const list = useProductList(fetchPage);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.field}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Buscar productos..."
            placeholderTextColor={colors.textMuted}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
            style={styles.input}
          />
          {input.length > 0 && (
            <Pressable onPress={() => setInput("")} hitSlop={8} accessibilityLabel="Limpiar">
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {active ? (
        <ProductGrid
          products={list.products}
          loading={list.loading}
          failed={list.failed}
          onRetry={list.retry}
          emptyMessage={`Sin resultados para "${query}".`}
          emptyIcon="search-outline"
          onEndReached={list.loadMore}
          loadingMore={list.loadingMore}
          columnOptions={{ min: 2, max: 6, target: 180 }}
        />
      ) : (
        <EmptyState icon="search-outline" message="Escribe al menos 2 caracteres para buscar." />
      )}
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
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  field: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 44,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    padding: 0,
  },
});
