import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { getMyTransactions, getMyWallet } from "@/api/walletService";
import { RechargeSheet } from "@/features/wallet/components/RechargeSheet";
import {
  walletTransactionLabel,
  walletTransactionTone,
} from "@/features/wallet/transactionType";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { formatPrice } from "@/utils/formatPrice";
import { colors, fontSize, fontWeight, radii, shadows, spacing } from "@/theme";
import type { WalletTransaction } from "@/types/wallet";

const PAGE_SIZE = 10;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WalletScreen() {
  const { user } = useAuth();

  const [balance, setBalance] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [wallet, txs] = await Promise.all([
        getMyWallet(),
        getMyTransactions(1, PAGE_SIZE),
      ]);
      setBalance(wallet.balance);
      setTransactions(txs.items);
      setPage(txs.page);
      setTotalPages(txs.total_pages);
    } catch (error) {
      console.error("Error cargando la billetera:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const txs = await getMyTransactions(page + 1, PAGE_SIZE);
      setTransactions((prev) => [...prev, ...txs.items]);
      setPage(txs.page);
      setTotalPages(txs.total_pages);
    } catch (error) {
      console.error("Error cargando más movimientos:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, page, totalPages]);

  const renderHeader = () => (
    <View style={styles.headerBlock}>
      <Text style={styles.title}>RehniCoins</Text>
      <Text style={styles.subtitle}>1 RehniCoin equivale a 1 COP.</Text>

      <View style={styles.balanceCard}>
        <View style={styles.balanceIcon}>
          <Ionicons name="wallet-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.balanceInfo}>
          <Text style={styles.balanceLabel}>Saldo disponible</Text>
          {balance === null ? (
            <Skeleton width={120} height={22} />
          ) : (
            <Text style={styles.balanceValue}>{formatPrice(balance)} RC</Text>
          )}
        </View>
      </View>

      <Button
        label="Recargar RehniCoins"
        onPress={() => setRechargeOpen(true)}
        disabled={!user}
        style={styles.rechargeButton}
      />

      <Text style={styles.sectionTitle}>Movimientos</Text>
    </View>
  );

  return (
    <>
      <ScreenContainer padded={false}>
        {loading && transactions.length === 0 ? (
          <View style={styles.loadingWrap}>
            {renderHeader()}
            <View style={styles.skeletons}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} height={56} radius="md" />
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderHeader}
            renderItem={({ item }) => {
              const negative = Number(item.amount) < 0;

              return (
                <View style={styles.txRow}>
                  <View style={styles.txInfo}>
                    <Badge
                      tone={walletTransactionTone(item.type)}
                      label={walletTransactionLabel(item.type)}
                    />
                    {item.description && (
                      <Text style={styles.txDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                    <Text style={styles.txDate}>{formatDate(item.createdAt)}</Text>
                  </View>

                  <Text style={[styles.txAmount, negative ? styles.txNegative : styles.txPositive]}>
                    {negative ? "" : "+"}
                    {formatPrice(item.amount)} RC
                  </Text>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <EmptyState
                  icon="swap-horizontal-outline"
                  message="Todavía no tienes movimientos de RehniCoin."
                />
              </View>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator style={styles.footer} color={colors.primary} />
              ) : null
            }
          />
        )}
      </ScreenContainer>

      <RechargeSheet
        visible={rechargeOpen}
        onClose={() => setRechargeOpen(false)}
        userName={user?.name ?? ""}
        userEmail={user?.email ?? ""}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  balanceCard: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    ...shadows.card,
  },
  balanceIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceInfo: {
    gap: 2,
  },
  balanceLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  balanceValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  rechargeButton: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    marginTop: spacing.lg,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  loadingWrap: {
    flex: 1,
  },
  skeletons: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  emptyWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  txInfo: {
    flex: 1,
    gap: 4,
    alignItems: "flex-start",
  },
  txDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  txDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  txAmount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  txPositive: {
    color: colors.success,
  },
  txNegative: {
    color: colors.textPrimary,
  },
  footer: {
    paddingVertical: spacing.lg,
  },
});
