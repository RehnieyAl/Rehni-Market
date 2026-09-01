import type { ReactElement } from "react";
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ProductCard } from "@/screens/home/components/ProductCard";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { useResponsive } from "@/hooks/useResponsive";
import { colors, spacing } from "@/theme";
import type { PublicProductCard } from "@/types/product";

interface ColumnOptions {
  min?: number;
  max?: number;
  target?: number;
}

interface Props {
  products: PublicProductCard[];
  loading?: boolean;
  failed?: boolean;
  onRetry?: () => void;
  emptyMessage?: string;
  emptyIcon?: keyof typeof Ionicons.glyphMap;
  header?: ReactElement | null;
  onEndReached?: () => void;
  loadingMore?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  columnOptions?: ColumnOptions;
  skeletonCount?: number;
  paddingHorizontal?: number;
  paddingBottom?: number;
  style?: StyleProp<ViewStyle>;
}

export function ProductGrid({
  products,
  loading = false,
  failed = false,
  onRetry,
  emptyMessage = "No hay productos para mostrar.",
  emptyIcon = "cube-outline",
  header = null,
  onEndReached,
  loadingMore = false,
  refreshing,
  onRefresh,
  columnOptions,
  skeletonCount = 6,
  paddingHorizontal,
  paddingBottom = spacing.xxl,
  style,
}: Props) {
  const responsive = useResponsive();
  const { width, contentMaxWidth, gutter } = responsive;
  const numColumns = responsive.columns(columnOptions);

  const outer = paddingHorizontal ?? spacing.lg;
  const frameWidth = Math.min(width, contentMaxWidth);
  const itemWidth = (frameWidth - outer * 2 - gutter * (numColumns - 1)) / numColumns;

  const frameStyle: StyleProp<ViewStyle> = [
    styles.frame,
    { maxWidth: contentMaxWidth },
    style,
  ];

  const showState = !loading && (failed || products.length === 0);

  if (loading || showState) {
    return (
      <View style={frameStyle}>
        <ScrollView
          contentContainerStyle={[styles.stateContent, { paddingHorizontal: outer, paddingBottom }]}
          showsVerticalScrollIndicator={false}
        >
          {header}

          {loading ? (
            <View style={[styles.grid, { columnGap: gutter, rowGap: gutter }]}>
              {Array.from({ length: skeletonCount }).map((_, index) => (
                <View key={index} style={{ width: itemWidth }}>
                  <Skeleton height={itemWidth * 1.4} radius="md" />
                </View>
              ))}
            </View>
          ) : failed ? (
            <ErrorState message="No se pudieron cargar los productos." onRetry={onRetry ?? (() => {})} />
          ) : (
            <EmptyState icon={emptyIcon} message={emptyMessage} />
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={frameStyle}>
      <FlatList
        key={numColumns}
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        renderItem={({ item }) => (
          <View style={{ width: itemWidth }}>
            <ProductCard product={item} />
          </View>
        )}
        ListHeaderComponent={header}
        columnWrapperStyle={numColumns > 1 ? { gap: gutter } : undefined}
        contentContainerStyle={{
          gap: gutter,
          paddingHorizontal: outer,
          paddingBottom,
        }}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={styles.footer} color={colors.primary} />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
  },
  stateContent: {
    flexGrow: 1,
    gap: spacing.lg,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  footer: {
    paddingVertical: spacing.lg,
  },
});
