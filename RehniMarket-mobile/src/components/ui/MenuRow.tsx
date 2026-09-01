import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  badge?: number;
  onPress: () => void;
  tone?: "default" | "danger";
  last?: boolean;
}

export function MenuRow({
  icon,
  label,
  value,
  badge,
  onPress,
  tone = "default",
  last = false,
}: Props) {
  const danger = tone === "danger";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && styles.rowBorder,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={[styles.iconWrap, danger && styles.iconWrapDanger]}>
        <Ionicons
          name={icon}
          size={18}
          color={danger ? colors.danger : colors.primary}
        />
      </View>

      <Text style={[styles.label, danger && styles.labelDanger]} numberOfLines={1}>
        {label}
      </Text>

      {value != null && <Text style={styles.value}>{value}</Text>}

      {badge != null && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      )}

      {!danger && (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    opacity: 0.6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapDanger: {
    backgroundColor: colors.dangerMuted,
  },
  label: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  labelDanger: {
    color: colors.danger,
    fontWeight: fontWeight.semibold,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
  },
});
