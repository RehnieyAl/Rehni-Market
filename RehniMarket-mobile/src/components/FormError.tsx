import { StyleSheet, Text, View } from "react-native";

import { colors, fontSize, radii, spacing } from "@/theme";

interface Props {
  message: string | null;
}

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
