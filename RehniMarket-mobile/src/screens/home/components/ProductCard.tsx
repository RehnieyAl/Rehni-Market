import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { formatPrice } from "@/utils/formatPrice";
import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";
import type { PublicProductCard } from "@/types/product";

interface Props {
  product: PublicProductCard;
}

// Componente reutilizable (ver Fase Home > PRODUCT CARD): no depende de
// nada exclusivo de Home, así que Categorías/Búsqueda/Favoritos (fases
// futuras) lo importan tal cual desde acá. Campos reales de
// PublicProductCard - nada inventado.
//
// El corazón de favoritos es ESTADO LOCAL TEMPORAL: todavía no existe
// FavoritesProvider (llega en su propia fase) - no hay nada real que
// togglear. El botón de carrito, por la misma razón (no hay CartProvider
// todavía), navega al detalle en vez de agregar - ver Fase Home > REGLA
// IMPORTANTE, "no pasar todavía a carrito completo".
export function ProductCard({ product }: Props) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);

  const outOfStock = product.stock <= 0;

  const goToDetail = () => {
    router.push({ pathname: "/(user)/product/[id]", params: { id: product.id } });
  };

  return (
    <Pressable style={styles.container} onPress={goToDetail}>
      <View style={styles.imageWrapper}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.image} contentFit="contain" />
        ) : (
          <Ionicons name="image-outline" size={28} color={colors.textMuted} />
        )}

        {product.discount_enabled && product.discount_percentage !== null && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{product.discount_percentage}%</Text>
          </View>
        )}

        {outOfStock && (
          <View style={styles.stockBadge}>
            <Text style={styles.stockText}>Agotado</Text>
          </View>
        )}

        <Pressable
          style={styles.favoriteButton}
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation();
            setIsFavorite((prev) => !prev);
          }}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={15}
            color={isFavorite ? colors.primary : colors.textSecondary}
          />
        </Pressable>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          <View style={styles.priceGroup}>
            <Text style={styles.price}>
              {formatPrice(product.discount_enabled ? product.final_price : product.price)}
            </Text>

            {product.discount_enabled && (
              <Text style={styles.originalPrice}>{formatPrice(product.price)}</Text>
            )}
          </View>

          <Pressable
            style={styles.cartButton}
            hitSlop={8}
            onPress={(event) => {
              event.stopPropagation();
              goToDetail();
            }}
          >
            <Ionicons name="cart-outline" size={14} color={colors.textOnPrimary} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  imageWrapper: {
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: spacing.sm,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  discountBadge: {
    position: "absolute",
    left: spacing.xs,
    top: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
  },
  stockBadge: {
    position: "absolute",
    left: spacing.xs,
    bottom: spacing.xs,
    backgroundColor: colors.textMuted,
    borderRadius: radii.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  stockText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: colors.textOnPrimary,
  },
  favoriteButton: {
    position: "absolute",
    right: spacing.xs,
    top: spacing.xs,
    width: 26,
    height: 26,
    borderRadius: radii.full,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    padding: spacing.sm,
    gap: 4,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    minHeight: 34,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  priceGroup: {
    flex: 1,
  },
  price: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  originalPrice: {
    fontSize: 11,
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  cartButton: {
    width: 26,
    height: 26,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
