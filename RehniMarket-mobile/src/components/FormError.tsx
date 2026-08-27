import { StyleSheet, Text, View } from "react-native";

import { colors, fontSize, radii, spacing } from "@/theme";

interface Props {
  message: string | null;
}

// Banner inline de error de formulario. Equivalente mínimo del toast
// global `showAlert("error", ...)` de la web (AlertProvider/useAlert) -
// todavía no existe un toast global en la app móvil, así que cada
// pantalla muestra su propio error acá mismo, arriba del formulario, en
// vez de dejar el fallo silencioso (ver Fase 3 > VALIDACIONES).
export function FormError({ message }: Props) {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.dangerMuted,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  text: {
    color: colors.danger,
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
});
