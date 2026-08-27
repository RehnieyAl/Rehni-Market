import { useState } from "react";
import { Dimensions, FlatList, StyleSheet, View } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { colors, radii, spacing } from "@/theme";
import type { PublicProductImage } from "@/types/product";

interface Props {
  images: PublicProductImage[];
  productName: string;
}

const HORIZONTAL_PADDING = spacing.lg;
const GALLERY_WIDTH = Dimensions.get("window").width - HORIZONTAL_PADDING * 2;
// Mismo alto base que RehniMarket-frontend/src/features/public/products/
// components/ProductGallery.tsx (h-[320px] en mobile) - ahí crece por
// breakpoint (sm:380/lg:560), acá no hace falta: es el único tamaño de
// pantalla que existe en la app.
const GALLERY_HEIGHT = 320;

// Espejo funcional de ProductGallery.tsx de la web (imagen principal +
// miniaturas), pero como swipe horizontal + dots en vez de columna de
// miniaturas: references/ux-user.png (panel de detalle de producto) muestra
// exactamente eso - una imagen grande con puntos de paginación debajo, sin
// tira de miniaturas -, mismo patrón que ya usa BannerCarousel.tsx en Home.
// Ordena main image primero (is_main), igual que selectedImage en la web.
export function ProductGallery({ images, productName }: Props) {
  const [index, setIndex] = useState(0);

  const orderedImages =
    images.length > 1
      ? [...images].sort((a, b) => Number(b.is_main) - Number(a.is_main))
      : images;

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / GALLERY_WIDTH));
  };

  if (orderedImages.length === 0) {
    return (
      <View style={[styles.frame, styles.empty]}>
        <Ionicons name="image-outline" size={48} color={colors.textMuted} />
      </View>
    );
  }

  return (
    <View>
      <FlatList
        data={orderedImages}
        keyExtractor={(image) => image.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={({ item }) => (
          <View style={styles.frame}>
            <Image
              source={{ uri: item.url }}
              style={styles.image}
              contentFit="contain"
              transition={150}
              accessibilityLabel={productName}
            />
          </View>
        )}
      />

      {orderedImages.length > 1 && (
        <View style={styles.dots}>
          {orderedImages.map((image, dotIndex) => (
            <View key={image.id} style={[styles.dot, dotIndex === index && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: GALLERY_WIDTH,
    height: GALLERY_HEIGHT,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  empty: {
    width: GALLERY_WIDTH,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  dots: {
    marginTop: spacing.sm,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primary,
  },
});
