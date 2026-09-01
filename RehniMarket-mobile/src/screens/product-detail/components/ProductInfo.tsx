import { StyleSheet, Text, View } from "react-native";

import { PriceBlock } from "@/components/product/PriceBlock";
import { Rating } from "@/components/ui/Rating";
import { colors, fontSize, fontWeight, spacing } from "@/theme";

interface Props {
  catalogName: string;
  name: string;
  price: string;
  discountEnabled: boolean;
  discountPercentage: number | null;
  finalPrice: string;
  averageRating: number | null;
  reviewCount: number;
}

export function ProductInfo({
  catalogName,
  name,
  price,
  discountEnabled,
  discountPercentage,
  finalPrice,
  averageRating,
  reviewCount,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>{catalogName}</Text>
      <Text style={styles.name}>{name}</Text>

      <Rating value={averageRating} count={reviewCount} size="md" />

      <View style={styles.price}>
        <PriceBlock
          price={price}
          finalPrice={finalPrice}
          discountEnabled={discountEnabled}
          discountPercentage={discountPercentage}
          size="xl"
          tone="brand"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  price: {
    marginTop: spacing.xs,
  },
});
