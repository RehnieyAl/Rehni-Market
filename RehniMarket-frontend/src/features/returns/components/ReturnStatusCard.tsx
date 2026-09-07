import { RotateCcw } from "lucide-react";

import { Badge } from "@/shared/components/ui";
import { formatPrice } from "@/shared/utils/formatPrice";

import { RETURN_STATUS_LABEL, RETURN_STATUS_TONE } from "../utils/returnStatus";
import type { OrderItemReturn } from "../types/response";

interface ReturnStatusCardProps {
  data: OrderItemReturn;
}

/** Estado de la devolución de un ítem, visto por el comprador dentro del detalle del pedido. */
export default function ReturnStatusCard({ data }: ReturnStatusCardProps) {
  return (
    <div className="mt-2 rounded-control border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-center gap-2">
        <RotateCcw size={14} className="text-gray-500" />
        <span className="text-xs font-medium text-gray-700">Devolución solicitada</span>
        <Badge tone={RETURN_STATUS_TONE[data.status]}>
          {RETURN_STATUS_LABEL[data.status]}
        </Badge>
      </div>

      <p className="mt-1.5 text-xs text-gray-500">
        Motivo: <span className="text-gray-700">{data.reason}</span>
      </p>

      {data.status === "approved" && data.refundAmount && (
        <p className="mt-1 text-xs font-medium text-success">
          Reembolso acreditado en RehniCoin: {formatPrice(data.refundAmount)}
        </p>
      )}

      {data.status === "rejected" && data.companyResponse && (
        <p className="mt-1 text-xs text-danger">
          Motivo del rechazo: <span className="font-medium">{data.companyResponse}</span>
        </p>
      )}
    </div>
  );
}
