import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { colors, spacing } from "@/theme";

interface Props {
  showBack?: boolean;
}

// Flecha de volver de las pantallas de auth que se navegan "hacia
// adentro" (p. ej. Register desde Login). El logo/wordmark de RehniMarket
// se sacó de acá a propósito - el branding en estos formularios se
// mantiene con el color de marca en botones/estados, no con el logo (ver
// corrección visual de Auth: el logo queda reservado para Home/ícono de
// app/splash).
export function AuthHeader({ showBack = true }: Props) {
  const router = useRouter();

  if (!showBack || !router.canGoBack()) {
    return null;
  }

  return (
    <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
      <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: "flex-start",
    padding: spacing.xs,
  },
});
