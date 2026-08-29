import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/shared/utils/cn";
import type { AlertType } from "./AlertContext";

interface AlertMessageProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
}

const STYLES: Record<AlertType, { wrap: string; icon: ReactNode }> = {
  error: {
    wrap: "border-danger/30 bg-danger-bg text-danger",
    icon: <AlertCircle size={20} className="shrink-0" />,
  },
  success: {
    wrap: "border-success/30 bg-success-bg text-success",
    icon: <CheckCircle2 size={20} className="shrink-0" />,
  },
  warning: {
    wrap: "border-warning/30 bg-warning-bg text-warning",
    icon: <AlertTriangle size={20} className="shrink-0" />,
  },
  info: {
    wrap: "border-info/30 bg-info-bg text-info",
    icon: <Info size={20} className="shrink-0" />,
  },
};

// Toast global. Único patrón de alertas del sistema (ver AlertProvider).
export default function AlertMessage({ type, message, onClose }: AlertMessageProps) {
  const style = STYLES[type];

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className={cn(
        "animate-pop-in fixed left-1/2 top-6 z-[200] flex w-[92%] max-w-md -translate-x-1/2 items-start gap-3 rounded-card border px-4 py-3.5 shadow-pop",
        style.wrap,
      )}
    >
      {style.icon}

      <p className="flex-1 whitespace-pre-line text-sm font-medium leading-5">
        {message}
      </p>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar aviso"
          className="-mr-1 shrink-0 rounded p-0.5 transition hover:opacity-70"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
