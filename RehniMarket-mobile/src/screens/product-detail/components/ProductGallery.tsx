import { useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";
import type { PublicProductImage } from "@/types/product";

interface Props {
  images: PublicProductImage[];
  productName: string;
  width: number;
}

const MAX_THUMBS = 4;
const THUMB_SIZE = 56;

export function ProductGallery({ images, productName, width }: Props) {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<PublicProductImage>>(null);

  const size = Math.max(1, Math.round(width));

  const orderedImages =
    images.length > 1
      ? [...images].sort((a, b) => Number(b.is_main) - Number(a.is_main))
      : images;

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / size));
  };

  const goTo = (target: number) => {
    listRef.current?.scrollToIndex({ index: target, animated: true });
    setIndex(target);
  };

  if (orderedImages.length === 0) {
    return (
      <View style={[styles.frame, styles.emptyFrame, { width: size }]}>
        <Ionicons name="image-outline" size={40} color={colors.textMuted} />
        <Text style={styles.emptyText}>Sin imagen</Text>
      </View>
    );
  }

  const hasOverflow = orderedImages.length > MAX_THUMBS;
  const visibleThumbs = hasOverflow
    ? orderedImages.slice(0, MAX_THUMBS - 1)
    : orderedImages.slice(0, MAX_THUMBS);
  const overflowCount = orderedImages.length - (MAX_THUMBS - 1);

  return (
    <View style={{ width: size }}>
      <FlatList
        ref={listRef}
        data={orderedImages}
        keyExtractor={(image) => image.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(_, i) => ({ length: size, offset: size * i, index: i })}
        renderItem={({ item }) => (
          <View style={[styles.frame, { width: size, height: size }]}>
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
        <View style={styles.thumbs}>
          {visibleThumbs.map((image, thumbIndex) => (
            <Pressable
              key={image.id}
              onPress={() => goTo(thumbIndex)}
              style={[styles.thumb, thumbIndex === index && styles.thumbActive]}
              accessibilityLabel={`Ver imagen ${thumbIndex + 1}`}
            >
              <Image source={{ uri: image.url }} style={styles.image} contentFit="cover" />
            </Pressable>
          ))}

          {hasOverflow && (
            <Pressable
              onPress={() => goTo(MAX_THUMBS - 1)}
              style={[styles.thumb, styles.thumbMore]}
              accessibilityLabel={`Ver las otras ${overflowCount} imágenes`}
            >
              <Text style={styles.thumbMoreText}>+{overflowCount}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  emptyFrame: {
    height: 200,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  thumbs: {
    marginTop: spacing.sm,
    flexDirection: "row",
    gap: spacing.sm,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  thumbMore: {
    backgroundColor: colors.primaryMuted,
  },
  thumbMoreText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
});
