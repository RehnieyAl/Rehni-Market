import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { PriceBlock } from "@/components/product/PriceBlock";
import { Rating } from "@/components/ui/Rating";
import { useFavorites } from "@/features/favorites/hooks/useFavorites";
import { useRequireUser } from "@/features/auth/hooks/useRequireUser";
import { getApiErrorMessage } from "@/api/apiError";
import { colors, fontSize, fontWeight, radii, shadows, spacing } from "@/theme";
import type { PublicProductCard } from "@/types/product";

interface Props {
  product: PublicProductCard;
}

export function ProductCard({ product }: Props) {
  const router = useRouter();
  const requireUser = useRequireUser();
  const { isFavorite, toggleFavorite } = useFavorites();

  const favorite = isFavorite(product.id);

  const handleToggleFavorite = () => {
    if (!requireUser()) return;
    toggleFavorite(product.id).catch((error) =>
      Alert.alert("No se pudo actualizar", getApiErrorMessage(error, "Intenta de nuevo.")),
    );
  };

  return (
    <Pressable
      style={styles.container}
      onPress={() =>
        router.push({ pathname: "/(user)/product/[id]", params: { id: product.id } })
      }
    >
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

        <Pressable
          style={styles.favoriteButton}
          onPress={handleToggleFavorite}
          hitSlop={8}
          accessibilityLabel={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <Ionicons
            name={favorite ? "heart" : "heart-outline"}
            size={16}
            color={favorite ? colors.primary : colors.textSecondary}
          />
        </Pressable>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <PriceBlock
          price={product.price}
          finalPrice={product.final_price}
          discountEnabled={product.discount_enabled}
          discountPercentage={product.discount_percentage}
          showBadge={false}
        />

        <Rating value={product.average_rating} count={product.review_count} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    overflow: "hidden",
    ...shadows.card,
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
    backgroundColor: colors.success,
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
  },
  favoriteButton: {
    position: "absolute",
    right: spacing.xs,
    top: spacing.xs,
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  info: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    minHeight: 34,
  },
});
