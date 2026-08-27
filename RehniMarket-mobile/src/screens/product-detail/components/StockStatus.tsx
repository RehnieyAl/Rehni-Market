import { StyleSheet, Text, View } from "react-native";

import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";

interface Props {
  // true cuando el producto tiene variantes (product.variants.length > 0)
  // - en ese caso el stock del producto base NO decide la disponibilidad
  // (ver Fase Product Detail > STOCK - REGLA CRÍTICA).
  requiresVariant: boolean;
  hasChosenVariant: boolean;
  // Si ninguna variante tiene stock, "selecciona una variante" no aplica:
  // ya se sabe que está agotado sin necesidad de elegir (mismo criterio
  // que ProductDetail.tsx > anyVariantInStock).
  anyVariantInStock: boolean;
  // Stock de la variante seleccionada, o del producto si no tiene
  // variantes - ya resuelto por ProductDetailScreen.
  stock: number;
}

type Status = "available" | "outOfStock" | "selectVariant";

// Tres estados explícitos, nunca solo un botón deshabilitado sin
// explicación (ver Fase Product Detail > ESTADO DE PRODUCTO): Disponible /
// Agotado / Selecciona una variante. Mismos tres colores que ya usa el
// theme (success/warning/danger) - ninguno nuevo.
export function StockStatus({ requiresVariant, hasChosenVariant, anyVariantInStock, stock }: Props) {
  const status: Status =
    requiresVariant && !hasChosenVariant
      ? anyVariantInStock
        ? "selectVariant"
        : "outOfStock"
      : stock > 0
        ? "available"
        : "outOfStock";

  const config = {
    available: {
      color: colors.success,
      label: "En stock",
      detail: `${stock} ${stock === 1 ? "unidad disponible" : "unidades disponibles"}`,
    },
    outOfStock: {
      color: colors.danger,
      label: "Agotado",
      detail: null,
    },
    selectVariant: {
      color: colors.warning,
      label: "Selecciona un color para ver el stock disponible",
      detail: null,
    },
  }[status];

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: config.color }]} />
        <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
      </View>

      {config.detail && <Text style={styles.detail}>{config.detail}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  detail: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
