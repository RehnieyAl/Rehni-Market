import { useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { getDailyProducts } from "@/api/homeService";
import { getPublicNewProducts, getPublicOffers } from "@/api/productsService";
import { HomeHeader } from "./components/HomeHeader";
import { SearchBar } from "./components/SearchBar";
import { BannerCarousel } from "./components/BannerCarousel";
import { CategorySection } from "./components/CategorySection";
import { HomeProductSection } from "./components/HomeProductSection";
import { useResponsive } from "@/hooks/useResponsive";
import { colors, spacing } from "@/theme";

export function HomeScreen() {
  const router = useRouter();
  const { contentMaxWidth, isLandscape } = useResponsive();

  const fetchDaily = useCallback(() => getDailyProducts(6), []);
  const fetchOffers = useCallback(() => getPublicOffers(1, 6).then((r) => r.products), []);
  const fetchNew = useCallback(() => getPublicNewProducts(1, 6).then((r) => r.products), []);

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={isLandscape ? ["top", "left", "right"] : ["top"]}
    >
      <HomeHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
          <SearchBar />
          <BannerCarousel />
          <CategorySection />

          <HomeProductSection
            title="Productos destacados"
            fetcher={fetchDaily}
            onSeeAll={() => router.push("/(user)/products")}
          />
          <HomeProductSection
            title="Ofertas especiales"
            fetcher={fetchOffers}
            onSeeAll={() => router.push("/(user)/offers")}
          />
          <HomeProductSection
            title="Novedades"
            fetcher={fetchNew}
            onSeeAll={() => router.push("/(user)/new")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    alignItems: "center",
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  content: {
    width: "100%",
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
});
