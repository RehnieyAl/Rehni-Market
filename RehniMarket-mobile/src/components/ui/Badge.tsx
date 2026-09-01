import { StyleSheet, Text, View } from "react-native";

import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

interface Props {
  tone?: BadgeTone;
  label: string;
  dot?: boolean;
}

const TONES: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: "#F3F4F6", fg: colors.textSecondary },
  brand: { bg: colors.primaryMuted, fg: colors.primary },
  success: { bg: colors.successMuted, fg: colors.success },
  warning: { bg: colors.warningMuted, fg: colors.warning },
  danger: { bg: colors.dangerMuted, fg: colors.danger },
  info: { bg: colors.infoMuted, fg: colors.info },
};

export function Badge({ tone = "neutral", label, dot = false }: Props) {
  const palette = TONES[tone];

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      {dot && <View style={[styles.dot, { backgroundColor: palette.fg }]} />}
      <Text style={[styles.label, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
