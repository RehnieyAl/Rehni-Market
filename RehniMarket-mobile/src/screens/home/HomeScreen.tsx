import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HomeHeader } from "./components/HomeHeader";
import { SearchBar } from "./components/SearchBar";
import { BannerCarousel } from "./components/BannerCarousel";
import { CategorySection } from "./components/CategorySection";
import { ProductSection } from "./components/ProductSection";
import { colors, spacing } from "@/theme";

// Home real de RehniMarket Mobile (ver references/ux-user.png + informe
// de análisis del Home web). Header fijo arriba (no scrollea, ver Fase
// Home > BOTTOM NAVIGATION - "Home debe ocupar únicamente el contenido
// superior"), el resto en un único ScrollView. Cada sección
// (BannerCarousel/CategorySection/ProductSection) pide sus propios datos
// de forma independiente - mismo criterio que Hero/CategoriesSection/
// DailyProducts en la web: si una falla, no bloquea a las demás.
//
// Secciones deliberadamente NO incluidas (ver Fase Home > OBJETIVO):
// "Ofertas exclusivas" y "Vendedores destacados" no existen ni en
// references/ux-user.png ni en el Home web real.
export function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <HomeHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SearchBar />
        <BannerCarousel />
        <CategorySection />
        <ProductSection />

        <View style={styles.bottomSpacer} />
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
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
