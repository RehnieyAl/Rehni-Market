/** RehniCoin del comprador: saldo disponible, solicitud de recarga por WhatsApp al equipo de atención e
 * historial paginado de movimientos. El saldo solo cambia por los flujos del backend. */
import { useCallback, useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Coins, History } from "lucide-react";

import { getMyTransactions, getMyWallet } from "@/features/wallet/api/walletService";
import WhatsappRechargeCard from "@/features/wallet/components/WhatsappRechargeCard";
import { WALLET_TRANSACTION_TYPE_LABEL, WALLET_TRANSACTION_TYPE_TONE } from "@/features/wallet/utils/transactionType";
import DashboardPageHeader from "@/shared/components/dashboard/DashboardPageHeader";
import DashboardPager from "@/shared/components/dashboard/DashboardPager";
import DashboardSection from "@/shared/components/dashboard/DashboardSection";
import { Badge, EmptyState, ErrorState, Skeleton, TableSkeleton } from "@/shared/components/ui";
import { cn } from "@/shared/utils/cn";
import { formatPrice } from "@/shared/utils/formatPrice";

import type { WalletTransaction } from "@/features/wallet/types/response";

const PAGE_SIZE = 10;

export default function Wallet() {
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceFailed, setBalanceFailed] = useState(false);

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsFailed, setTransactionsFailed] = useState(false);

  const loadBalance = useCallback(async () => {
    try {
      setBalanceFailed(false);
      setBalance((await getMyWallet()).balance);
    } catch (error) {
      console.error("Error cargando el saldo de RehniCoin:", error);
      setBalanceFailed(true);
    }
  }, []);

  const loadTransactions = useCallback(async (targetPage: number) => {
    try {
      setTransactionsLoading(true);
      setTransactionsFailed(false);
      const response = await getMyTransactions(targetPage, PAGE_SIZE);
      setTransactions(response.items);
      setTotalPages(response.total_pages || 1);
    } catch (error) {
      console.error("Error cargando los movimientos de RehniCoin:", error);
      setTransactionsFailed(true);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(loadBalance);
    return () => clearTimeout(timeout);
  }, [loadBalance]);

  useEffect(() => {
    const timeout = setTimeout(() => loadTransactions(page));
    return () => clearTimeout(timeout);
  }, [loadTransactions, page]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon={<Coins size={26} />}
        title="RehniCoin"
        description="Tu saldo y tus movimientos. 1 RehniCoin equivale a 1 COP."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section
          aria-label="Saldo disponible"
          className="relative overflow-hidden rounded-card border border-hairline bg-surface-1 p-6"
        >
          <div className="relative flex items-center gap-4">
            <span
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary"
            >
              <Coins size={26} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink-muted">Saldo disponible</p>
              {balanceFailed ? (
                <button type="button" onClick={loadBalance} className="mt-1 text-sm font-medium brand-link">
                  No se pudo cargar el saldo. Reintentar
                </button>
              ) : balance === null ? (
                <Skeleton className="mt-2 h-9 w-40" />
              ) : (
                <p className="mt-1 text-2xl font-semibold tabular-nums text-ink sm:text-4xl">{formatPrice(balance)} RC</p>
              )}
              <p className="mt-1 text-sm text-ink-muted">Disponible para tus compras en RehniMarket.</p>
            </div>
          </div>
        </section>

        <WhatsappRechargeCard />
      </div>

      <DashboardSection
        title="Movimientos"
        description="Recargas, compras y reembolsos de tu billetera."
        icon={<History size={18} />}
        bodyClassName="p-0 pt-4"
        footer={
          totalPages > 1 ? <DashboardPager inline page={page} totalPages={totalPages} onPageChange={setPage} /> : undefined
        }
      >
        {transactionsFailed ? (
          <ErrorState variant="plain" title="No pudimos cargar tus movimientos" onRetry={() => loadTransactions(page)} />
        ) : transactionsLoading ? (
          <TableSkeleton rows={4} columns={["24%", "16%", "36%", "16%"]} />
        ) : transactions.length === 0 ? (
          <EmptyState variant="plain" icon={<History size={22} />} title="Todavía no tienes movimientos de RehniCoin" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead>
                <tr className="border-y border-hairline bg-surface-2/60 text-xs text-ink-muted">
                  <th scope="col" className="px-5 py-3 font-medium">Fecha</th>
                  <th scope="col" className="px-5 py-3 font-medium">Tipo</th>
                  <th scope="col" className="px-5 py-3 font-medium">Descripción</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {transactions.map((transaction) => {
                  const negative = Number(transaction.amount) < 0;
                  return (
                    <tr key={transaction.id} className="transition-colors hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-5 py-3 text-sm text-ink-muted">
                        {new Date(transaction.createdAt).toLocaleString("es-CO")}
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={WALLET_TRANSACTION_TYPE_TONE[transaction.type]}>
                          {WALLET_TRANSACTION_TYPE_LABEL[transaction.type]}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-sm text-ink">{transaction.description ?? "—"}</td>
                      <td
                        className={cn(
                          "whitespace-nowrap px-5 py-3 text-right text-sm font-semibold tabular-nums",
                          negative ? "text-ink" : "text-success",
                        )}
                      >
                        <span className="inline-flex items-center gap-1">
                          {negative ? (
                            <ArrowUpRight size={14} aria-hidden="true" className="text-ink-muted" />
                          ) : (
                            <ArrowDownLeft size={14} aria-hidden="true" />
                          )}
                          {negative ? "" : "+"}
                          {formatPrice(transaction.amount)} RC
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSection>
    </div>
  );
}
