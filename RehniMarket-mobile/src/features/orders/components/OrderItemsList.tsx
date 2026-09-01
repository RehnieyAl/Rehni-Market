import { StyleSheet, Text, View } from "react-native";

import { formatPrice } from "@/utils/formatPrice";
import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";
import type { OrderItem } from "@/types/order";

interface Props {
  items: OrderItem[];
}

function comboLabel(item: OrderItem): string | null {
  if (item.attributes && Object.keys(item.attributes).length > 0) {
    return Object.entries(item.attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" · ");
  }
  return item.variantName;
}

export function OrderItemsList({ items }: Props) {
  return (
    <View style={styles.container}>
      {items.map((item, index) => {
        const combo = comboLabel(item);

        return (
          <View key={item.id} style={[styles.row, index > 0 && styles.rowDivider]}>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={2}>
                {item.productName}
              </Text>
              {combo && <Text style={styles.combo}>{combo}</Text>}
              <Text style={styles.units}>
                {item.quantity} ×{" "}
                {item.originalUnitPrice && (
                  <Text style={styles.original}>{formatPrice(item.originalUnitPrice)} </Text>
                )}
                {formatPrice(item.unitPrice)}
              </Text>
            </View>

            <Text style={styles.subtotal}>{formatPrice(item.subtotal)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    padding: spacing.md,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  combo: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  units: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  original: {
    textDecorationLine: "line-through",
  },
  subtotal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
});
