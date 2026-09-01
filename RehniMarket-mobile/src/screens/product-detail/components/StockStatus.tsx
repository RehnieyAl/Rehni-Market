import { StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import type { BadgeTone } from "@/components/ui/Badge";
import { colors, fontSize } from "@/theme";

interface Props {
  requiresVariant: boolean;
  hasChosenVariant: boolean;
  anyVariantInStock: boolean;
  stock: number;
}

type Status = "available" | "outOfStock" | "chooseOptions";

export function StockStatus({ requiresVariant, hasChosenVariant, anyVariantInStock, stock }: Props) {
  const status: Status =
    requiresVariant && !hasChosenVariant
      ? anyVariantInStock
        ? "chooseOptions"
        : "outOfStock"
      : stock > 0
        ? "available"
        : "outOfStock";

  const config: Record<Status, { tone: BadgeTone; label: string; detail: string | null }> = {
    available: {
      tone: "success",
      label: "En stock",
      detail: `${stock} ${stock === 1 ? "unidad disponible" : "unidades disponibles"}`,
    },
    outOfStock: {
      tone: "danger",
      label: "Agotado",
      detail: null,
    },
    chooseOptions: {
      tone: "warning",
      label: "Elige las opciones para ver el stock",
      detail: null,
    },
  };

  const current = config[status];

  return (
    <View style={styles.container}>
      <Badge tone={current.tone} label={current.label} dot />
      {current.detail && <Text style={styles.detail}>{current.detail}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
    alignItems: "flex-start",
  },
  detail: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
