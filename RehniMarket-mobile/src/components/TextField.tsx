import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";

interface Props extends Omit<TextInputProps, "style"> {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  toggleable?: boolean;
  error?: string;
}

export function TextField({ label, icon, toggleable, error, secureTextEntry, ...inputProps }: Props) {
  const [visible, setVisible] = useState(false);
  const isSecure = toggleable ? !visible : secureTextEntry;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.inputWrapper, error && styles.inputWrapperError]}>
        <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.leadingIcon} />

        <TextInput
          {...inputProps}
          secureTextEntry={isSecure}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        {toggleable && (
          <Pressable onPress={() => setVisible((prev) => !prev)} hitSlop={8}>
            <Ionicons
              name={visible ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  inputWrapperError: {
    borderColor: colors.danger,
  },
  leadingIcon: {
    marginRight: 2,
  },
  input: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    padding: 0,
  },
  error: {
    fontSize: fontSize.xs,
    color: colors.danger,
  },
});
