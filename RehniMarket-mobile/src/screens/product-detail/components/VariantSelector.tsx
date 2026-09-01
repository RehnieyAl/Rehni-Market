import { Pressable, StyleSheet, Text, View } from "react-native";

import { deriveVariantAxes, isOptionAvailable } from "@/utils/variantAxes";
import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";
import type { PublicProductVariant } from "@/types/product";

interface Props {
  variants: PublicProductVariant[];
  selected: Record<string, string>;
  onChange: (attributeName: string, value: string) => void;
}

export function VariantSelector({ variants, selected, onChange }: Props) {
  const axes = deriveVariantAxes(variants);

  if (axes.length === 0) return null;

  return (
    <View style={styles.container}>
      {axes.map((axis) => {
        const chosen = selected[axis.name];

        return (
          <View key={axis.name} style={styles.axis}>
            <Text style={styles.axisTitle}>
              {axis.name}
              {chosen ? `: ${chosen}` : ""}
            </Text>

            <View style={styles.values}>
              {axis.values.map(({ value, hex }) => {
                const available = isOptionAvailable(
                  variants,
                  axes,
                  selected,
                  axis.name,
                  value,
                );
                const isSelected = chosen === value;

                if (axis.isColor) {
                  return (
                    <Pressable
                      key={value}
                      disabled={!available}
                      onPress={() => onChange(axis.name, value)}
                      hitSlop={4}
                      accessibilityLabel={
                        available ? value : `${value} (no disponible con la selección actual)`
                      }
                      style={[
                        styles.swatch,
                        { backgroundColor: hex ?? "#E5E7EB" },
                        isSelected && styles.swatchSelected,
                        !available && styles.optionDisabled,
                      ]}
                    />
                  );
                }

                return (
                  <Pressable
                    key={value}
                    disabled={!available}
                    onPress={() => onChange(axis.name, value)}
                    style={[
                      styles.chip,
                      isSelected && styles.chipSelected,
                      !available && styles.optionDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                        !available && styles.chipTextDisabled,
                      ]}
                    >
                      {value}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  axis: {
    gap: spacing.sm,
  },
  axisTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  values: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.borderStrong,
  },
  swatchSelected: {
    borderColor: colors.primary,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  chipTextSelected: {
    color: colors.textOnPrimary,
  },
  chipTextDisabled: {
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  optionDisabled: {
    opacity: 0.4,
  },
});
