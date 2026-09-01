import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, fontSize, radii, spacing } from "@/theme";

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ icon = "cube-outline", message, action }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={22} color={colors.textMuted} />
      <Text style={styles.text}>{message}</Text>
      {action && <View style={styles.action}>{action}</View>}
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
  action: {
    marginTop: spacing.sm,
  },
});
