import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Linking, Pressable, StyleSheet, View } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { getActiveAdvertisements } from "@/api/homeService";
import type { PublicAdvertisement } from "@/api/homeService";
import { Skeleton } from "@/components/Skeleton";
import { ErrorState } from "@/components/ErrorState";
import { useResponsive } from "@/hooks/useResponsive";
import { colors, radii, spacing } from "@/theme";

const AUTOPLAY_INTERVAL_MS = 4000;
const BANNER_ASPECT_RATIO = 16 / 7;
const BANNER_MAX_HEIGHT = 260;

const isExternalLink = (link: string) => /^https?:\/\//i.test(link);

export function BannerCarousel() {
  const router = useRouter();
  const { width, contentMaxWidth } = useResponsive();

  const slideWidth = Math.min(width, contentMaxWidth) - spacing.lg * 2;
  const slideHeight = Math.min(slideWidth / BANNER_ASPECT_RATIO, BANNER_MAX_HEIGHT);

  const [advertisements, setAdvertisements] = useState<PublicAdvertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [index, setIndex] = useState(0);

  const listRef = useRef<FlatList<PublicAdvertisement>>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setFailed(false);

      const response = await getActiveAdvertisements();
      setAdvertisements(response);
    } catch (error) {
      console.error("Error cargando anuncios:", error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hasMultiple = advertisements.length > 1;

  useEffect(() => {
    if (!hasMultiple) return;

    const timer = setTimeout(() => {
      const next = (index + 1) % advertisements.length;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
    }, AUTOPLAY_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [hasMultiple, index, advertisements.length]);

  const goTo = (targetIndex: number) => {
    listRef.current?.scrollToIndex({ index: targetIndex, animated: true });
    setIndex(targetIndex);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / slideWidth));
  };

  const handlePress = (advertisement: PublicAdvertisement) => {
    if (!advertisement.button_link) return;

    if (isExternalLink(advertisement.button_link)) {
      Linking.openURL(advertisement.button_link);
    } else {
      router.push(advertisement.button_link);
    }
  };

  if (loading) {
    return <Skeleton width={slideWidth} height={slideHeight} radius="lg" />;
  }

  if (failed) {
    return <ErrorState message="No se pudieron cargar los banners." onRetry={load} />;
  }

  if (advertisements.length === 0) {
    return null;
  }

  return (
    <View>
      <FlatList
        ref={listRef}
        data={advertisements}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(_, i) => ({ length: slideWidth, offset: slideWidth * i, index: i })}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.slide, { width: slideWidth, height: slideHeight }]}
            onPress={() => handlePress(item)}
            disabled={!item.button_link}
          >
            <Image
              source={{ uri: item.mobile_image_url ?? item.image_url }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          </Pressable>
        )}
      />

      {hasMultiple && (
        <>
          <Pressable
            style={[styles.arrow, styles.arrowLeft]}
            onPress={() => goTo(index === 0 ? advertisements.length - 1 : index - 1)}
          >
            <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
          </Pressable>

          <Pressable
            style={[styles.arrow, styles.arrowRight]}
            onPress={() => goTo((index + 1) % advertisements.length)}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
          </Pressable>

          <View style={styles.dots}>
            {advertisements.map((advertisement, dotIndex) => (
              <View
                key={advertisement.id}
                style={[styles.dot, dotIndex === index && styles.dotActive]}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.border,
  },
  arrow: {
    position: "absolute",
    top: "50%",
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: "#FFFFFFCC",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowLeft: {
    left: spacing.sm,
  },
  arrowRight: {
    right: spacing.sm,
  },
  dots: {
    position: "absolute",
    bottom: spacing.sm,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
    backgroundColor: "#FFFFFF80",
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.textOnPrimary,
  },
});
