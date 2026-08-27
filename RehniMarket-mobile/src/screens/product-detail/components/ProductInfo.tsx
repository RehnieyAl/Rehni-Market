import { StyleSheet, Text, View } from "react-native";

import { formatPrice } from "@/utils/formatPrice";
import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";

interface Props {
  catalogName: string;
  name: string;
  price: string;
  discountEnabled: boolean;
  discountPercentage: number | null;
  finalPrice: string;
}

// Espejo de la cabecera de RehniMarket-frontend/src/features/public/
// products/components/ProductDetail.tsx + ProductPrice.tsx: categoría
// (eyebrow) + nombre + precio con descuento. Rating/reseñas NO se
// muestran todavía a propósito (ver Fase Product Detail > NO IMPLEMENTAR
// TODAVÍA) aunque el backend ya los devuelva. `price`/`discountPercentage`/
// `finalPrice` llegan ya resueltos por el screen (producto base o
// variante activa, según corresponda - ver ProductDetailScreen.tsx).
export function ProductInfo({
  catalogName,
  name,
  price,
  discountEnabled,
  discountPercentage,
  finalPrice,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>{catalogName}</Text>
      <Text style={styles.name}>{name}</Text>

      {discountEnabled ? (
        <View style={styles.priceRow}>
          <Text style={styles.originalPrice}>{formatPrice(price)}</Text>
          <Text style={styles.price}>{formatPrice(finalPrice)}</Text>

          {discountPercentage !== null && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discountPercentage}%</Text>
            </View>
          )}
        </View>
      ) : (
        <Text style={styles.price}>{formatPrice(price)}</Text>
      )}
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
  priceRow: {
    marginTop: spacing.xs,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },
  price: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  originalPrice: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  discountText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});
