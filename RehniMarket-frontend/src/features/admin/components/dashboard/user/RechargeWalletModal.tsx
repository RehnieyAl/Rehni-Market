import { useState } from "react";
import { Coins, X } from "lucide-react";
import axios from "axios";

import { rechargeWallet } from "@/features/wallet/api/walletService";
import {
  MAX_ADMIN_RECHARGE_AMOUNT,
  MAX_ADMIN_RECHARGE_AMOUNT_LABEL,
  MAX_ADMIN_RECHARGE_MESSAGE,
} from "@/features/wallet/constants";
import { useAlert } from "@/shared/components/alert/useAlert";
import { Button } from "@/shared/components/ui";

interface RechargeWalletModalProps {
  isOpen: boolean;
  userId: string;
  userName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RechargeWalletModal({
  isOpen,
  userId,
  userName,
  onClose,
  onSuccess,
}: RechargeWalletModalProps) {
  const { showAlert } = useAlert();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const parsedAmount = Number(amount);
  const amountFilled = amount.trim() !== "";
  const overLimit =
    amountFilled && Number.isFinite(parsedAmount) && parsedAmount > MAX_ADMIN_RECHARGE_AMOUNT;
  const isValid =
    amountFilled &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    parsedAmount <= MAX_ADMIN_RECHARGE_AMOUNT;

  const handleSubmit = async () => {
    if (!isValid) return;

    try {
      setSaving(true);
      await rechargeWallet(userId, parsedAmount, description || undefined);

      setAmount("");
      setDescription("");
      onSuccess?.();
      onClose();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-card bg-surface-1 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Coins size={20} className="text-primary" />
            Recargar RehniCoin
          </h2>

          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-6">
          <p className="text-sm text-gray-500">
            Recargando la billetera de <span className="font-medium text-gray-800">{userName}</span>.
          </p>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Monto (RC)
            </label>

            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              aria-invalid={overLimit || undefined}
              className={`w-full rounded-xl border px-4 py-2.5 outline-none ${
                overLimit ? "border-danger focus:border-danger" : "border-gray-300 focus:border-brand-600"
              }`}
            />

            {overLimit ? (
              <p className="mt-1.5 text-xs font-medium text-danger">
                {MAX_ADMIN_RECHARGE_MESSAGE}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-gray-500">
                Monto máximo de recarga: {MAX_ADMIN_RECHARGE_AMOUNT_LABEL}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Descripción (opcional)
            </label>

            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Recarga promocional"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-brand-600"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>

          <Button onClick={handleSubmit} disabled={!isValid} loading={saving}>
            Recargar
          </Button>
        </div>
      </div>
    </div>
  );
}
