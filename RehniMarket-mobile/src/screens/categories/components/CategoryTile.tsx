import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { colors, fontSize, fontWeight, radii, shadows, spacing } from "@/theme";
import type { PublicCatalog } from "@/types/catalog";

interface Props {
  category: PublicCatalog;
  style?: StyleProp<ViewStyle>;
}

export function CategoryTile({ category, style }: Props) {
  const router = useRouter();

  return (
    <Pressable
      style={[styles.container, style]}
      onPress={() =>
        router.push({
          pathname: "/(user)/products",
          params: { catalogId: category.id, catalogName: category.name },
        })
      }
    >
      <View style={styles.imageWrapper}>
        {category.image_url ? (
          <Image source={{ uri: category.image_url }} style={styles.image} contentFit="cover" />
        ) : (
          <Ionicons name="image-outline" size={32} color={colors.textMuted} />
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {category.name}
        </Text>
        <Text style={styles.count}>
          {category.product_count} {category.product_count === 1 ? "producto" : "productos"}
        </Text>
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
    aspectRatio: 1.4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryMuted,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  info: {
    padding: spacing.md,
    gap: 2,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  count: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
