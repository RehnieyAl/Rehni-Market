import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import { cancelMyOrder, getMyOrderDetail } from "@/api/orderService";
import { getApiErrorDetail, getApiErrorMessage } from "@/api/apiError";
import { ErrorCode } from "@/types/ErrorCode";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { Button } from "@/components/Button";
import { OrderTimeline } from "@/features/orders/components/OrderTimeline";
import { OrderItemsList } from "@/features/orders/components/OrderItemsList";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, isCancellable } from "@/features/orders/orderStatus";
import { formatPrice } from "@/utils/formatPrice";
import { useResponsive } from "@/hooks/useResponsive";
import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";
import type { Order } from "@/types/order";

interface Props {
  orderId: string;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderDetailScreen({ orderId }: Props) {
  const router = useRouter();
  const responsive = useResponsive();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setFailed(false);
      setNotFound(false);
      const data = await getMyOrderDetail(orderId);
      setOrder(data);
    } catch (error) {
      console.error("Error cargando el pedido:", error);
      if (getApiErrorDetail(error)?.code === ErrorCode.ORDER_NOT_FOUND) setNotFound(true);
      else setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleCancel = () => {
    if (!order) return;

    Alert.alert("Cancelar pedido", "¿Cancelar este pedido? Esta acción no se puede deshacer.", [
      { text: "No", style: "cancel" },
      {
        text: "Cancelar pedido",
        style: "destructive",
        onPress: async () => {
          try {
            setCancelling(true);
            const updated = await cancelMyOrder(order.id);
            setOrder(updated);
          } catch (error) {
            Alert.alert(
              "No se pudo cancelar",
              getApiErrorMessage(error, "Intenta de nuevo."),
            );
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const header = (title: string) => (
    <View style={styles.topBar}>
      <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel="Volver">
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </Pressable>
      <Text style={styles.topTitle} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {header("Pedido")}
        <View style={styles.skeletons}>
          <Skeleton height={64} radius="md" />
          <Skeleton height={120} radius="md" />
          <Skeleton height={160} radius="md" />
        </View>
      </SafeAreaView>
    );
  }

  if (notFound) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {header("Pedido")}
        <View style={styles.center}>
          <EmptyState icon="receipt-outline" message="No encontramos este pedido." />
        </View>
      </SafeAreaView>
    );
  }

  if (failed || !order) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {header("Pedido")}
        <View style={styles.center}>
          <ErrorState message="No se pudo cargar el pedido." onRetry={load} />
        </View>
      </SafeAreaView>
    );
  }

  const totalDiscount = order.items.reduce((sum, item) => {
    if (!item.originalUnitPrice) return sum;
    const diff = (Number(item.originalUnitPrice) - Number(item.unitPrice)) * item.quantity;
    return sum + Math.max(diff, 0);
  }, 0);

  const hasTax = Number(order.tax) > 0;

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={responsive.isLandscape ? ["top", "left", "right"] : ["top"]}
    >
      {header(`Pedido ${order.reference}`)}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.frame, { maxWidth: Math.min(responsive.contentMaxWidth, 640) }]}>
          <View style={styles.statusRow}>
            <Badge
              tone={ORDER_STATUS_TONE[order.status]}
              label={ORDER_STATUS_LABEL[order.status]}
            />
            <Text style={styles.date}>{formatDateTime(order.createdAt)}</Text>
          </View>

          <OrderTimeline status={order.status} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Datos de entrega</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoName}>{order.buyerName}</Text>
              <Text style={styles.infoText}>{order.buyerEmail}</Text>
              {order.buyerPhone && <Text style={styles.infoText}>Tel: {order.buyerPhone}</Text>}

              {order.deliveryAddress && (
                <Text style={[styles.infoText, styles.addressLine]}>
                  {order.deliveryAddress.label ? `${order.deliveryAddress.label} · ` : ""}
                  {order.deliveryAddress.address}, {order.deliveryAddress.city},{" "}
                  {order.deliveryAddress.department}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Productos · {order.companyName}</Text>
            <OrderItemsList items={order.items} />
          </View>

          {order.shippingCarrier && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Envío</Text>
              <View style={styles.infoCard}>
                <Text style={styles.infoName}>{order.shippingCarrier.name}</Text>
                {order.trackingNumber && (
                  <Text style={styles.infoText}>Guía: {order.trackingNumber}</Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalLabel}>{formatPrice(order.subtotal)}</Text>
            </View>

            {totalDiscount > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, styles.discount]}>Descuentos</Text>
                <Text style={[styles.totalLabel, styles.discount]}>
                  -{formatPrice(totalDiscount)}
                </Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IVA</Text>
              <Text style={styles.totalLabel}>
                {hasTax ? formatPrice(order.tax) : "No aplica"}
              </Text>
            </View>

            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotal}>Total</Text>
              <Text style={styles.grandTotal}>{formatPrice(order.total)}</Text>
            </View>
          </View>

          {isCancellable(order.status) && (
            <Button
              label={cancelling ? "Cancelando..." : "Cancelar pedido"}
              variant="outline"
              onPress={handleCancel}
              loading={cancelling}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  topTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  skeletons: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: spacing.xxl,
  },
  frame: {
    width: "100%",
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  infoCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: 2,
  },
  infoName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  addressLine: {
    marginTop: spacing.xs,
  },
  totals: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  totalLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  discount: {
    color: colors.success,
  },
  grandTotalRow: {
    marginTop: spacing.xs,
  },
  grandTotal: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
});
