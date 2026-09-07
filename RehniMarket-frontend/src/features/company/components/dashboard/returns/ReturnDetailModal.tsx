import { useEffect, useState } from "react";
import axios from "axios";
import { Check, Mail, RotateCcw, X } from "lucide-react";

import { Badge, Button, Modal, Spinner, Textarea } from "@/shared/components/ui";
import ConfirmModal from "@/shared/components/ConfirmModal";
import { useAlert } from "@/shared/components/alert/useAlert";
import { formatPrice } from "@/shared/utils/formatPrice";

import {
  getCompanyReturnDetail,
  decideCompanyReturn,
} from "@/features/company/api/returnService";
import {
  RETURN_STATUS_LABEL,
  RETURN_STATUS_TONE,
} from "@/features/returns/utils/returnStatus";

import type { ReturnRequest } from "@/features/returns/types/response";

interface ReturnDetailModalProps {
  returnId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onResolved: () => void;
}

const MIN_REASON = 5;

export default function ReturnDetailModal({
  returnId,
  isOpen,
  onClose,
  onResolved,
}: ReturnDetailModalProps) {
  const { showAlert } = useAlert();

  const [detail, setDetail] = useState<ReturnRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    if (!isOpen || !returnId) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setDetail(null);
        setRejectReason("");
        const data = await getCompanyReturnDetail(returnId);
        if (!cancelled) setDetail(data);
      } catch (error) {
        console.error("Error cargando la devolución:", error);
        const message = axios.isAxiosError(error)
          ? error.response?.data?.detail?.message
          : undefined;
        showAlert("error", message ?? "No se pudo cargar la solicitud de devolución.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [isOpen, returnId]);

  const runDecision = async (
    action: "approve" | "reject",
    reason?: string,
  ) => {
    if (!detail) return;

    const setBusy = action === "approve" ? setApproving : setRejecting;

    try {
      setBusy(true);
      const updated = await decideCompanyReturn(detail.id, { action, reason });
      setDetail(updated);
      setRejectOpen(false);
      showAlert(
        "success",
        action === "approve"
          ? `Devolución aprobada. Se reintegraron ${formatPrice(updated.refundAmount ?? 0)} en RehniCoin.`
          : "Devolución rechazada.",
      );
      onResolved();
    } catch (error) {
      console.error("Error evaluando la devolución:", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail?.message
        : undefined;
      showAlert("error", message ?? "No se pudo procesar la solicitud.");
    } finally {
      setBusy(false);
    }
  };

  const isPending = detail?.status === "pending";
  const rejectValid = rejectReason.trim().length >= MIN_REASON;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        title={detail ? `Devolución · ${detail.orderReference}` : "Devolución"}
        busy={approving || rejecting}
        footer={
          isPending ? (
            <>
              <Button
                variant="danger"
                leadingIcon={<X size={16} />}
                disabled={approving || rejecting}
                onClick={() => setRejectOpen(true)}
              >
                Rechazar devolución
              </Button>
              <Button
                leadingIcon={<Check size={16} />}
                loading={approving}
                disabled={rejecting}
                onClick={() => runDecision("approve")}
              >
                Aprobar devolución
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          )
        }
      >
        {loading || !detail ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Spinner /> Cargando solicitud…
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Badge tone={RETURN_STATUS_TONE[detail.status]}>
                {RETURN_STATUS_LABEL[detail.status]}
              </Badge>
              <span className="text-sm text-gray-500">
                {new Date(detail.createdAt).toLocaleString("es-CO")}
              </span>
            </div>

            <section className="rounded-card border border-gray-200 bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">{detail.buyerName}</p>
              <p className="flex items-center gap-1.5 text-sm text-gray-600">
                <Mail size={14} />
                {detail.buyerEmail}
              </p>
            </section>

            <section>
              <h3 className="mb-2 font-semibold text-gray-900">Producto</h3>
              <div className="rounded-card border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-900">{detail.productName}</p>
                {detail.variantName && (
                  <p className="text-xs text-gray-500">{detail.variantName}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {detail.quantity} × {formatPrice(detail.unitPrice)} ={" "}
                  <span className="font-medium text-gray-700">
                    {formatPrice(detail.itemSubtotal)}
                  </span>
                </p>
              </div>
            </section>

            <section>
              <h3 className="mb-2 flex items-center gap-1.5 font-semibold text-gray-900">
                <RotateCcw size={15} /> Motivo del comprador
              </h3>
              <p className="rounded-card border border-gray-200 bg-white p-4 text-sm text-gray-600">
                {detail.reason}
              </p>
            </section>

            {detail.status === "approved" && detail.refundAmount && (
              <p className="rounded-card border border-success/30 bg-success-bg p-4 text-sm font-medium text-success">
                Reembolso reintegrado en RehniCoin: {formatPrice(detail.refundAmount)}
              </p>
            )}

            {detail.status === "rejected" && detail.companyResponse && (
              <section>
                <h3 className="mb-2 font-semibold text-gray-900">Motivo del rechazo</h3>
                <p className="rounded-card border border-danger/30 bg-danger-bg p-4 text-sm text-danger">
                  {detail.companyResponse}
                </p>
              </section>
            )}
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={rejectOpen}
        tone="danger"
        title="Rechazar devolución"
        confirmLabel="Rechazar devolución"
        loading={rejecting}
        confirmDisabled={!rejectValid}
        onClose={() => setRejectOpen(false)}
        onConfirm={() => runDecision("reject", rejectReason.trim())}
        message={
          <div className="space-y-3">
            <p>Indícale al comprador por qué no se aprueba la devolución. Este mensaje es obligatorio y se le mostrará.</p>
            <Textarea
              label="Motivo del rechazo"
              required
              rows={4}
              maxLength={500}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ej. El producto presenta daños causados por el comprador."
              error={
                rejectReason.length > 0 && !rejectValid
                  ? "Describe el motivo con un poco más de detalle."
                  : undefined
              }
            />
          </div>
        }
      />
    </>
  );
}
