import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { PriceBlock } from "@/components/product/PriceBlock";
import { colors, fontSize, fontWeight, radii, shadows, spacing } from "@/theme";
import type { FavoriteProduct } from "@/types/favorite";

interface Props {
  product: FavoriteProduct;
  busy: boolean;
  onRemove: () => void;
}

export function FavoriteCard({ product, busy, onRemove }: Props) {
  const router = useRouter();

  return (
    <Pressable
      style={styles.container}
      onPress={() => router.push({ pathname: "/(user)/product/[id]", params: { id: product.id } })}
    >
      <View style={styles.imageWrapper}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.image} contentFit="contain" />
        ) : (
          <Ionicons name="image-outline" size={28} color={colors.textMuted} />
        )}

        <Pressable
          style={styles.removeButton}
          onPress={onRemove}
          disabled={busy}
          hitSlop={8}
          accessibilityLabel={`Quitar ${product.name} de favoritos`}
        >
          <Ionicons name="heart" size={16} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.info}>
        <Text style={styles.company} numberOfLines={1}>
          {product.companyName}
        </Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <PriceBlock
          price={product.price}
          finalPrice={product.finalPrice}
          discountEnabled={product.discountEnabled}
          discountPercentage={null}
          showBadge={false}
        />

        {!product.isActive && (
          <Text style={styles.unavailable}>Este producto ya no está disponible.</Text>
        )}
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
  removeButton: {
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
  company: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    minHeight: 34,
  },
  unavailable: {
    fontSize: fontSize.xs,
    color: colors.warning,
  },
});
