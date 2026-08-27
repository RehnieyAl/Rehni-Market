import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";

interface Props {
  value: number;
  max: number;
  onChange: (value: number) => void;
}

const MIN_QUANTITY = 1;

// Espejo del selector de cantidad de RehniMarket-frontend/src/features/
// public/products/components/ProductDetail.tsx (sección "Cantidad"):
// mínimo 1, máximo el stock real disponible (`max || 1` - si el stock es
// 0/todavía no hay variante elegida, el máximo cae a 1 en vez de a 0, así
// el selector no queda en un estado inválido mientras stock se resuelve -
// mismo criterio que la web). Nunca permite 0, negativos, ni superar el
// stock (ver Fase Product Detail > QUANTITY SELECTOR).
export function QuantitySelector({ value, max, onChange }: Props) {
  const effectiveMax = max > 0 ? max : MIN_QUANTITY;

  const decrement = () => onChange(Math.max(MIN_QUANTITY, value - 1));
  const increment = () => onChange(Math.min(effectiveMax, value + 1));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cantidad</Text>

      <View style={styles.stepper}>
        <Pressable
          onPress={decrement}
          disabled={value <= MIN_QUANTITY}
          style={[styles.button, value <= MIN_QUANTITY && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>−</Text>
        </Pressable>

        <Text style={styles.value}>{value}</Text>

        <Pressable
          onPress={increment}
          disabled={value >= effectiveMax}
          style={[styles.button, value >= effectiveMax && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>+</Text>
        </Pressable>
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
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
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
