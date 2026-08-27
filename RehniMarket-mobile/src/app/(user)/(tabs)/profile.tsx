import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { RequireLoginScreen } from "@/components/RequireLoginScreen";
import { Button } from "@/components/Button";
import { colors, fontSize, fontWeight, spacing } from "@/theme";

// Mismo criterio que cart.tsx/favorites.tsx (ver Fase Acceso Público >
// PROFILE TAB): visitante ve la pantalla de acceso, nunca `user?.name`
// vacío ("...") como pasaría si esto asumiera sesión.
export default function ProfileScreen() {
  const { user, isUser, logout } = useAuth();

  if (!isUser) {
    return (
      <RequireLoginScreen
        icon="person-outline"
        title="Tu cuenta"
        message="Inicia sesión para acceder a tu cuenta."
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>{user?.name}</Text>
      <Text style={styles.subtitle}>{user?.email}</Text>

      {/* PLACEHOLDER - edición de perfil, direcciones, wallet, etc. llegan
          en su propia fase. "Cerrar sesión" SÍ es real (ya existe en
          AuthProvider desde la Fase 3). */}
      <Text style={styles.note}>Perfil completo - próxima fase.</Text>

      <Button label="Cerrar sesión" variant="outline" onPress={logout} style={styles.button} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  note: {
    marginTop: spacing.lg,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  button: {
    marginTop: spacing.xl,
    width: "60%",
  },
});
