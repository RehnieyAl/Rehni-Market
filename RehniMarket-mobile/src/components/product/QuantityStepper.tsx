import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fontSize, fontWeight, radii } from "@/theme";

interface Props {
  value: number;
  max: number;
  onChange: (value: number) => void;
  min?: number;
  disabled?: boolean;
}

export function QuantityStepper({ value, max, onChange, min = 1, disabled = false }: Props) {
  const effectiveMax = max > 0 ? max : min;
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && value < effectiveMax;

  return (
    <View style={[styles.stepper, disabled && styles.stepperDisabled]}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={!canDecrease}
        style={[styles.button, !canDecrease && styles.buttonDisabled]}
        hitSlop={4}
        accessibilityLabel="Disminuir cantidad"
      >
        <Text style={styles.buttonText}>−</Text>
      </Pressable>

      <Text style={styles.value}>{value}</Text>

      <Pressable
        onPress={() => onChange(Math.min(effectiveMax, value + 1))}
        disabled={!canIncrease}
        style={[styles.button, !canIncrease && styles.buttonDisabled]}
        hitSlop={4}
        accessibilityLabel="Aumentar cantidad"
      >
        <Text style={styles.buttonText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperDisabled: {
    opacity: 0.6,
  },
  button: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  buttonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  value: {
    minWidth: 32,
    textAlign: "center",
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
});
