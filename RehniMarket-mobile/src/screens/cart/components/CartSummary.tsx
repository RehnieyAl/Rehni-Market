import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { formatPrice } from "@/utils/formatPrice";
import { colors, fontSize, fontWeight, radii, shadows, spacing } from "@/theme";

interface Props {
  subtotal: string;
  tax: string;
  total: string;
  itemCount: number;
  onCheckout?: () => void;
  checkoutDisabled?: boolean;
}

export function CartSummary({
  subtotal,
  tax,
  total,
  itemCount,
  onCheckout,
  checkoutDisabled = false,
}: Props) {
  const hasTax = Number(tax) > 0;

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Resumen</Text>

      <View style={styles.rows}>
        <View style={styles.row}>
          <Text style={styles.label}>
            Subtotal ({itemCount} {itemCount === 1 ? "producto" : "productos"})
          </Text>
          <Text style={styles.value}>{formatPrice(subtotal)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>IVA</Text>
          <Text style={styles.value}>{hasTax ? formatPrice(tax) : "No aplica"}</Text>
        </View>

        <View style={[styles.row, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>
      </View>

      {onCheckout && (
        <Button
          label="Ir a pagar"
          onPress={onCheckout}
          disabled={checkoutDisabled}
          style={styles.checkoutButton}
        />
      )}

      <Text style={styles.note}>El total definitivo se confirma en el checkout.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  heading: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  rows: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  label: {
    flexShrink: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  value: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  totalLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  checkoutButton: {
    marginTop: spacing.xs,
  },
  note: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: "center",
  },
});
