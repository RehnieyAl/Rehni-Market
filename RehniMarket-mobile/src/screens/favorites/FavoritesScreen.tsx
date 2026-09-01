import { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useFavorites } from "@/features/favorites/hooks/useFavorites";
import { FavoriteCard } from "@/features/favorites/components/FavoriteCard";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { getApiErrorMessage } from "@/api/apiError";
import { useResponsive } from "@/hooks/useResponsive";
import { colors, fontSize, fontWeight, spacing } from "@/theme";

export function FavoritesScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const { favorites, loading, refresh, toggleFavorite } = useFavorites();

  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const numColumns = responsive.columns({ min: 2, max: 6, target: 180 });
  const frameWidth = Math.min(responsive.width, responsive.contentMaxWidth);
  const itemWidth =
    (frameWidth - spacing.lg * 2 - responsive.gutter * (numColumns - 1)) / numColumns;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleRemove = async (productId: string) => {
    setRemovingId(productId);
    try {
      await toggleFavorite(productId);
    } catch (error) {
      Alert.alert("No se pudo actualizar", getApiErrorMessage(error, "Intenta de nuevo."));
    } finally {
      setRemovingId(null);
    }
  };

  if (loading && favorites.length === 0) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>Favoritos</Text>
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} width={itemWidth} height={itemWidth * 1.4} radius="lg" />
          ))}
        </View>
      </ScreenContainer>
    );
  }

  if (favorites.length === 0) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>Favoritos</Text>
        <EmptyState
          icon="heart-outline"
          message="Aún no tienes favoritos. Guarda los productos que te interesan y vuelve a ellos cuando quieras."
          action={
            <Button label="Explorar productos" onPress={() => router.push("/(user)/products")} />
          }
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded={false}>
      <Text style={styles.title}>Favoritos</Text>

      <FlatList
        key={numColumns}
        data={favorites}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        renderItem={({ item }) => (
          <View style={{ width: itemWidth }}>
            <FavoriteCard
              product={item.product}
              busy={removingId === item.product.id}
              onRemove={() => handleRemove(item.product.id)}
            />
          </View>
        )}
        columnWrapperStyle={numColumns > 1 ? { gap: responsive.gutter } : undefined}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
});
