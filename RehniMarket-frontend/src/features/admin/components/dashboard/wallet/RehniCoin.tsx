import { useCallback, useEffect, useState } from "react";
import { Coins, PencilLine } from "lucide-react";
import axios from "axios";

import {
  rechargeWalletByEmail,
  getRechargeHistory,
  correctRecharge,
} from "@/features/admin/api/walletService";
import {
  MAX_ADMIN_RECHARGE_AMOUNT,
  MAX_ADMIN_RECHARGE_AMOUNT_LABEL,
  MAX_ADMIN_RECHARGE_MESSAGE,
} from "@/features/wallet/constants";
import { formatPrice } from "@/shared/utils/formatPrice";
import { useAlert } from "@/shared/components/alert/useAlert";
import { Badge, Button, EmptyState, Input, TableSkeleton } from "@/shared/components/ui";
import CorrectRechargeModal from "./CorrectRechargeModal";

import type { WalletRechargeHistoryItem } from "@/features/wallet/types/response";

const EMPTY_FORM = { email: "", amount: "", description: "" };

export default function RehniCoin() {
  const { showAlert } = useAlert();

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [history, setHistory] = useState<WalletRechargeHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [correctingItem, setCorrectingItem] = useState<WalletRechargeHistoryItem | null>(null);
  const [correcting, setCorrecting] = useState(false);

  const loadHistory = useCallback(async (targetPage: number) => {
    try {
      setHistoryLoading(true);
      const response = await getRechargeHistory(targetPage, 10);
      setHistory(response.items);
      setTotalPages(response.total_pages || 1);
    } catch (error) {
      console.error("Error cargando el historial de recargas:", error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => loadHistory(page));
    return () => clearTimeout(timeout);
  }, [loadHistory, page]);

  const handleChange = (field: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const parsedAmount = Number(form.amount);
  const amountOverLimit =
    form.amount.trim() !== "" &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > MAX_ADMIN_RECHARGE_AMOUNT;
  const isValid =
    form.email.trim() !== "" &&
    form.amount.trim() !== "" &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    parsedAmount <= MAX_ADMIN_RECHARGE_AMOUNT;

  const handleSubmit = async () => {
    if (!isValid) return;

    try {
      setSaving(true);

      const result = await rechargeWalletByEmail(
        form.email.trim(),
        parsedAmount,
        form.description.trim() || undefined,
      );

      showAlert(
        "success",
        `Recarga exitosa a ${result.userName} (${result.userEmail}). Nuevo saldo: ${formatPrice(result.balance)} RC`,
      );

      setForm(EMPTY_FORM);

      if (page === 1) {
        await loadHistory(1);
      } else {
        setPage(1);
      }
    } catch (error) {
      console.error("Error recargando RehniCoin:", error);

      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail?.message
        : undefined;

      showAlert("error", message ?? "No se pudo recargar el saldo.");
    } finally {
      setSaving(false);
    }
  };

  const handleCorrect = async (newAmount: number, reason: string) => {
    if (!correctingItem) return;

    try {
      setCorrecting(true);

      const result = await correctRecharge(correctingItem.id, newAmount, reason);

      const adjustment = Number(result.adjustment);
      const sign = adjustment > 0 ? "+" : "-";

      showAlert(
        "success",
        `Recarga corregida para ${result.userName}. Ajuste ${sign}${formatPrice(
          Math.abs(adjustment),
        )} RC · nuevo saldo ${formatPrice(result.balance)} RC.`,
      );

      setCorrectingItem(null);
      await loadHistory(page);
    } catch (error) {
      console.error("Error corrigiendo la recarga:", error);

      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail?.message
        : undefined;

      showAlert("error", message ?? "No se pudo corregir la recarga.");
    } finally {
      setCorrecting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">RehniCoin</h1>

      <p className="mt-2 text-sm text-gray-500">
        Recarga saldo de RehniCoin a un usuario registrado. 1 RehniCoin = 1
        COP — es una billetera interna simulada, no una criptomoneda real.
      </p>

      <div className="mt-6 rounded-card border border-gray-200 bg-surface-1 p-6 shadow-card">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
          <Coins size={18} className="text-primary" />
          Recargar saldo
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            className="sm:col-span-2"
            label="Correo del usuario"
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="usuario@email.com"
          />

          <Input
            label="Cantidad (RC)"
            type="text"
            inputMode="numeric"
            value={form.amount}
            onChange={(e) => handleChange("amount", e.target.value)}
            placeholder="0"
            hint={`Monto máximo de recarga: ${MAX_ADMIN_RECHARGE_AMOUNT_LABEL}`}
            error={amountOverLimit ? MAX_ADMIN_RECHARGE_MESSAGE : undefined}
          />

          <Input
            label="Descripción (opcional)"
            type="text"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Ej. Recarga administrativa"
          />
        </div>

        <Button
          className="mt-6"
          onClick={handleSubmit}
          disabled={!isValid}
          loading={saving}
        >
          Recargar saldo
        </Button>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 font-semibold text-gray-900">
          Últimas recargas
        </h2>

        <section className="overflow-hidden rounded-card border border-gray-200 bg-surface-1 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="bg-surface-1">
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Usuario</th>
                  <th className="px-5 py-3 font-medium">Correo</th>
                  <th className="px-5 py-3 font-medium">Monto</th>
                  <th className="px-5 py-3 font-medium">Administrador responsable</th>
                  <th className="px-5 py-3 text-right font-medium">Acción</th>
                </tr>
              </thead>

              <tbody>
                {historyLoading ? (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <TableSkeleton
                        rows={4}
                        columns={["20%", "15%", "26%", "14%", "15%", "10%"]}
                      />
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <EmptyState
                        variant="plain"
                        title="Todavía no se han registrado recargas"
                      />
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-5 py-3 text-sm text-gray-600">
                        {new Date(item.createdAt).toLocaleString("es-CO")}
                      </td>

                      <td className="px-5 py-3 text-sm font-medium text-gray-900">
                        {item.userName}
                      </td>

                      <td className="px-5 py-3 text-sm text-gray-600">
                        {item.userEmail}
                      </td>

                      <td className="px-5 py-3 text-sm font-semibold text-primary">
                        {formatPrice(item.amount)} RC
                      </td>

                      <td className="px-5 py-3 text-sm text-gray-600">
                        {item.createdByName ?? "—"}
                        {item.createdByEmail ? ` (${item.createdByEmail})` : ""}
                      </td>

                      <td className="px-5 py-3 text-right">
                        {item.isCorrected ? (
                          <Badge tone="warning">Corregida</Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            leadingIcon={<PencilLine size={15} />}
                            onClick={() => setCorrectingItem(item)}
                          >
                            Corregir recarga
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-5">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>

            <span className="text-sm text-gray-600">
              Página {page} de {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>

      {correctingItem && (
        <CorrectRechargeModal
          key={correctingItem.id}
          isOpen
          recharge={correctingItem}
          loading={correcting}
          onClose={() => {
            if (!correcting) setCorrectingItem(null);
          }}
          onConfirm={handleCorrect}
        />
      )}
    </div>
  );
}
