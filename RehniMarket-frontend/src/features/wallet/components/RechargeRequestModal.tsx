import { useState } from "react";
import { Coins, MessageCircle, X } from "lucide-react";

import { useAlert } from "@/shared/components/alert/useAlert";
import { formatPrice } from "@/shared/utils/formatPrice";
import { buildRechargeWhatsappUrl } from "../utils/rechargeWhatsapp";

interface RechargeRequestModalProps {
  isOpen: boolean;
  userName: string;
  userEmail: string;
  onClose: () => void;
}

// Montos de referencia; el backend solo exige amount > 0.
const PRESET_AMOUNTS = [10000, 20000, 50000, 100000];

function validateAmount(rawValue: string): string | null {
  const value = rawValue.trim();

  if (!value) return "Ingresa la cantidad de RehniCoins que quieres solicitar.";

  // Solo entero positivo: rechaza no numéricos, negativos y decimales.
  if (!/^\d+$/.test(value)) return "Ingresa solo números, sin letras ni símbolos.";

  if (Number(value) <= 0) return "La cantidad debe ser mayor a cero.";

  return null;
}

// Solicitud de recarga vía WhatsApp: no llama a ningún endpoint, solo arma un mensaje y abre WhatsApp.
// El saldo lo acredita luego un admin/owner tras verificar el pago.
export default function RechargeRequestModal({
  isOpen,
  userName,
  userEmail,
  onClose,
}: RechargeRequestModalProps) {
  const { showAlert } = useAlert();

  const [amount, setAmount] = useState("");

  if (!isOpen) return null;

  const validationError = validateAmount(amount);
  const isValid = validationError === null;

  const handleClose = () => {
    setAmount("");
    onClose();
  };

  const handleConfirm = () => {
    if (!isValid) {
      showAlert("error", validationError as string);
      return;
    }

    const parsedAmount = Number(amount.trim());

    const url = buildRechargeWhatsappUrl({
      amount: parsedAmount,
      userName,
      userEmail,
    });

    // VITE_REHNIMARKET_WHATSAPP sin configurar: se avisa por alerta en vez de abrir una URL rota.
    if (!url) {
      showAlert(
        "error",
        "No se pudo abrir WhatsApp: falta configurar el número de contacto de RehniMarket.",
      );
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");

    // Nunca "Recarga exitosa": aquí solo se abrió WhatsApp, el saldo no cambió.
    showAlert("success", "Solicitud de recarga preparada. Continúa la conversación en WhatsApp.");

    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Coins size={20} className="text-primary" />
            Recargar RehniCoins
          </h2>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <p className="text-sm text-gray-500">
            Elige la cantidad de RehniCoins que quieres solicitar. Te
            atenderemos por WhatsApp para confirmar el pago - 1 RehniCoin
            equivale a 1 COP.
          </p>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Cantidad
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                    amount === String(preset)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {formatPrice(preset)} RC
                </button>
              ))}
            </div>

            <div className="mt-3">
              <label className="mb-1.5 block text-sm text-gray-700">
                Otra cantidad
              </label>

              <input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ej. 30000"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-brand-600"
              />

              {amount.trim() !== "" && validationError && (
                <p className="mt-1.5 text-xs text-red-600">{validationError}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MessageCircle size={16} />
            Confirmar solicitud
          </button>
        </div>
      </div>
    </div>
  );
}
