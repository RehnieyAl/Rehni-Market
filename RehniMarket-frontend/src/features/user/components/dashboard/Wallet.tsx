import { useCallback, useEffect, useState } from "react";
import { Coins, Plus } from "lucide-react";

import { useAuth } from "@/features/public/auth/context/useAuth";
import { getMyWallet, getMyTransactions } from "@/features/wallet/api/walletService";
import RechargeRequestModal from "@/features/wallet/components/RechargeRequestModal";
import {
  WALLET_TRANSACTION_TYPE_LABEL,
  WALLET_TRANSACTION_TYPE_TONE,
} from "@/features/wallet/utils/transactionType";

import StatCard from "@/shared/components/dashboard/StatCard";
import Pagination from "@/shared/components/Pagination";
import { Badge, Button, EmptyState, TableSkeleton } from "@/shared/components/ui";
import { formatPrice } from "@/shared/utils/formatPrice";

import type { WalletTransaction } from "@/features/wallet/types/response";

const PAGE_SIZE = 10;

export default function Wallet() {
  const { user } = useAuth();

  const [balance, setBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);

  const loadBalance = useCallback(async () => {
    try {
      setBalanceLoading(true);
      const wallet = await getMyWallet();
      setBalance(wallet.balance);
    } catch (error) {
      console.error("Error cargando el saldo de RehniCoin:", error);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const loadTransactions = useCallback(async (targetPage: number) => {
    try {
      setTransactionsLoading(true);
      const response = await getMyTransactions(targetPage, PAGE_SIZE);
      setTransactions(response.items);
      setTotalPages(response.total_pages || 1);
    } catch (error) {
      console.error("Error cargando los movimientos de RehniCoin:", error);
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
    <div>
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">RehniCoins</h1>

      <p className="mt-1 text-sm text-gray-500">
        Consulta tu saldo y tus movimientos. 1 RehniCoin equivale a 1 COP.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <StatCard
          title="Saldo disponible"
          value={balanceLoading || balance === null ? "…" : `${formatPrice(balance)} RC`}
          subtitle="RehniCoin"
          icon={<Coins size={24} />}
        />

        <Button
          size="lg"
          disabled={!user}
          leadingIcon={<Plus size={18} />}
          onClick={() => setRechargeModalOpen(true)}
        >
          Recargar RehniCoins
        </Button>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 font-semibold text-gray-900">Movimientos</h2>

        <section className="overflow-hidden rounded-card border border-gray-200 bg-surface-1 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium">Descripción</th>
                  <th className="px-5 py-3 font-medium">Monto</th>
                </tr>
              </thead>

              <tbody>
                {transactionsLoading ? (
                  <tr>
                    <td colSpan={4} className="p-0">
                      <TableSkeleton rows={4} columns={["24%", "16%", "36%", "16%"]} />
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-0">
                      <EmptyState
                        variant="plain"
                        title="Todavía no tienes movimientos de RehniCoin"
                      />
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => {
                    const isNegative = Number(transaction.amount) < 0;

                    return (
                      <tr
                        key={transaction.id}
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-5 py-3 text-sm text-gray-600">
                          {new Date(transaction.createdAt).toLocaleString("es-CO")}
                        </td>

                        <td className="px-5 py-3">
                          <Badge tone={WALLET_TRANSACTION_TYPE_TONE[transaction.type]}>
                            {WALLET_TRANSACTION_TYPE_LABEL[transaction.type]}
                          </Badge>
                        </td>

                        <td className="px-5 py-3 text-sm text-gray-600">
                          {transaction.description ?? "—"}
                        </td>

                        <td
                          className={`whitespace-nowrap px-5 py-3 text-sm font-semibold ${
                            isNegative ? "text-gray-700" : "text-success"
                          }`}
                        >
                          {isNegative ? "" : "+"}
                          {formatPrice(transaction.amount)} RC
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-6">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <RechargeRequestModal
        isOpen={rechargeModalOpen}
        userName={user?.name ?? ""}
        userEmail={user?.email ?? ""}
        onClose={() => setRechargeModalOpen(false)}
      />
    </div>
  );
}
