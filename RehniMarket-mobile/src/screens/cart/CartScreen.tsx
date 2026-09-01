import { Fragment, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useCart } from "@/features/cart/hooks/useCart";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { getApiErrorMessage } from "@/api/apiError";
import { useResponsive } from "@/hooks/useResponsive";
import { colors, fontSize, fontWeight, radii, shadows, spacing } from "@/theme";
import type { CartItem } from "@/types/cart";

import { CartItemRow } from "./components/CartItemRow";
import { CartSummary } from "./components/CartSummary";

export function CartScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const { cart, loading, pendingItemId, updateItem, removeItem, clear, refreshCart } = useCart();

  const [refreshing, setRefreshing] = useState(false);

  const twoColumn = responsive.atLeast("lg");
  const busy = pendingItemId !== null;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshCart();
    setRefreshing(false);
  };

  const handleQuantity = (item: CartItem, next: number) => {
    if (next === item.quantity) return;
    updateItem(item.id, next).catch((error) =>
      Alert.alert("No se pudo actualizar", getApiErrorMessage(error, "Intenta de nuevo.")),
    );
  };

  const handleRemove = (item: CartItem) => {
    removeItem(item.id).catch((error) =>
      Alert.alert("No se pudo eliminar", getApiErrorMessage(error, "Intenta de nuevo.")),
    );
  };

  const handleClear = () => {
    Alert.alert("Vaciar carrito", "¿Eliminar todos los productos del carrito?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Vaciar",
        style: "destructive",
        onPress: () =>
          clear().catch((error) =>
            Alert.alert("No se pudo vaciar", getApiErrorMessage(error, "Intenta de nuevo.")),
          ),
      },
    ]);
  };

  if (loading && !cart) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>Carrito</Text>
        <View style={styles.skeletons}>
          <Skeleton height={110} radius="lg" />
          <Skeleton height={110} radius="lg" />
          <Skeleton height={160} radius="lg" />
        </View>
      </ScreenContainer>
    );
  }

  const items = cart?.items ?? [];

  if (items.length === 0) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>Carrito</Text>
        <EmptyState
          icon="cart-outline"
          message="Tu carrito está vacío. Agrega productos y vuelve aquí para finalizar tu compra."
          action={
            <Button
              label="Explorar productos"
              onPress={() => router.push("/(user)/products")}
            />
          }
        />
      </ScreenContainer>
    );
  }

  const list = (
    <View style={[styles.listColumn, twoColumn && styles.listColumnFlex]}>
      <View style={styles.itemsCard}>
        {items.map((item, index) => (
          <Fragment key={item.id}>
            {index > 0 && <View style={styles.divider} />}
            <CartItemRow
              item={item}
              busy={busy}
              onChangeQuantity={(next) => handleQuantity(item, next)}
              onRemove={() => handleRemove(item)}
            />
          </Fragment>
        ))}
      </View>
    </View>
  );

  const summary = (
    <View style={twoColumn ? styles.summaryColumn : undefined}>
      <CartSummary
        subtotal={cart?.subtotal ?? "0"}
        tax={cart?.tax ?? "0"}
        total={cart?.total ?? "0"}
        itemCount={cart?.totalItems ?? 0}
        onCheckout={() => router.push("/(user)/checkout")}
        checkoutDisabled={busy}
      />
    </View>
  );

  return (
    <ScreenContainer scroll onRefresh={handleRefresh} refreshing={refreshing}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Carrito</Text>
        <Pressable
          onPress={handleClear}
          disabled={busy}
          hitSlop={8}
          style={busy && styles.clearDisabled}
          accessibilityLabel="Vaciar carrito"
        >
          <Ionicons name="trash-outline" size={22} color={colors.danger} />
        </Pressable>
      </View>

      {twoColumn ? (
        <View style={styles.row}>
          {list}
          {summary}
        </View>
      ) : (
        <View style={styles.stack}>
          {list}
          {summary}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  clearDisabled: {
    opacity: 0.5,
  },
  skeletons: {
    gap: spacing.md,
  },
  stack: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  listColumn: {
    gap: spacing.md,
  },
  listColumnFlex: {
    flex: 1,
  },
  summaryColumn: {
    width: "100%",
    maxWidth: 360,
  },
  itemsCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    ...shadows.card,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
