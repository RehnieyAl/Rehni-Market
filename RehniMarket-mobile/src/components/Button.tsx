import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";

interface Props {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.outline,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.textOnPrimary : colors.primary} />
      ) : (
        <Text style={variant === "primary" ? styles.primaryLabel : styles.outlineLabel}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  outline: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  primaryLabel: {
    color: colors.textOnPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  outlineLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
