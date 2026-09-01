import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/utils/formatPrice";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "../orderStatus";
import { colors, fontSize, fontWeight, radii, shadows, spacing } from "@/theme";
import type { Order } from "@/types/order";

interface Props {
  order: Order;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function OrderCard({ order }: Props) {
  const router = useRouter();

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: "/(user)/orders/[id]", params: { id: order.id } })}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="receipt-outline" size={20} color={colors.primary} />
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.reference} numberOfLines={1}>
            {order.reference}
          </Text>
          <Badge tone={ORDER_STATUS_TONE[order.status]} label={ORDER_STATUS_LABEL[order.status]} />
        </View>

        <Text style={styles.meta}>
          {formatDate(order.createdAt)} · {order.companyName}
        </Text>

        <Text style={styles.total}>{formatPrice(order.total)}</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    ...shadows.card,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    gap: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  reference: {
    flexShrink: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  meta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  total: {
    marginTop: 2,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
});
