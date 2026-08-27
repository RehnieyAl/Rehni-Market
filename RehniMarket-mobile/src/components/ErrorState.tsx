import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";

interface Props {
  message?: string;
  onRetry: () => void;
}

// Bloque de error INLINE con reintento - cada sección de Home (banner/
// categorías/productos) es independiente (mismo criterio que la web:
// Hero/CategoriesSection/DailyProducts cargan por separado), así que si
// una falla, se le muestra esto sin bloquear las demás (ver Fase Home >
// ESTADOS, "no mostrar pantalla completamente blanca").
export function ErrorState({ message = "No se pudo cargar el contenido.", onRetry }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={22} color={colors.danger} />
      <Text style={styles.text}>{message}</Text>

      <Pressable onPress={onRetry} style={styles.button}>
        <Text style={styles.buttonText}>Reintentar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
  button: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});
