/** Historial de una reclamación (lista ordenada de eventos). Lo usan comprador, empresa y administración;
 * cada API ya filtra los eventos que ese rol puede ver. */
import { CheckCircle2, Coins, Gavel, Mail, MessageSquare, Phone, RotateCcw, ShieldAlert, XCircle } from "lucide-react";
import type { ReactNode } from "react";

import { formatPrice } from "@/shared/utils/formatPrice";

import { CALL_OUTCOME_LABEL, RETURN_EVENT_LABEL, formatDateTime } from "../utils/returnStatus";
import type { ReturnEvent, ReturnEventType } from "../types/response";

const ICONS: Record<ReturnEventType, ReactNode> = {
  requested: <RotateCcw size={15} />,
  company_approved: <CheckCircle2 size={15} />,
  company_rejected: <XCircle size={15} />,
  refunded: <Coins size={15} />,
  review_requested: <MessageSquare size={15} />,
  escalated: <ShieldAlert size={15} />,
  admin_approved: <Gavel size={15} />,
  admin_rejected: <Gavel size={15} />,
  admin_email: <Mail size={15} />,
  admin_call: <Phone size={15} />,
};

export default function ReturnTimeline({ events }: { events: ReturnEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-ink-muted">Aún no hay movimientos en esta reclamación.</p>;
  }

  return (
    <ol className="space-y-4 border-l border-hairline pl-5">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span
            aria-hidden="true"
            className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border border-hairline bg-surface-2 text-secondary"
          >
            {ICONS[event.type]}
          </span>
          <p className="text-sm font-semibold text-ink">{RETURN_EVENT_LABEL[event.type]}</p>
          <p className="text-xs text-ink-muted">
            <time dateTime={event.createdAt}>{formatDateTime(event.createdAt)}</time>
            {event.actorName && ` · ${event.actorName}`}
          </p>
          {event.subject && <p className="mt-1 text-sm font-medium text-ink">{event.subject}</p>}
          {event.message && <p className="mt-1 whitespace-pre-line break-words text-sm text-ink-muted">{event.message}</p>}
          {event.amount && <p className="mt-1 text-sm font-medium text-success">{formatPrice(event.amount)}</p>}
          {event.callOutcome && (
            <p className="mt-1 text-xs text-ink-muted">
              Resultado: {CALL_OUTCOME_LABEL[event.callOutcome]}
              {event.occurredAt && ` · ${formatDateTime(event.occurredAt)}`}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
