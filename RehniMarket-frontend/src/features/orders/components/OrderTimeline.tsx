import { Check, X } from "lucide-react";

import type { OrderStatus } from "../types/response";

interface OrderTimelineProps {
  status: OrderStatus;
}

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
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-3 rounded-card border border-danger/20 bg-danger-bg p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger text-white">
          <X size={16} />
        </span>

        <p className="text-sm font-medium text-danger">Este pedido fue cancelado.</p>
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
                  reached ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
                }`}
              >
                {reached ? <Check size={15} /> : index + 1}
              </span>

              {!isLast && (
                <span
                  className={`mx-1 h-0.5 flex-1 transition-colors sm:mx-2 ${
                    STEPS[index + 1].isReached(status) ? "bg-primary" : "bg-gray-100"
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
