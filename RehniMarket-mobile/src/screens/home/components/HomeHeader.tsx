import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useCart } from "@/features/cart/hooks/useCart";
import { colors, fontSize, fontWeight, spacing } from "@/theme";

export function HomeHeader() {
  const router = useRouter();
  const { totalItems } = useCart();

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <Image
          source={require("../../../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.wordmark}>RehniMarket</Text>
      </View>

      <Pressable hitSlop={8} onPress={() => router.push("/(user)/(tabs)/cart")}>
        <Ionicons name="cart-outline" size={24} color={colors.textPrimary} />

        {totalItems > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalItems > 99 ? "99+" : totalItems}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  logo: {
    width: 28,
    height: 28,
  },
  wordmark: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
  },
});
