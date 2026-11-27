/** Estado de la reclamación de un ítem, visto por el comprador dentro del detalle del pedido. */
import { MessageSquare, RotateCcw } from "lucide-react";

import { Badge, Button } from "@/shared/components/ui";
import { formatPrice } from "@/shared/utils/formatPrice";

import { RETURN_STATUS_LABEL, RETURN_STATUS_TONE } from "../utils/returnStatus";
import type { OrderItemReturn } from "../types/response";

interface ReturnStatusCardProps {
  data: OrderItemReturn;
  onRequestReview?: () => void;
}

export default function ReturnStatusCard({ data, onRequestReview }: ReturnStatusCardProps) {
  return (
    <div className="mt-2 rounded-control border border-gray-200 bg-gray-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <RotateCcw size={14} className="text-gray-500" aria-hidden="true" />
        <span className="text-xs font-medium text-gray-700">Devolución solicitada</span>
        <Badge tone={RETURN_STATUS_TONE[data.status]}>{RETURN_STATUS_LABEL[data.status]}</Badge>
      </div>

      <p className="mt-1.5 text-xs text-gray-500">
        Motivo: <span className="text-gray-700">{data.reason}</span>
      </p>

      {data.status === "approved" && data.refundAmount && (
        <p className="mt-1 text-xs font-medium text-success">
          Reembolso acreditado en RehniCoin: {formatPrice(data.refundAmount)}
        </p>
      )}

      {data.companyResponse && (
        <p className={`mt-1 text-xs ${data.status === "rejected" && !data.adminResponse ? "text-danger" : "text-gray-600"}`}>
          {data.status === "approved" ? "Respuesta de la empresa" : "Motivo del rechazo"}:{" "}
          <span className="font-medium">{data.companyResponse}</span>
        </p>
      )}

      {data.status === "under_review" && (
        <p className="mt-1 text-xs text-info">El equipo de Rehni Market está revisando tu caso.</p>
      )}

      {data.adminResponse && (
        <p className="mt-1 text-xs text-gray-700">
          Decisión de Rehni Market: <span className="font-medium">{data.adminResponse}</span>
        </p>
      )}

      {data.canRequestReview && onRequestReview && (
        <Button
          size="sm"
          variant="outline"
          className="mt-2"
          leadingIcon={<MessageSquare size={14} />}
          onClick={onRequestReview}
        >
          Solicitar revisión
        </Button>
      )}
    </div>
  );
}
