import { useState } from "react";
import { MessageCircle } from "lucide-react";

import { useAlert } from "@/shared/components/alert/useAlert";
import { formatPrice } from "@/shared/utils/formatPrice";
import { Button, Input, Modal } from "@/shared/components/ui";
import { buildRechargeWhatsappUrl } from "../utils/rechargeWhatsapp";

interface RechargeRequestModalProps {
  isOpen: boolean;
  userName: string;
  userEmail: string;
  onClose: () => void;
}

const PRESET_AMOUNTS = [10000, 20000, 50000, 100000];

function validateAmount(rawValue: string): string | null {
  const value = rawValue.trim();

  if (!value) return "Ingresa la cantidad de RehniCoins que quieres solicitar.";

  if (!/^\d+$/.test(value)) return "Ingresa solo números, sin letras ni símbolos.";

  if (Number(value) <= 0) return "La cantidad debe ser mayor a cero.";

  return null;
}

export default function RechargeRequestModal({
  isOpen,
  userName,
  userEmail,
  onClose,
}: RechargeRequestModalProps) {
  const { showAlert } = useAlert();

  const [amount, setAmount] = useState("");

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

    if (!url) {
      showAlert(
        "error",
        "No se pudo abrir WhatsApp: falta configurar el número de contacto de RehniMarket.",
      );
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");

    showAlert("success", "Solicitud de recarga preparada. Continúa la conversación en WhatsApp.");

    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Recargar RehniCoins"
      description="1 RehniCoin equivale a 1 COP. Confirmamos el pago por WhatsApp."
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>

          <Button
            disabled={!isValid}
            leadingIcon={<MessageCircle size={16} />}
            onClick={handleConfirm}
          >
            Confirmar solicitud
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Cantidad</p>

          <div className="grid grid-cols-2 gap-2.5">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset))}
                className={`rounded-control border px-4 py-2.5 text-sm font-medium transition ${
                  amount === String(preset)
                    ? "border-primary bg-brand-50 text-primary"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {formatPrice(preset)} RC
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Otra cantidad"
          type="text"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Ej. 30000"
          error={amount.trim() !== "" ? validationError ?? undefined : undefined}
        />
      </div>
    </Modal>
  );
}
