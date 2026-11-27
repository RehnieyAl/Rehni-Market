/** Sección "Certificado empresarial" de Mi tienda: estado real de la verificación y, si fue rechazada o no es
 * válida, el motivo y la acción que corresponde (sin exponer el documento ni su URL). */
import { Link } from "react-router-dom";
import { FileText, ShieldAlert, Upload } from "lucide-react";

import { Badge, type BadgeTone } from "@/shared/components/ui";
import { buttonClasses } from "@/shared/components/ui/buttonVariants";

import type { CompanyCertificateStatus as CertificateStatus } from "@/features/company/types/response";

const STATUS: Record<CertificateStatus, { label: string; tone: BadgeTone }> = {
  approved: { label: "Aprobado", tone: "success" },
  pending: { label: "Pendiente de revisión", tone: "warning" },
  rejected: { label: "Empresa rechazada", tone: "danger" },
  needs_update: { label: "Certificado no válido", tone: "danger" },
};

interface CompanyCertificateStatusProps {
  status: CertificateStatus;
  rejectionReason: string | null;
}

export default function CompanyCertificateStatus({ status, rejectionReason }: CompanyCertificateStatusProps) {
  const { label, tone } = STATUS[status];
  const failed = status === "rejected" || status === "needs_update";

  return (
    <section aria-labelledby="store-cert-title" className="rounded-card border border-hairline bg-surface-1 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-secondary/15 text-secondary">
          <FileText size={18} aria-hidden="true" />
        </span>
        <div>
          <h3 id="store-cert-title" className="text-lg font-semibold text-ink">
            Certificado empresarial
          </h3>
          <p className="mt-1 text-sm text-ink-muted">Estado de la verificación de tu empresa en RehniMarket.</p>
        </div>
      </div>

      <div className="mt-5">
        <Badge tone={tone} dot>
          {label}
        </Badge>

        {failed && (
          <div className="mt-4 rounded-card border border-danger/30 bg-danger-bg p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-danger">
              <ShieldAlert size={16} aria-hidden="true" />
              Motivo del rechazo
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-gray-700">
              {rejectionReason?.trim()
                ? rejectionReason.trim()
                : "El administrador no registró un motivo. Escribe a soporte de RehniMarket si necesitas más detalle."}
            </p>

            {status === "needs_update" ? (
              <Link to="/actualizar-certificado" className={buttonClasses({ className: "mt-4", size: "sm" })}>
                <Upload size={15} aria-hidden="true" />
                Actualizar certificado
              </Link>
            ) : (
              <p className="mt-3 text-xs text-gray-500">
                Este rechazo no se resuelve subiendo un nuevo certificado. Contacta con soporte de RehniMarket
                para que un administrador revise tu caso.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
