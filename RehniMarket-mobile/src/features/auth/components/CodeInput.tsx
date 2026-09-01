import { useRef } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import type { NativeSyntheticEvent, TextInputKeyPressEventData } from "react-native";

import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";

interface Props {
  length?: number;
  value: string[];
  onChange(value: string[]): void;
  disabled?: boolean;
}

export function CodeInput({ length = 6, value, onChange, disabled = false }: Props) {
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    if (!/^\d?$/.test(text)) return;

    const next = [...value];
    next[index] = text;
    onChange(next);

    if (text && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (event.nativeEvent.key === "Backspace" && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={(el) => {
            inputs.current[index] = el;
          }}
          value={value[index] ?? ""}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(event) => handleKeyPress(event, index)}
          editable={!disabled}
          maxLength={1}
          keyboardType="number-pad"
          textAlign="center"
          style={[styles.box, disabled && styles.boxDisabled]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  box: {
    flex: 1,
    height: 56,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  boxDisabled: {
    backgroundColor: colors.border,
    color: colors.textMuted,
  },
});
