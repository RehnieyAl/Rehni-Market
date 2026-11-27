/** Insignia del estado de verificación (certificado) de una empresa, en el panel y en el perfil público. */
import { AlertTriangle, BadgeCheck, Clock } from "lucide-react";

import { cn } from "@/shared/utils/cn";

import type { CompanyCertificateStatus } from "../types/response";

const STATES: Record<CompanyCertificateStatus, { label: string; className: string; icon: typeof BadgeCheck }> = {
  approved: { label: "Empresa verificada", className: "border-success/50 bg-success-bg text-success", icon: BadgeCheck },
  pending: { label: "Empresa pendiente de verificación", className: "border-warning/50 bg-warning-bg text-warning", icon: Clock },
  rejected: { label: "Empresa rechazada", className: "border-danger/50 bg-danger-bg text-danger", icon: AlertTriangle },
  needs_update: { label: "Certificado no válido", className: "border-danger/50 bg-danger-bg text-danger", icon: AlertTriangle },
};

export default function CompanyVerificationBadge({ status }: { status: CompanyCertificateStatus }) {
  const { label, className, icon: Icon } = STATES[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium", className)}>
      <Icon size={14} aria-hidden="true" />
      {label}
    </span>
  );
}
