import { useCallback, useEffect, useState } from "react";
import { Coins, Plus } from "lucide-react";

import { useAuth } from "@/features/public/auth/context/useAuth";
import { getMyWallet, getMyTransactions } from "@/features/wallet/api/walletService";
import RechargeRequestModal from "@/features/wallet/components/RechargeRequestModal";
import {
  WALLET_TRANSACTION_TYPE_BADGE,
  WALLET_TRANSACTION_TYPE_LABEL,
} from "@/features/wallet/utils/transactionType";

import StatCard from "@/shared/components/dashboard/StatCard";
import Pagination from "@/shared/components/Pagination";
import { formatPrice } from "@/shared/utils/formatPrice";

import type { WalletTransaction } from "@/features/wallet/types/response";

const PAGE_SIZE = 10;

// Vista "RehniCoins" del dashboard de comprador (ver
// dashboardNavigation.tsx > user, id "wallet"). Reutiliza el mismo
// GET /wallet/me y GET /wallet/transactions que ya consume
// features/user/components/dashboard/Home.tsx para el resumen rápido -
// acá se muestran completos (saldo + historial paginado), no solo el
// último dato. NO llama a POST /wallet/recharge (exclusivo admin/owner,
// ver WalletRouter.py) - "Recargar RehniCoins" abre
// RechargeRequestModal.tsx, que solo prepara un mensaje de WhatsApp.
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
      <h1 className="text-3xl font-bold">RehniCoins</h1>

      <p className="mt-2 text-gray-500">
        Consulta tu saldo y tus movimientos. 1 RehniCoin equivale a 1 COP.
      </p>

      {/* SALDO */}
      <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <StatCard
          title="Saldo disponible"
          value={balanceLoading || balance === null ? "..." : `${formatPrice(balance)} RC`}
          subtitle="RehniCoin"
          icon={<Coins size={24} />}
        />

        <button
          type="button"
          onClick={() => setRechargeModalOpen(true)}
          disabled={!user}
          className="flex h-fit items-center justify-center gap-2 rounded-xl bg-[#6D0F2D] px-6 py-3.5 text-sm font-medium text-white transition hover:bg-[#530A20] disabled:cursor-not-allowed disabled:opacity-50 sm:mt-6"
        >
          <Plus size={18} />
          Recargar RehniCoins
        </button>
      </div>

      {/* MOVIMIENTOS */}
      <div className="mt-8">
        <h2 className="mb-4 font-semibold text-gray-900">Movimientos</h2>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
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
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500">
                      Cargando movimientos...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500">
                      Todavía no tienes movimientos de RehniCoin.
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
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${WALLET_TRANSACTION_TYPE_BADGE[transaction.type]}`}
                          >
                            {WALLET_TRANSACTION_TYPE_LABEL[transaction.type]}
                          </span>
                        </td>

                        <td className="px-5 py-3 text-sm text-gray-600">
                          {transaction.description ?? "—"}
                        </td>

                        <td
                          className={`whitespace-nowrap px-5 py-3 text-sm font-semibold ${
                            isNegative ? "text-gray-700" : "text-green-700"
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
