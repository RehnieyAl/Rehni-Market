import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";
import type { PublicProductsSort } from "@/types/product";

interface Props {
  value: PublicProductsSort;
  onChange: (value: PublicProductsSort) => void;
}

const OPTIONS: { value: PublicProductsSort; label: string }[] = [
  { value: "relevance", label: "Relevancia" },
  { value: "price_asc", label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
  { value: "discount", label: "Mayor descuento" },
];

export function SortChips({ value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {OPTIONS.map((option) => {
        const active = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.textOnPrimary,
    fontWeight: fontWeight.semibold,
  },
});
