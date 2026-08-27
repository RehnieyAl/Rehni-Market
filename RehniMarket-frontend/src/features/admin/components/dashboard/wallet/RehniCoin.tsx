import { useCallback, useEffect, useState } from "react";
import { Coins } from "lucide-react";
import axios from "axios";

import { rechargeWalletByEmail, getRechargeHistory } from "@/features/admin/api/walletService";
import { formatPrice } from "@/shared/utils/formatPrice";
import { useAlert } from "@/shared/components/alert/useAlert";

import type { WalletRechargeHistoryItem } from "@/features/wallet/types/response";

const EMPTY_FORM = { email: "", amount: "", description: "" };

// Modulo RehniCoin (ver ALCANCE > MODULO REHNICOIN) - exclusivo
// ADMIN/OWNER: solo se agrega a la navegacion de esos dos roles (ver
// dashboardNavigation.tsx). El backend vuelve a validar el rol en cada
// endpoint (ver AdminWalletRouter.py), esta vista no es la unica
// barrera de seguridad.
export default function RehniCoin() {
  const { showAlert } = useAlert();

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [history, setHistory] = useState<WalletRechargeHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
  const isValid =
    form.email.trim() !== "" &&
    form.amount.trim() !== "" &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0;

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

      // La recarga recien hecha siempre queda primera (orden por fecha
      // desc en el backend, ver WalletRepository.list_recharge_history) -
      // volver a la pagina 1 para verla sin que el usuario tenga que
      // navegar manualmente.
      if (page === 1) {
        await loadHistory(1);
      } else {
        setPage(1);
      }
    } catch (error) {
      console.error("Error recargando RehniCoin:", error);

      // Mismo criterio que el resto del flujo de compra (ver
      // ProductDetail.tsx): mensaje real de la API vía AlertMessage,
      // nunca alert()/confirm() del navegador.
      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail?.message
        : undefined;

      showAlert("error", message ?? "No se pudo recargar el saldo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">RehniCoin</h1>

      <p className="mt-2 text-gray-500">
        Recarga saldo de RehniCoin a un usuario registrado. 1 RehniCoin = 1
        COP - es una billetera interna simulada, no una criptomoneda real.
      </p>

      {/* FORMULARIO DE RECARGA */}
      <div className="mt-6 rounded-2xl border bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
          <Coins size={18} className="text-[#6D0F2D]" />
          Recargar saldo
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm text-gray-700">
              Correo del usuario
            </label>

            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="usuario@email.com"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-[#6D0F2D]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-gray-700">
              Cantidad (RC)
            </label>

            <input
              type="text"
              inputMode="numeric"
              value={form.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-[#6D0F2D]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-gray-700">
              Descripción (opcional)
            </label>

            <input
              type="text"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Ej. Recarga administrativa"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-[#6D0F2D]"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving || !isValid}
          className="mt-6 rounded-xl bg-[#7A1833] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#64132a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Recargando..." : "Recargar saldo"}
        </button>
      </div>

      {/* HISTORIAL */}
      <div className="mt-8">
        <h2 className="mb-4 font-semibold text-gray-900">
          Últimas recargas
        </h2>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white">
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Usuario</th>
                  <th className="px-5 py-3 font-medium">Correo</th>
                  <th className="px-5 py-3 font-medium">Monto</th>
                  <th className="px-5 py-3 font-medium">Administrador responsable</th>
                </tr>
              </thead>

              <tbody>
                {historyLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">
                      Cargando historial...
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">
                      Todavía no se han registrado recargas.
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

                      <td className="px-5 py-3 text-sm font-semibold text-[#6D0F2D]">
                        {formatPrice(item.amount)} RC
                      </td>

                      <td className="px-5 py-3 text-sm text-gray-600">
                        {item.createdByName ?? "—"}
                        {item.createdByEmail ? ` (${item.createdByEmail})` : ""}
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
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-xl border px-4 py-2 disabled:opacity-50"
            >
              Anterior
            </button>

            <span className="text-sm text-gray-600">
              Página {page} de {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border px-4 py-2 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
