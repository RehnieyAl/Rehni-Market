import { StyleSheet, View } from "react-native";

import { ProductCard } from "@/screens/home/components/ProductCard";
import { Skeleton } from "@/components/Skeleton";
import { useResponsive } from "@/hooks/useResponsive";
import { spacing } from "@/theme";
import type { PublicProductCard } from "@/types/product";

interface Props {
  products: PublicProductCard[];
  loading?: boolean;
  skeletonCount?: number;
  outerPadding?: number;
}

export function ProductPreviewGrid({
  products,
  loading = false,
  skeletonCount = 4,
  outerPadding = spacing.lg,
}: Props) {
  const { width, contentMaxWidth, gutter, columns } = useResponsive();

  const numColumns = columns({ min: 2, max: 6, target: 180 });
  const frameWidth = Math.min(width, contentMaxWidth);
  const itemWidth = (frameWidth - outerPadding * 2 - gutter * (numColumns - 1)) / numColumns;

  const items = loading ? Array.from({ length: skeletonCount }) : products;

  return (
    <View style={[styles.grid, { columnGap: gutter, rowGap: gutter }]}>
      {items.map((item, index) => (
        <View key={loading ? index : (item as PublicProductCard).id} style={{ width: itemWidth }}>
          {loading ? (
            <Skeleton height={itemWidth * 1.4} radius="md" />
          ) : (
            <ProductCard product={item as PublicProductCard} />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
