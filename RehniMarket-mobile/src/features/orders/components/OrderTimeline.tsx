import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";
import type { OrderStatus } from "@/types/order";

interface Props {
  status: OrderStatus;
}

const STEPS: { label: string; reachedAt: OrderStatus[] }[] = [
  { label: "Pendiente", reachedAt: ["pending", "paid", "processing", "shipped", "delivered"] },
  { label: "Pagado", reachedAt: ["pending", "paid", "processing", "shipped", "delivered"] },
  { label: "En proceso", reachedAt: ["processing", "shipped", "delivered"] },
  { label: "Enviado", reachedAt: ["shipped", "delivered"] },
  { label: "Entregado", reachedAt: ["delivered"] },
];

export function OrderTimeline({ status }: Props) {
  if (status === "cancelled") {
    return (
      <View style={styles.cancelled}>
        <View style={styles.cancelledIcon}>
          <Ionicons name="close" size={16} color={colors.textOnPrimary} />
        </View>
        <Text style={styles.cancelledText}>Este pedido fue cancelado.</Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {STEPS.map((step, index) => {
        const reached = step.reachedAt.includes(status);
        const isLast = index === STEPS.length - 1;
        const nextReached = !isLast && STEPS[index + 1].reachedAt.includes(status);

        return (
          <View key={step.label} style={[styles.step, isLast && styles.stepLast]}>
            <View style={styles.stepTop}>
              <View style={[styles.dot, reached ? styles.dotReached : styles.dotPending]}>
                {reached ? (
                  <Ionicons name="checkmark" size={13} color={colors.textOnPrimary} />
                ) : (
                  <Text style={styles.dotNumber}>{index + 1}</Text>
                )}
              </View>

              {!isLast && (
                <View style={[styles.line, nextReached ? styles.lineReached : styles.linePending]} />
              )}
            </View>

            <Text
              style={[styles.label, reached ? styles.labelReached : styles.labelPending]}
              numberOfLines={1}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  step: {
    flex: 1,
    alignItems: "center",
  },
  stepLast: {
    flex: 0,
  },
  stepTop: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  dotReached: {
    backgroundColor: colors.primary,
  },
  dotPending: {
    backgroundColor: colors.border,
  },
  dotNumber: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },
  line: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
  },
  lineReached: {
    backgroundColor: colors.primary,
  },
  linePending: {
    backgroundColor: colors.border,
  },
  label: {
    marginTop: spacing.xs,
    fontSize: 11,
    fontWeight: fontWeight.medium,
    textAlign: "center",
  },
  labelReached: {
    color: colors.textPrimary,
  },
  labelPending: {
    color: colors.textMuted,
  },
  cancelled: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.dangerMuted,
    backgroundColor: colors.dangerMuted,
    padding: spacing.md,
  },
  cancelledIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelledText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.danger,
  },
});
