import { StyleSheet, View } from "react-native";
import type { DimensionValue } from "react-native";

import { colors, radii } from "@/theme";

interface Props {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: keyof typeof radii;
}

export function Skeleton({ width = "100%", height = 16, radius = "sm" }: Props) {
  return (
    <View
      style={[styles.base, { width, height, borderRadius: radii[radius] }]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.border,
  },
});
