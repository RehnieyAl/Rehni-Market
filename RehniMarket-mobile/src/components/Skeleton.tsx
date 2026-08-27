import { StyleSheet, View } from "react-native";
import type { DimensionValue } from "react-native";

import { colors, radii } from "@/theme";

interface Props {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: keyof typeof radii;
}

// Placeholder de carga genérico (caja gris) - se usa para armar los
// skeletons de banner/categorías/productos mientras cargan (ver Fase Home
// > ESTADOS). Sin animación de shimmer a propósito: mantiene el
// componente simple, la app sigue viéndose "viva" con el resto de la
// pantalla ya interactiva alrededor.
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
