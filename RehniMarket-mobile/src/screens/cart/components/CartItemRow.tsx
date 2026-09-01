import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { PriceBlock } from "@/components/product/PriceBlock";
import { QuantityStepper } from "@/components/product/QuantityStepper";
import { formatPrice } from "@/utils/formatPrice";
import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";
import type { CartItem } from "@/types/cart";

interface Props {
  item: CartItem;
  busy: boolean;
  onChangeQuantity: (quantity: number) => void;
  onRemove: () => void;
}

function variantLabel(item: CartItem): string | null {
  if (item.options.length > 0) {
    return item.options.map((option) => `${option.attribute}: ${option.value}`).join(" · ");
  }
  return item.color?.name ?? item.variantName;
}

export function CartItemRow({ item, busy, onChangeQuantity, onRemove }: Props) {
  const label = variantLabel(item);
  const outOfStock = item.availableStock <= 0;
  const hasDiscount = item.discountPercentage != null && item.discountPercentage > 0;

  return (
    <View style={styles.row}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.image} contentFit="contain" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="image-outline" size={22} color={colors.textMuted} />
        </View>
      )}

      <View style={styles.info}>
        <View style={styles.topRow}>
          <View style={styles.titles}>
            <Text style={styles.company} numberOfLines={1}>
              {item.companyName}
            </Text>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
          </View>

          <Pressable
            onPress={onRemove}
            disabled={busy}
            hitSlop={8}
            style={styles.removeButton}
            accessibilityLabel={`Eliminar ${item.name}`}
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        {label && (
          <Text style={styles.variant} numberOfLines={1}>
            {label}
          </Text>
        )}

        <PriceBlock
          price={item.basePrice}
          finalPrice={item.unitPrice}
          discountEnabled={hasDiscount}
          discountPercentage={item.discountPercentage}
          size="sm"
        />

        {outOfStock && (
          <Text style={styles.outOfStock}>Este producto ya no tiene stock disponible.</Text>
        )}

        <View style={styles.controls}>
          <QuantityStepper
            value={item.quantity}
            max={item.availableStock}
            onChange={onChangeQuantity}
            disabled={busy}
          />

          <Text style={styles.subtotal}>{formatPrice(item.subtotal)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  image: {
    width: 76,
    height: 76,
    borderRadius: radii.md,
    backgroundColor: colors.background,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  titles: {
    flex: 1,
  },
  company: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  removeButton: {
    padding: 2,
  },
  variant: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  outOfStock: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.danger,
  },
  controls: {
    marginTop: spacing.xs,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  subtotal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
});
