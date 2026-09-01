import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { getMyOrders } from "@/api/orderService";
import { OrderCard } from "@/features/orders/components/OrderCard";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";
import type { Order, OrderStatus } from "@/types/order";

const PAGE_SIZE = 10;

const FILTERS: { key: string; label: string; statuses: OrderStatus[] | null }[] = [
  { key: "all", label: "Todos", statuses: null },
  { key: "pending", label: "Pendientes", statuses: ["pending", "paid", "processing"] },
  { key: "shipped", label: "Enviados", statuses: ["shipped"] },
  { key: "delivered", label: "Entregados", statuses: ["delivered"] },
  { key: "cancelled", label: "Cancelados", statuses: ["cancelled"] },
];

export function OrdersScreen() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [filterKey, setFilterKey] = useState("all");

  const firstLoad = useRef(true);

  const loadFirst = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);
    setFailed(false);

    try {
      const response = await getMyOrders(1, PAGE_SIZE);
      setOrders(response.items);
      setPage(response.page);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error("Error cargando pedidos:", error);
      setFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFirst(firstLoad.current ? "initial" : "refresh");
      firstLoad.current = false;
    }, [loadFirst]),
  );

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || refreshing || failed || page >= totalPages) return;

    setLoadingMore(true);
    try {
      const response = await getMyOrders(page + 1, PAGE_SIZE);
      setOrders((prev) => [...prev, ...response.items]);
      setPage(response.page);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error("Error cargando más pedidos:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, refreshing, failed, page, totalPages]);

  const activeFilter = FILTERS.find((f) => f.key === filterKey) ?? FILTERS[0];
  const filteredOrders = useMemo(() => {
    if (!activeFilter.statuses) return orders;
    return orders.filter((order) => activeFilter.statuses!.includes(order.status));
  }, [orders, activeFilter]);

  if (loading) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>Mis pedidos</Text>
        <View style={styles.skeletons}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} height={110} radius="lg" />
          ))}
        </View>
      </ScreenContainer>
    );
  }

  if (failed) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>Mis pedidos</Text>
        <ErrorState
          message="No pudimos cargar tus pedidos."
          onRetry={() => loadFirst("initial")}
        />
      </ScreenContainer>
    );
  }

  if (orders.length === 0) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>Mis pedidos</Text>
        <EmptyState
          icon="bag-handle-outline"
          message="Todavía no tienes pedidos. Cuando compres, podrás seguir su estado desde aquí."
          action={
            <Button label="Explorar productos" onPress={() => router.push("/(user)/products")} />
          }
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded={false}>
      <Text style={styles.title}>Mis pedidos</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {FILTERS.map((filter) => {
          const active = filter.key === filterKey;
          return (
            <Pressable
              key={filter.key}
              onPress={() => setFilterKey(filter.key)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderCard order={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={() => loadFirst("refresh")}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <EmptyState
            icon="bag-handle-outline"
            message="No tienes pedidos en este estado."
          />
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : null
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  skeletons: {
    gap: spacing.md,
  },
  tabs: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  tabLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.textOnPrimary,
    fontWeight: fontWeight.semibold,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
    flexGrow: 1,
  },
  footer: {
    paddingVertical: spacing.lg,
  },
});
