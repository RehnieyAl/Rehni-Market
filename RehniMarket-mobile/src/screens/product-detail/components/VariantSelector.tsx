import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";

export interface ColorOption {
  key: string;
  hex: string;
  name: string;
  outOfStock: boolean;
}

interface Props {
  options: ColorOption[];
  selectedKey: string | null;
  selectedName: string | null;
  onSelect: (key: string) => void;
}

// Espejo exacto de la sección "Color" de RehniMarket-frontend/src/
// features/public/products/components/ProductDetail.tsx: NO asume
// nombres de atributo genéricos ("talla"/"capacidad"/etc.) porque el
// backend real solo modela variantes por COLOR (ver
// PublicProductVariantResponse.color, CreateVariantRequest exige
// exactamente un color por variante) - no hay otro tipo de atributo que
// portar. `options` ya incluye el color base del producto (si tiene) +
// cada variante con color, agotadas incluidas (ver Fase Product Detail >
// STOCK - REGLA CRÍTICA, "el stock del producto principal NO debe ocultar
// variantes disponibles"): se muestran igual, deshabilitadas con opacidad
// reducida, en vez de desaparecer de la lista.
export function VariantSelector({ options, selectedKey, selectedName, onSelect }: Props) {
  if (options.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Color{selectedName ? `: ${selectedName}` : ""}</Text>

      <View style={styles.row}>
        {options.map((option) => {
          const isSelected = option.key === selectedKey;

          return (
            <Pressable
              key={option.key}
              disabled={option.outOfStock}
              onPress={() => onSelect(option.key)}
              hitSlop={4}
              style={[
                styles.swatch,
                { backgroundColor: option.hex },
                isSelected && styles.swatchSelected,
                option.outOfStock && styles.swatchDisabled,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.border,
  },
  swatchSelected: {
    borderColor: colors.primary,
  },
  swatchDisabled: {
    opacity: 0.35,
  },
});
