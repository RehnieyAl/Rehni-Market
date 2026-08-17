import { Check, X } from "lucide-react";

import type { OrderStatus } from "../types/response";

interface OrderTimelineProps {
  status: OrderStatus;
}

// 5 pasos pedidos (ver ALCANCE > Detalle de pedido): Pendiente, Pagado,
// En proceso, Enviado, Entregado. El backend real (ver
// OrderService.ALLOWED_TRANSITIONS) NUNCA pasa por PAID como un estado
// propio: el pago ocurre en el checkout, antes de que el pedido exista
// (ver ModelOrder.py > Order, docstring) - por eso "Pendiente" y
// "Pagado" se marcan alcanzados juntos, apenas el pedido existe, en vez
// de fingir una transición que nunca sucede.
const STEPS: { label: string; isReached: (status: OrderStatus) => boolean }[] = [
  { label: "Pendiente", isReached: () => true },
  { label: "Pagado", isReached: () => true },
  {
    label: "En proceso",
    isReached: (status) => ["processing", "shipped", "delivered"].includes(status),
  },
  { label: "Enviado", isReached: (status) => ["shipped", "delivered"].includes(status) },
  { label: "Entregado", isReached: (status) => status === "delivered" },
];

export default function OrderTimeline({ status }: OrderTimelineProps) {
  // Un pedido cancelado no "va en camino" a ningún paso futuro - mostrar
  // la barra de progreso igual sería engañoso (ver ALCANCE). Se muestra
  // un estado propio en su lugar.
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
          <X size={16} />
        </span>

        <p className="text-sm font-medium text-red-700">Este pedido fue cancelado.</p>
      </div>
    );
  }

  return (
    <div className="flex items-start">
      {STEPS.map((step, index) => {
        const reached = step.isReached(status);
        const isLast = index === STEPS.length - 1;

        return (
          <div key={step.label} className="flex flex-1 flex-col items-center last:flex-none">
            <div className="flex w-full items-center">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors sm:h-9 sm:w-9 ${
                  reached ? "bg-[#6D0F2D] text-white" : "bg-gray-100 text-gray-400"
                }`}
              >
                {reached ? <Check size={15} /> : index + 1}
              </span>

              {!isLast && (
                <span
                  className={`mx-1 h-0.5 flex-1 transition-colors sm:mx-2 ${
                    STEPS[index + 1].isReached(status) ? "bg-[#6D0F2D]" : "bg-gray-100"
                  }`}
                />
              )}
            </div>

            <span
              className={`mt-2 text-center text-[11px] font-medium sm:text-xs ${
                reached ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
