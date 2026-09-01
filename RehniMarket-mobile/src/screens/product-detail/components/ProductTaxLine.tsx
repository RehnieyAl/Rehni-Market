import { StyleSheet, Text, View } from "react-native";

import { formatPrice } from "@/utils/formatPrice";
import { colors, fontSize, fontWeight } from "@/theme";

interface Props {
  appliesTax: boolean;
  taxRate: string;
  taxAmount: string;
  priceWithTax: string;
}

export function ProductTaxLine({ appliesTax, taxRate, taxAmount, priceWithTax }: Props) {
  if (!appliesTax) {
    return (
      <Text style={styles.line}>
        IVA: <Text style={styles.value}>No aplica</Text>
      </Text>
    );
  }

  const ratePercent = Math.round(Number(taxRate) * 100);

  return (
    <View style={styles.group}>
      <Text style={styles.line}>
        IVA ({ratePercent}%): <Text style={styles.value}>{formatPrice(taxAmount)}</Text>
      </Text>
      <Text style={styles.line}>
        Total con IVA: <Text style={styles.total}>{formatPrice(priceWithTax)}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 2,
  },
  line: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  value: {
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  total: {
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
});
