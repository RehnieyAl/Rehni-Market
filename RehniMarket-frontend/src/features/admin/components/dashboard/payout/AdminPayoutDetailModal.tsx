import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import axios from "axios";

import PayoutDetailModal from "@/features/payouts/components/PayoutDetailModal";
import PayoutMarkPaidConfirmModal from "./PayoutMarkPaidConfirmModal";

import { getAdminPayoutDetail, markPayoutPaid } from "@/features/admin/api/payoutService";
import { formatPrice } from "@/shared/utils/formatPrice";
import { useAlert } from "@/shared/components/alert/useAlert";

import type { CompanyPayout } from "@/features/payouts/types/response";

interface AdminPayoutDetailModalProps {
  payoutId: string | null;
  isOpen: boolean;
  onClose: () => void;
  // Se llama tras marcar como pagada, para que la lista/tabs detrás se
  // refresquen.
  onPaid: () => void;
}

// Detalle de liquidación (admin): reutiliza PayoutDetailModal y agrega la acción "marcar como pagada".
export default function AdminPayoutDetailModal({
  payoutId,
  isOpen,
  onClose,
  onPaid,
}: AdminPayoutDetailModalProps) {
  const { showAlert } = useAlert();

  const [confirmTarget, setConfirmTarget] = useState<CompanyPayout | null>(null);
  const [marking, setMarking] = useState(false);

  const handleConfirmPay = async () => {
    if (!confirmTarget) return;

    try {
      setMarking(true);
      await markPayoutPaid(confirmTarget.id);

      showAlert("success", `Liquidación de ${confirmTarget.companyName ?? "la empresa"} marcada como pagada.`);

      setConfirmTarget(null);
      onClose();
      onPaid();
    } catch (error) {
      console.error("Error marcando liquidación como pagada:", error);

      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail?.message
        : undefined;

      showAlert("error", message ?? "No se pudo marcar la liquidación como pagada.");
    } finally {
      setMarking(false);
    }
  };

  return (
    <>
      <PayoutDetailModal
        payoutId={payoutId}
        isOpen={isOpen}
        onClose={onClose}
        fetchDetail={getAdminPayoutDetail}
        showCompanyName
        footer={(payout) =>
          payout.payoutStatus !== "paid" ? (
            <button
              onClick={() => setConfirmTarget(payout)}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
            >
              <CheckCircle2 size={16} />
              Marcar como pagada
            </button>
          ) : null
        }
      />

      <PayoutMarkPaidConfirmModal
        isOpen={confirmTarget !== null}
        companyName={confirmTarget?.companyName ?? "esta empresa"}
        netAmountLabel={confirmTarget ? formatPrice(confirmTarget.netAmount) : ""}
        bankAccount={confirmTarget?.bankAccount ?? null}
        loading={marking}
        onConfirm={handleConfirmPay}
        onClose={() => setConfirmTarget(null)}
      />
    </>
  );
}
