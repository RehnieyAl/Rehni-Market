import { useState } from "react";
import { Coins, X } from "lucide-react";

import { rechargeWallet } from "@/features/wallet/api/walletService";

interface RechargeWalletModalProps {
  isOpen: boolean;
  userId: string;
  userName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

// RehniCoin: recarga de saldo exclusiva de ADMIN/OWNER (el backend lo
// vuelve a validar - ver WalletRouter.py). 1 RehniCoin = 1 COP, simulado.
export default function RechargeWalletModal({
  isOpen,
  userId,
  userName,
  onClose,
  onSuccess,
}: RechargeWalletModalProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const parsedAmount = Number(amount);
  const isValid = amount.trim() !== "" && Number.isFinite(parsedAmount) && parsedAmount > 0;

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
      alert("No se pudo recargar el saldo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Coins size={20} className="text-[#6D0F2D]" />
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
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-[#6D0F2D]"
            />
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
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-[#6D0F2D]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving || !isValid}
            className="rounded-xl bg-[#7A1833] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#64132a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Recargando..." : "Recargar"}
          </button>
        </div>
      </div>
    </div>
  );
}
