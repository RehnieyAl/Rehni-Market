import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import Modal from "@/shared/components/ui/Modal";
import Button from "@/shared/components/ui/Button";
import type { ButtonVariant } from "@/shared/components/ui/buttonVariants";
import { cn } from "@/shared/utils/cn";

export type ConfirmTone = "danger" | "success" | "warning" | "brand";

const TONE: Record<
  ConfirmTone,
  { iconWrap: string; icon: ReactNode; confirm: ButtonVariant }
> = {
  danger: {
    iconWrap: "bg-danger-bg text-danger",
    icon: <AlertTriangle size={22} />,
    confirm: "danger",
  },
  warning: {
    iconWrap: "bg-warning-bg text-warning",
    icon: <AlertTriangle size={22} />,
    confirm: "primary",
  },
  success: {
    iconWrap: "bg-success-bg text-success",
    icon: <CheckCircle2 size={22} />,
    confirm: "primary",
  },
  brand: {
    iconWrap: "bg-brand-50 text-primary",
    icon: <Info size={22} />,
    confirm: "primary",
  },
};

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  tone?: ConfirmTone;
  icon?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

// Confirmación de acciones críticas. Construida sobre el Modal base.
// `message` acepta ReactNode: las variantes con contenido extra (motivo de
// suspensión, datos bancarios, avisos) lo pasan aquí.
export default function ConfirmModal({
  isOpen,
  title,
  message,
  tone = "danger",
  icon,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading = false,
  confirmDisabled = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const toneConfig = TONE[tone];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      busy={loading}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={toneConfig.confirm}
            onClick={onConfirm}
            loading={loading}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
            toneConfig.iconWrap,
          )}
        >
          {icon ?? toneConfig.icon}
        </div>

        <div className="min-w-0 flex-1 text-sm leading-6 text-gray-600">{message}</div>
      </div>
    </Modal>
  );
}
