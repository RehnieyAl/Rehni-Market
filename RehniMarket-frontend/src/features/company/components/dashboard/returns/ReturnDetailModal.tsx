/** Detalle de una reclamación para la empresa: comprador, producto, motivo, respuestas, historial y la
 * decisión (aprobar con reembolso confirmado o rechazar con motivo), con asunto y explicación del correo. */
import { useEffect, useState } from "react";
import { Check, Mail, RotateCcw, X } from "lucide-react";

import { Badge, Button, Modal, Spinner } from "@/shared/components/ui";
import { useAlert } from "@/shared/components/alert/useAlert";
import { formatPrice } from "@/shared/utils/formatPrice";
import ReturnTimeline from "@/features/returns/components/ReturnTimeline";
import ReturnDecisionForm, { type DecisionValues } from "@/features/returns/components/ReturnDecisionForm";
import { RETURN_STATUS_LABEL, RETURN_STATUS_TONE, formatDateTime } from "@/features/returns/utils/returnStatus";
import { decideCompanyReturn, getCompanyReturnDetail } from "@/features/company/api/returnService";

import type { ReturnDecision, ReturnDetail } from "@/features/returns/types/response";

interface ReturnDetailModalProps {
  returnId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onResolved: () => void;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-ink">{title}</h3>
      {children}
    </section>
  );
}

export default function ReturnDetailModal({ returnId, isOpen, onClose, onResolved }: ReturnDetailModalProps) {
  const { showAlert } = useAlert();

  const [detail, setDetail] = useState<ReturnDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<ReturnDecision | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !returnId) return;
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setDetail(null);
        const data = await getCompanyReturnDetail(returnId);
        if (!cancelled) setDetail(data);
      } catch (error) {
        console.error("Error cargando la devolución:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, returnId]);

  const submitDecision = async (values: DecisionValues) => {
    if (!detail || !decision) return;
    try {
      setSaving(true);
      const updated = await decideCompanyReturn(detail.id, {
        action: decision,
        subject: values.subject,
        reason: values.message || undefined,
      });
      setDetail(updated);
      setDecision(null);
      showAlert(
        "success",
        decision === "approve"
          ? `Devolución aprobada. Se reintegraron ${formatPrice(updated.refundAmount ?? 0)} en RehniCoin.`
          : "Devolución rechazada. Le avisamos al comprador por correo.",
      );
      onResolved();
    } catch (error) {
      console.error("Error evaluando la devolución:", error);
    } finally {
      setSaving(false);
    }
  };

  const isPending = detail?.status === "pending";

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        title={detail ? `Devolución · ${detail.orderReference}` : "Devolución"}
        description={detail?.reference}
        footer={
          isPending ? (
            <>
              <Button variant="danger" leadingIcon={<X size={16} />} onClick={() => setDecision("reject")}>
                Rechazar devolución
              </Button>
              <Button leadingIcon={<Check size={16} />} onClick={() => setDecision("approve")}>
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
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink-muted">
            <Spinner /> Cargando solicitud…
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge tone={RETURN_STATUS_TONE[detail.status]}>{RETURN_STATUS_LABEL[detail.status]}</Badge>
              <span className="text-sm text-ink-muted">{formatDateTime(detail.createdAt)}</span>
            </div>

            {detail.status === "under_review" && (
              <p className="rounded-card border border-info/30 bg-info-bg p-3 text-sm text-info">
                El equipo de Rehni Market está revisando esta solicitud; la decisión final la toma la plataforma.
              </p>
            )}

            <section className="rounded-card border border-hairline bg-surface-2 p-4">
              <p className="font-semibold text-ink">{detail.buyerName}</p>
              <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                <Mail size={14} aria-hidden="true" />
                {detail.buyerEmail}
              </p>
            </section>

            <Block title="Producto">
              <div className="rounded-card border border-hairline p-4">
                <p className="text-sm font-medium text-ink">{detail.productName}</p>
                {detail.variantName && <p className="text-xs text-ink-muted">{detail.variantName}</p>}
                <p className="mt-1 text-xs text-ink-muted">
                  {detail.quantity} × {formatPrice(detail.unitPrice)} = {formatPrice(detail.itemSubtotal)}
                  {detail.refundableAmount && ` · Pagado con IVA: ${formatPrice(detail.refundableAmount)}`}
                </p>
              </div>
            </Block>

            <Block title="Motivo del comprador">
              <p className="flex gap-2 whitespace-pre-line break-words rounded-card border border-hairline bg-surface-1 p-4 text-sm text-ink-muted">
                <RotateCcw size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                {detail.reason}
              </p>
            </Block>

            {detail.companyResponse && (
              <Block title={detail.decidedBy === "company" && detail.status === "approved" ? "Tu explicación" : "Tu motivo de rechazo"}>
                <div className="rounded-card border border-hairline bg-surface-1 p-4 text-sm text-ink-muted">
                  {detail.companySubject && <p className="mb-1 font-medium text-ink">{detail.companySubject}</p>}
                  <p className="whitespace-pre-line break-words">{detail.companyResponse}</p>
                </div>
              </Block>
            )}

            {detail.adminResponse && (
              <Block title="Decisión de Rehni Market">
                <p className="whitespace-pre-line break-words rounded-card border border-hairline bg-surface-1 p-4 text-sm text-ink-muted">
                  {detail.adminResponse}
                </p>
              </Block>
            )}

            {detail.status === "approved" && detail.refundAmount && (
              <p className="rounded-card border border-success/30 bg-success-bg p-4 text-sm font-medium text-success">
                Reembolso reintegrado en RehniCoin: {formatPrice(detail.refundAmount)}. Se descontará de tus ventas en la
                próxima liquidación.
              </p>
            )}

            <Block title="Historial">
              <ReturnTimeline events={detail.events} />
            </Block>
          </div>
        )}
      </Modal>

      {detail && decision && (
        <ReturnDecisionForm
          isOpen
          action={decision}
          claimReference={detail.reference}
          orderReference={detail.orderReference}
          productName={detail.productName}
          refundableAmount={detail.refundableAmount}
          messageRequiredOnApprove={false}
          saving={saving}
          onClose={() => setDecision(null)}
          onSubmit={submitDecision}
        />
      )}
    </>
  );
}
