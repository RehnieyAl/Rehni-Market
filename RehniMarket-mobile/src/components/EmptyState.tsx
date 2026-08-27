import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, fontSize, radii, spacing } from "@/theme";

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  message: string;
}

// Bloque "sin resultados" INLINE, dentro de una sección que ya tiene otro
// contenido alrededor (a diferencia de PlaceholderScreen, que es una
// pantalla entera "próximamente"). Ver Fase Home > ESTADOS.
export function EmptyState({ icon = "cube-outline", message }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={22} color={colors.textMuted} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  text: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
  },
});
