import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { getActiveAdvertisements } from "@/api/homeService";
import type { PublicAdvertisement } from "@/api/homeService";
import { Skeleton } from "@/components/Skeleton";
import { ErrorState } from "@/components/ErrorState";
import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";

const AUTOPLAY_INTERVAL_MS = 4000;
const HORIZONTAL_PADDING = spacing.lg;
const BANNER_WIDTH = Dimensions.get("window").width - HORIZONTAL_PADDING * 2;
const BANNER_HEIGHT = 160;

const isExternalLink = (link: string) => /^https?:\/\//i.test(link);

// Espejo funcional de RehniMarket-frontend/src/features/public/home/
// components/Hero.tsx: mismo endpoint (GET /public/advertisements),
// mismo autoplay de 4s, mismo fallback mobile_image_url → image_url. La
// web oculta las flechas prev/next en mobile (`hidden lg:flex`) - acá SÍ
// se muestran, porque references/ux-user.png (fuente visual para
// Android) las incluye explícitamente en el carrusel.
export function BannerCarousel() {
  const router = useRouter();

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
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / BANNER_WIDTH);
    setIndex(newIndex);
  };

  const handlePressCta = (advertisement: PublicAdvertisement) => {
    if (!advertisement.button_link) return;

    if (isExternalLink(advertisement.button_link)) {
      Linking.openURL(advertisement.button_link);
    } else {
      router.push(advertisement.button_link);
    }
  };

  if (loading) {
    return <Skeleton width={BANNER_WIDTH} height={BANNER_HEIGHT} radius="lg" />;
  }

  if (failed) {
    return <ErrorState message="No se pudieron cargar los banners." onRetry={load} />;
  }

  // Sin anuncios activos: se omite la sección entera, mismo criterio que
  // CategoriesSection/DailyProducts en la web (ver Fase Home > ESTADOS,
  // "manejar estado vacío").
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
        renderItem={({ item }) => {
          const hasCta = Boolean(item.button_text && item.button_link);

          return (
            <Pressable
              style={styles.slide}
              onPress={() => hasCta && handlePressCta(item)}
              disabled={!hasCta}
            >
              <Image
                source={{ uri: item.mobile_image_url ?? item.image_url }}
                style={styles.image}
                contentFit="cover"
              />

              <View style={styles.overlay} />

              <View style={styles.content}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>

                {hasCta && (
                  <View style={styles.ctaButton}>
                    <Text style={styles.ctaText}>{item.button_text}</Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.textOnPrimary} />
                  </View>
                )}
              </View>
            </Pressable>
          );
        }}
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
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.border,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#00000055",
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
  },
  ctaButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  ctaText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textOnPrimary,
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
