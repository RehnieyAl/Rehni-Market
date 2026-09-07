import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Ban, FileUp, FileWarning, X } from "lucide-react";

const NO_REASON_MESSAGE =
  "El administrador no registró un motivo. Escribe a soporte de RehniMarket si necesitas más detalle.";

/** Estados del certificado en los que se muestra este aviso. `null` -> cerrado. */
export type CertificateNoticeStatus = "rejected" | "needs_update" | null;

interface CertificateRejectedModalProps {
  /**
   * Estado real del certificado (`certificateStatus` del backend). El modal solo
   * aparece con `"needs_update"` (el certificado no es válido y debe reemplazarse)
   * o `"rejected"` (rechazo terminal de la empresa).
   */
  status: CertificateNoticeStatus;
  /** Motivo real guardado por el admin (`rejectionReason` del backend). */
  reason: string | null;
  onClose: () => void;
}

/**
 * Modal que se muestra en la página de **login** cuando una empresa introduce
 * credenciales correctas pero la revisión de su certificado no fue favorable. El
 * backend interrumpe el login SIN emitir JWT (403 `COMPANY_CERTIFICATE_INVALID` /
 * `COMPANY_REJECTED`); este modal solo informa, no crea sesión.
 *
 * - `needs_update`: "Certificado no válido" + motivo real + botón "Actualizar
 *   certificado" → `/actualizar-certificado` (correo + contraseña + PDF, sin JWT,
 *   endpoint `POST /company/certificate/update`).
 * - `rejected`: "Empresa rechazada" (terminal) + motivo real + botón "Entendido".
 *   NO ofrece actualizar el certificado.
 */
export default function CertificateRejectedModal({
  status,
  reason,
  onClose,
}: CertificateRejectedModalProps) {
  const navigate = useNavigate();

  const open = status === "rejected" || status === "needs_update";
  const canReplace = status === "needs_update";

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, handleClose]);

  if (!open) return null;

  const trimmedReason = reason?.trim() ? reason.trim() : null;

  const title = canReplace ? "Certificado no válido" : "Empresa rechazada";

  const intro = canReplace
    ? "El certificado que presentaste no es válido. Debes subir uno nuevo para que tu empresa vuelva a revisión."
    : "Tu empresa no fue aprobada. Para volver a operar debe intervenir un administrador; no se resuelve subiendo un nuevo certificado.";

  return createPortal(
    <div
      className="theme-dark animate-overlay-in fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="certificate-notice-title"
        className="animate-pop-in flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-card border border-hairline bg-surface-1 text-ink shadow-pop"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-hairline px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600/25 text-brand-300">
              {canReplace ? <FileWarning size={20} /> : <Ban size={20} />}
            </span>
            <h2
              id="certificate-notice-title"
              className="text-lg font-bold tracking-tight text-ink"
            >
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className="-mr-1.5 shrink-0 rounded-control p-2 text-ink-muted transition hover:bg-white/10 hover:text-ink"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <p className="text-sm leading-relaxed text-ink-muted">{intro}</p>

          <p className="mt-4 text-sm font-semibold text-brand-300">Motivo</p>
          <div className="mt-1.5 max-h-40 overflow-y-auto rounded-control border border-hairline bg-surface-2 px-4 py-3">
            {trimmedReason ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
                {trimmedReason}
              </p>
            ) : (
              <p className="text-sm leading-relaxed text-ink-muted">{NO_REASON_MESSAGE}</p>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-hairline px-6 py-4">
          {canReplace ? (
            <button
              type="button"
              onClick={() => {
                handleClose();
                navigate("/actualizar-certificado");
              }}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-control bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              <FileUp size={17} />
              Actualizar certificado
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="flex h-12 w-full items-center justify-center rounded-control bg-surface-2 px-5 text-sm font-semibold text-ink transition hover:bg-white/10"
            >
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
