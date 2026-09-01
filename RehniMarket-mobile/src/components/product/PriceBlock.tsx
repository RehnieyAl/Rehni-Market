import { StyleSheet, Text, View } from "react-native";

import { formatPrice } from "@/utils/formatPrice";
import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";

interface Props {
  price: string;
  finalPrice: string;
  discountEnabled: boolean;
  discountPercentage: number | null;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "brand" | "default";
  showBadge?: boolean;
}

const PRICE_SIZE: Record<NonNullable<Props["size"]>, number> = {
  sm: fontSize.base,
  md: fontSize.lg,
  lg: fontSize.xxl,
  xl: fontSize.xxxl,
};

export function PriceBlock({
  price,
  finalPrice,
  discountEnabled,
  discountPercentage,
  size = "sm",
  tone = "brand",
  showBadge = true,
}: Props) {
  const priceStyle = [
    styles.price,
    { fontSize: PRICE_SIZE[size], color: tone === "brand" ? colors.primary : colors.textPrimary },
  ];

  if (!discountEnabled) {
    return <Text style={priceStyle}>{formatPrice(price)}</Text>;
  }

  return (
    <View style={styles.row}>
      <Text style={priceStyle}>{formatPrice(finalPrice)}</Text>
      <Text style={styles.original}>{formatPrice(price)}</Text>

      {showBadge && discountPercentage !== null && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>-{discountPercentage}%</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },
  price: {
    fontWeight: fontWeight.bold,
  },
  original: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  badge: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});
