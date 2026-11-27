/** Detalle administrativo de una reclamación: empresa responsable con su contacto, pedido, respuestas,
 * reembolso y compensación en liquidaciones, historial, estado de cada correo y acciones de gestión. */
import { useEffect, useState } from "react";
import { Check, Mail, Phone, RefreshCw, ShieldAlert, X } from "lucide-react";

import { Badge, Button, Modal, Spinner } from "@/shared/components/ui";
import { useAlert } from "@/shared/components/alert/useAlert";
import { formatPrice } from "@/shared/utils/formatPrice";
import ReturnTimeline from "@/features/returns/components/ReturnTimeline";
import ReturnDecisionForm, { type DecisionValues } from "@/features/returns/components/ReturnDecisionForm";
import { ADMIN_TEXT_MAX } from "@/features/returns/utils/validation";
import { RETURN_STATUS_LABEL, RETURN_STATUS_TONE, formatDateTime } from "@/features/returns/utils/returnStatus";
import {
  contactCompany,
  decideReturnAsAdmin,
  escalateReturn,
  getAdminReturnDetail,
  registerCall,
  retryReturnNotification,
} from "@/features/admin/api/returnService";
import AdminReturnActionModal, { type AdminAction, type AdminActionPayload } from "./AdminReturnActionModal";

import type { AdminReturnDetail, NotificationStatus, ReturnDecision } from "@/features/returns/types/response";

interface AdminReturnDetailModalProps {
  returnId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => void;
}

const NOTIFICATION_LABEL: Record<NotificationStatus, string> = {
  pending: "En cola",
  sending: "Enviándose",
  accepted: "Aceptado por el servidor de correo",
  failed: "Falló",
};

const NOTIFICATION_TONE: Record<NotificationStatus, "neutral" | "info" | "success" | "danger"> = {
  pending: "neutral",
  sending: "info",
  accepted: "success",
  failed: "danger",
};

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="break-words text-sm text-ink">{value ?? <span className="text-ink-muted">No registrado</span>}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-ink">{title}</h3>
      {children}
    </section>
  );
}

export default function AdminReturnDetailModal({ returnId, isOpen, onClose, onChanged }: AdminReturnDetailModalProps) {
  const { showAlert } = useAlert();
  const [detail, setDetail] = useState<AdminReturnDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [action, setAction] = useState<AdminAction | null>(null);
  const [decision, setDecision] = useState<ReturnDecision | null>(null);
  const [saving, setSaving] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !returnId) return;
    let cancelled = false;

    const load = async () => {
      try {
        setDetail(null);
        setFailed(false);
        const data = await getAdminReturnDetail(returnId);
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

  const run = async (operation: () => Promise<AdminReturnDetail>, success: string) => {
    try {
      setSaving(true);
      setDetail(await operation());
      setAction(null);
      setDecision(null);
      showAlert("success", success);
      onChanged();
    } catch (error) {
      console.error("Error gestionando la reclamación:", error);
    } finally {
      setSaving(false);
    }
  };

  const submitAction = (payload: AdminActionPayload) => {
    if (!detail) return;
    if (payload.action === "escalate") {
      void run(() => escalateReturn(detail.id, payload.reason), "Tomaste el caso. Ahora puedes decidirlo.");
    } else if (payload.action === "contact") {
      const { channel, subject, message } = payload;
      void run(() => contactCompany(detail.id, { channel, subject, message }), "Correo registrado y enviado a la empresa.");
    } else {
      const { calledAt, outcome, notes } = payload;
      void run(() => registerCall(detail.id, { calledAt, outcome, notes }), "Llamada registrada.");
    }
  };

  const submitDecision = (values: DecisionValues) => {
    if (!detail || !decision) return;
    void run(
      () => decideReturnAsAdmin(detail.id, { action: decision, subject: values.subject, message: values.message }),
      decision === "approve" ? "Devolución aprobada y reembolsada en RehniCoin." : "Devolución rechazada.",
    );
  };

  const retry = async (notificationId: string) => {
    if (!detail) return;
    try {
      setRetryingId(notificationId);
      setDetail(await retryReturnNotification(detail.id, notificationId));
    } catch (error) {
      console.error("Error reintentando el correo:", error);
    } finally {
      setRetryingId(null);
    }
  };

  const canEscalate = detail && (detail.status === "pending" || detail.canRequestReview);
  const canDecide = detail?.status === "under_review";

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        title={detail ? `Reclamación ${detail.reference}` : "Reclamación"}
        description={detail ? `Pedido ${detail.orderReference} · ${detail.productName}` : undefined}
        footer={
          detail && (
            <div className="flex w-full flex-wrap justify-end gap-2">
              <Button variant="outline" size="sm" leadingIcon={<Mail size={15} />} onClick={() => setAction("contact")}>
                Contactar empresa
              </Button>
              <Button variant="outline" size="sm" leadingIcon={<Phone size={15} />} onClick={() => setAction("call")}>
                Registrar llamada
              </Button>
              {canEscalate && (
                <Button size="sm" leadingIcon={<ShieldAlert size={15} />} onClick={() => setAction("escalate")}>
                  Tomar el caso
                </Button>
              )}
              {canDecide && (
                <>
                  <Button variant="danger" size="sm" leadingIcon={<X size={15} />} onClick={() => setDecision("reject")}>
                    Rechazar
                  </Button>
                  <Button size="sm" leadingIcon={<Check size={15} />} onClick={() => setDecision("approve")}>
                    Aprobar y reembolsar
                  </Button>
                </>
              )}
            </div>
          )
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
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={RETURN_STATUS_TONE[detail.status]}>{RETURN_STATUS_LABEL[detail.status]}</Badge>
              {!detail.company.companyActive && <Badge tone="danger">Empresa suspendida</Badge>}
              <span className="ml-auto text-sm text-ink-muted">Solicitada el {formatDateTime(detail.createdAt)}</span>
            </div>

            <Section title="Empresa responsable">
              <dl className="grid gap-4 rounded-card border border-hairline bg-surface-2 p-4 sm:grid-cols-2">
                <Field label="Empresa" value={detail.company.companyName} />
                <Field label="NIT" value={detail.company.nit} />
                <Field label="Correo de contacto empresarial" value={detail.company.contactEmail} />
                <Field label="Teléfono de contacto empresarial" value={detail.company.contactPhone} />
                <Field label="Representante (solo administración)" value={detail.company.representativeName} />
                <Field
                  label="Cuenta del representante"
                  value={[detail.company.representativeEmail, detail.company.representativePhone].filter(Boolean).join(" · ")}
                />
              </dl>
            </Section>

            <Section title="Comprador y producto">
              <dl className="grid gap-4 rounded-card border border-hairline p-4 sm:grid-cols-2">
                <Field label="Comprador" value={`${detail.buyerName} · ${detail.buyerEmail}`} />
                <Field
                  label="Producto"
                  value={`${detail.quantity} × ${detail.productName}${detail.variantName ? ` (${detail.variantName})` : ""}`}
                />
                <Field label="Pagado (subtotal + IVA)" value={detail.refundableAmount ? formatPrice(detail.refundableAmount) : null} />
                <Field
                  label="Reembolso"
                  value={
                    detail.refundAmount
                      ? `${formatPrice(detail.refundAmount)} · ${detail.payoutAdjustmentId ? "descontado en una liquidación" : "pendiente de descontar en la próxima liquidación"}`
                      : "Sin reembolso"
                  }
                />
              </dl>
            </Section>

            <Section title="Motivo del comprador">
              <p className="whitespace-pre-line break-words rounded-card border border-hairline p-4 text-sm text-ink-muted">{detail.reason}</p>
            </Section>

            {detail.companyResponse && (
              <Section title="Respuesta de la empresa">
                <div className="rounded-card border border-hairline p-4 text-sm text-ink-muted">
                  {detail.companySubject && <p className="mb-1 font-medium text-ink">{detail.companySubject}</p>}
                  <p className="whitespace-pre-line break-words">{detail.companyResponse}</p>
                </div>
              </Section>
            )}

            {detail.reviewReason && (
              <Section title="Revisión solicitada por el comprador">
                <p className="whitespace-pre-line break-words rounded-card border border-hairline p-4 text-sm text-ink-muted">{detail.reviewReason}</p>
              </Section>
            )}

            {detail.adminResponse && (
              <Section title="Decisión de Rehni Market">
                <div className="rounded-card border border-hairline p-4 text-sm text-ink-muted">
                  {detail.adminSubject && <p className="mb-1 font-medium text-ink">{detail.adminSubject}</p>}
                  <p className="whitespace-pre-line break-words">{detail.adminResponse}</p>
                </div>
              </Section>
            )}

            <Section title="Historial">
              <ReturnTimeline events={detail.events} />
            </Section>

            <Section title="Correos">
              {detail.notifications.length === 0 ? (
                <p className="text-sm text-ink-muted">Sin correos registrados.</p>
              ) : (
                <ul className="space-y-2">
                  {detail.notifications.map((notification) => (
                    <li key={notification.id} className="flex flex-wrap items-center gap-2 rounded-card border border-hairline p-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink">{notification.subject}</p>
                        <p className="text-xs text-ink-muted">
                          Para {notification.recipientEmail} · {formatDateTime(notification.createdAt)} · intentos: {notification.attempts}
                        </p>
                        {notification.lastError && <p className="text-xs text-danger">{notification.lastError}</p>}
                      </div>
                      <Badge tone={NOTIFICATION_TONE[notification.status]}>{NOTIFICATION_LABEL[notification.status]}</Badge>
                      {notification.status === "failed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          leadingIcon={<RefreshCw size={14} />}
                          loading={retryingId === notification.id}
                          onClick={() => void retry(notification.id)}
                          aria-label={`Reintentar el correo «${notification.subject}»`}
                        >
                          Reintentar
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        )}
      </Modal>

      {detail && action && (
        <AdminReturnActionModal
          action={action}
          company={detail.company}
          claimReference={detail.reference}
          orderReference={detail.orderReference}
          saving={saving}
          onClose={() => setAction(null)}
          onSubmit={submitAction}
        />
      )}

      {detail && decision && (
        <ReturnDecisionForm
          isOpen
          action={decision}
          claimReference={detail.reference}
          orderReference={detail.orderReference}
          productName={detail.productName}
          refundableAmount={detail.refundableAmount}
          messageRequiredOnApprove
          maxMessage={ADMIN_TEXT_MAX}
          saving={saving}
          onClose={() => setDecision(null)}
          onSubmit={submitDecision}
        />
      )}
    </>
  );
}
