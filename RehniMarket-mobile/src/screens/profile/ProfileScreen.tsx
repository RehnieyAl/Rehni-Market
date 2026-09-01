import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useFavorites } from "@/features/favorites/hooks/useFavorites";
import { getMyWallet } from "@/api/walletService";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { MenuRow } from "@/components/ui/MenuRow";
import { formatPrice } from "@/utils/formatPrice";
import { colors, fontSize, fontWeight, radii, shadows, spacing } from "@/theme";

export function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { count: favoritesCount } = useFavorites();

  const [walletBalance, setWalletBalance] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyWallet()
      .then((wallet) => {
        if (!cancelled) setWalletBalance(wallet.balance);
      })
      .catch((error) => console.error("Error cargando saldo:", error));
    return () => {
      cancelled = true;
    };
  }, []);

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "?";

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que quieres cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cerrar sesión", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <ScreenContainer scroll>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi perfil</Text>
        <Pressable
          onPress={() => router.push("/(user)/account")}
          hitSlop={8}
          accessibilityLabel="Configuración de cuenta"
        >
          <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <Pressable style={styles.profileCard} onPress={() => router.push("/(user)/account")}>
        <View style={styles.avatar}>
          {user?.profileImagen ? (
            <Image source={{ uri: user.profileImagen }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarInitial}>{initial}</Text>
          )}
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {user?.name}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {user?.email}
          </Text>
          {user?.tell ? <Text style={styles.email}>{user.tell}</Text> : null}
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <View style={styles.menu}>
        <MenuRow
          icon="bag-handle-outline"
          label="Mis pedidos"
          onPress={() => router.push("/(user)/orders")}
        />
        <MenuRow
          icon="heart-outline"
          label="Favoritos"
          badge={favoritesCount}
          onPress={() => router.push("/(user)/(tabs)/favorites")}
        />
        <MenuRow
          icon="wallet-outline"
          label="RehniCoin"
          value={walletBalance != null ? formatPrice(walletBalance) : undefined}
          onPress={() => router.push("/(user)/wallet")}
        />
        <MenuRow
          icon="location-outline"
          label="Mis direcciones"
          onPress={() => router.push("/(user)/addresses")}
        />
        <MenuRow
          icon="settings-outline"
          label="Configuración de cuenta"
          onPress={() => router.push("/(user)/account")}
        />
        <MenuRow
          icon="log-out-outline"
          label="Cerrar sesión"
          tone="danger"
          last
          onPress={handleLogout}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    ...shadows.card,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  email: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  menu: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    ...shadows.card,
  },
});
