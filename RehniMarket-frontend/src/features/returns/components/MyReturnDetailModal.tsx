/** Detalle de una reclamación del comprador: producto, pedido, empresa, respuestas, reembolso e historial. */
import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";

import { Badge, Button, Modal, Spinner } from "@/shared/components/ui";
import { formatPrice } from "@/shared/utils/formatPrice";

import ReturnTimeline from "./ReturnTimeline";
import RequestReviewModal from "./RequestReviewModal";
import { getMyReturnDetail } from "../api/returnService";
import { RETURN_STATUS_LABEL, RETURN_STATUS_TONE, formatDateTime } from "../utils/returnStatus";
import type { ReturnDetail } from "../types/response";

interface MyReturnDetailModalProps {
  returnId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => void;
}

function Answer({ title, subject, text, tone }: { title: string; subject?: string | null; text: string; tone?: "danger" }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-ink">{title}</h3>
      <div className={`rounded-card border p-4 text-sm ${tone === "danger" ? "border-danger/30 bg-danger-bg text-danger" : "border-hairline bg-surface-2 text-ink-muted"}`}>
        {subject && <p className="mb-1 font-medium text-ink">{subject}</p>}
        <p className="whitespace-pre-line break-words">{text}</p>
      </div>
    </section>
  );
}

export default function MyReturnDetailModal({ returnId, isOpen, onClose, onChanged }: MyReturnDetailModalProps) {
  const [detail, setDetail] = useState<ReturnDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !returnId) return;
    let cancelled = false;

    const load = async () => {
      try {
        setDetail(null);
        setFailed(false);
        const data = await getMyReturnDetail(returnId);
        if (!cancelled) setDetail(data);
      } catch (error) {
        console.error("Error cargando la reclamación:", error);
        if (!cancelled) setFailed(true);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, returnId]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        title={detail ? `Devolución ${detail.reference}` : "Devolución"}
        description={detail ? `Pedido ${detail.orderReference} · ${detail.companyName}` : undefined}
        footer={
          <>
            {detail?.canRequestReview && (
              <Button variant="outline" leadingIcon={<MessageSquare size={16} />} onClick={() => setReviewOpen(true)}>
                Solicitar revisión
              </Button>
            )}
            <Button onClick={onClose}>Cerrar</Button>
          </>
        }
      >
        {failed ? (
          <p className="py-8 text-center text-sm text-danger">No se pudo cargar la reclamación.</p>
        ) : !detail ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink-muted">
            <Spinner /> Cargando reclamación…
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge tone={RETURN_STATUS_TONE[detail.status]}>{RETURN_STATUS_LABEL[detail.status]}</Badge>
              <span className="text-sm text-ink-muted">Solicitada el {formatDateTime(detail.createdAt)}</span>
            </div>

            <section className="rounded-card border border-hairline bg-surface-2 p-4">
              <p className="text-sm font-medium text-ink">
                {detail.productName}
                {detail.variantName && <span className="text-ink-muted"> · {detail.variantName}</span>}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                {detail.quantity} × {formatPrice(detail.unitPrice)} = {formatPrice(detail.itemSubtotal)}
              </p>
            </section>

            <Answer title="Tu motivo" text={detail.reason} />

            {detail.companyResponse && (
              <Answer
                title={detail.status === "approved" && detail.decidedBy === "company" ? "Respuesta de la empresa" : "Motivo del rechazo de la empresa"}
                subject={detail.companySubject}
                text={detail.companyResponse}
                tone={detail.status === "rejected" && detail.decidedBy === "company" ? "danger" : undefined}
              />
            )}

            {detail.reviewReason && <Answer title="Tu solicitud de revisión" text={detail.reviewReason} />}

            {detail.adminResponse && (
              <Answer title="Decisión de Rehni Market" subject={detail.adminSubject} text={detail.adminResponse} />
            )}

            {detail.status === "approved" && detail.refundAmount && (
              <p className="rounded-card border border-success/30 bg-success-bg p-4 text-sm font-medium text-success">
                Reembolso acreditado en tu billetera RehniCoin: {formatPrice(detail.refundAmount)}
              </p>
            )}

            <section>
              <h3 className="mb-3 text-sm font-semibold text-ink">Historial</h3>
              <ReturnTimeline events={detail.events} />
            </section>
          </div>
        )}
      </Modal>

      <RequestReviewModal
        key={reviewOpen ? "open" : "closed"}
        returnId={detail?.id ?? null}
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onRequested={(updated) => {
          setDetail(updated);
          onChanged();
        }}
      />
    </>
  );
}
