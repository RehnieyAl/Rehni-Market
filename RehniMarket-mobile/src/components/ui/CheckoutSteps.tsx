import { Fragment } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";

interface Props {
  current: number;
}

const STEPS = ["Dirección", "Resumen", "Pago", "Confirmación"];

export function CheckoutSteps({ current }: Props) {
  return (
    <View style={styles.container}>
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;

        return (
          <Fragment key={label}>
            {index > 0 && (
              <View style={[styles.line, index <= current && styles.lineDone]} />
            )}

            <View style={styles.step}>
              <View
                style={[
                  styles.dot,
                  active && styles.dotActive,
                  done && styles.dotDone,
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={13} color={colors.textOnPrimary} />
                ) : (
                  <Text style={[styles.dotText, active && styles.dotTextActive]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[styles.label, (active || done) && styles.labelActive]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  step: {
    alignItems: "center",
    gap: 4,
    width: 68,
  },
  line: {
    flex: 1,
    height: 2,
    marginTop: 11,
    backgroundColor: colors.border,
  },
  lineDone: {
    backgroundColor: colors.primary,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  dotActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dotDone: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dotText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
  },
  dotTextActive: {
    color: colors.textOnPrimary,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
  },
  labelActive: {
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
});
