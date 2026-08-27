import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { colors, fontSize, fontWeight, radii } from "@/theme";
import type { PublicCatalog } from "@/types/catalog";

interface Props {
  category: PublicCatalog;
}

// Espejo funcional de RehniMarket-frontend/src/features/public/
// categories/components/CategoryCard.tsx: imagen real (image_url, con
// placeholder si es null) + nombre + cantidad de productos (dato real del
// backend, no calculado acá). Layout compacto vertical en vez de la
// tarjeta ancha de la web - así entra en el scroll horizontal que pide
// references/ux-user.png (ver CategorySection.tsx).
export function CategoryCard({ category }: Props) {
  const router = useRouter();

  return (
    <Pressable
      style={styles.container}
      onPress={() =>
        router.push({
          pathname: "/(user)/products",
          params: { catalogId: category.id, catalogName: category.name },
        })
      }
    >
      <View style={styles.imageWrapper}>
        {category.image_url ? (
          <Image
            source={{ uri: category.image_url }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <Ionicons name="image-outline" size={22} color={colors.textMuted} />
        )}
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {category.name}
      </Text>

      <Text style={styles.count}>
        {category.product_count} {category.product_count === 1 ? "producto" : "productos"}
      </Text>
    </Pressable>
  );
}

const CARD_WIDTH = 84;

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    alignItems: "center",
    gap: 4,
  },
  imageWrapper: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  name: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: "center",
  },
  count: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
  },
});
