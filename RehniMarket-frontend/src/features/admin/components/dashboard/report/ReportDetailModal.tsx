import { User, Building2, Package, CalendarDays, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

import {
  getAdminReport,
  updateReportStatus,
} from "@/features/reports/api/reportService";
import { useAlert } from "@/shared/components/alert/useAlert";
import { Modal, Button, Textarea, Spinner, EmptyState } from "@/shared/components/ui";

import { ReportStatusBadge } from "./Reports";

import type { ReportDetail, ReportStatus } from "@/features/reports/types/response";

interface ReportDetailModalProps {
  reportId: string | null;
  isOpen: boolean;
  onClose: () => void;
  // Avisa al listado para que recargue: el reporte pudo salir del filtro de estado.
  onResolved: () => void;
}

// Detalle de un reporte, reutilizado para PRODUCT y COMPANY (render dinámico según el tipo).
export default function ReportDetailModal({
  reportId,
  isOpen,
  onClose,
  onResolved,
}: ReportDetailModalProps) {
  const { showAlert } = useAlert();

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Acción admin en curso. "reviewing" se confirma directo; "resolved"/"rejected" piden respuesta antes.
  const [pendingAction, setPendingAction] = useState<
    "reviewing" | "resolved" | "rejected" | null
  >(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !reportId) return;

    const loadReport = async () => {
      try {
        setLoading(true);
        setPendingAction(null);
        setAdminResponse("");

        const response = await getAdminReport(reportId);

        setReport(response);
      } catch (error) {
        console.error("Error cargando el reporte:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [isOpen, reportId]);

  const handleConfirmAction = async (status: ReportStatus) => {
    if (!report) return;

    try {
      setSubmitting(true);

      const updated = await updateReportStatus(
        report.id,
        status,
        adminResponse.trim() || undefined,
      );

      setReport(updated);
      setPendingAction(null);
      setAdminResponse("");

      const labels: Record<ReportStatus, string> = {
        pending: "marcado como pendiente",
        reviewing: "marcado en revisión",
        resolved: "resuelto",
        rejected: "rechazado",
      };

      showAlert("success", `Reporte ${labels[status]} correctamente.`);
      onResolved();
    } catch (error) {
      console.error("Error actualizando el estado del reporte:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const isProduct = report?.targetType === "product";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Detalle del reporte"
      description={isProduct ? "Reporte de producto" : "Reporte de empresa"}
      footer={
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {loading && (
        <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500">
          <Spinner /> Cargando reporte...
        </div>
      )}

      {!loading && report && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <ReportStatusBadge status={report.status} />
                <span className="text-xs text-gray-500">
                  <CalendarDays size={14} className="mr-1 inline" />
                  {new Date(report.createdAt).toLocaleString("es-CO")}
                </span>
              </div>

              {/* OBJETIVO: producto o empresa, según targetType */}
              {isProduct ? (
                <InfoRow
                  icon={<Package size={18} />}
                  label="Producto"
                  value={report.productName ?? "Producto eliminado"}
                />
              ) : (
                <InfoRow
                  icon={<Building2 size={18} />}
                  label="Empresa"
                  value={report.companyName ?? "Empresa eliminada"}
                />
              )}

              {/* Empresa propietaria - solo tiene sentido para un
                  reporte de producto (ver ALCANCE > sección 7). */}
              {isProduct && (
                <InfoRow
                  icon={<Building2 size={18} />}
                  label="Empresa propietaria"
                  value={report.companyName ?? "Empresa eliminada"}
                />
              )}

              {/* ENLACE AL OBJETIVO (ver ALCANCE > Reportes, sección
                  10-12): se arma acá, en el frontend, con el ID recibido
                  y las rutas públicas ya existentes - nunca con una URL
                  guardada en el backend (ver ALCANCE > sección 11/15).
                  Usa las mismas rutas públicas /products/:id y
                  /company/:companyId sin importar si el producto quedó
                  desactivado o la empresa suspendida (ver sección 13/14):
                  esas páginas ya manejan ese caso con su propio estado
                  de "no disponible", sin necesitar una vista admin
                  nueva. */}
              {isProduct && report.productId && (
                <a
                  href={`/products/${report.productId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Ver producto
                  <ExternalLink size={14} />
                </a>
              )}

              {!isProduct && report.companyId && (
                <a
                  href={`/company/${report.companyId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Ver empresa
                  <ExternalLink size={14} />
                </a>
              )}

              <InfoRow
                icon={<User size={18} />}
                label="Usuario reportante"
                value={`${report.reporterName} (${report.reporterEmail})`}
              />

              <InfoRow label="Motivo" value={report.reason} />

              {report.description && (
                <InfoRow label="Descripción" value={report.description} />
              )}

              {/* EVIDENCIAS (ver ALCANCE > Reportes, sección 8): solo se
                  pueden agregar al crear el reporte - no existe ningún
                  control para agregar/quitar acá, ni siquiera antes de
                  resolver (ver ALCANCE > sección 20, "no agregar/
                  eliminar evidencias" bajo ninguna circunstancia desde
                  el detalle admin). Las URLs ya vienen armadas con el
                  mismo mecanismo público (build_media_url) que usa el
                  resto de imágenes del proyecto. */}
              {report.evidences.length > 0 && (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Evidencias
                  </div>

                  <div className="mt-2 flex flex-wrap gap-3">
                    {report.evidences.map((evidence, index) => (
                      <a
                        key={evidence.id}
                        href={evidence.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver imagen completa"
                        className="block h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-200 transition hover:opacity-80"
                      >
                        <img
                          src={evidence.url}
                          alt={`Evidencia ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {report.adminResponse && (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-900">
                    Respuesta administrativa
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {report.adminResponse}
                  </p>
                  {report.resolvedByName && (
                    <p className="mt-2 text-xs text-gray-400">
                      Por {report.resolvedByName}
                      {report.resolvedAt &&
                        ` · ${new Date(report.resolvedAt).toLocaleString("es-CO")}`}
                    </p>
                  )}
                </div>
              )}

              {/* RESOLVED ES TERMINAL (ver ALCANCE > Reportes - "RESOLVED
                  = estado terminal"): ni acá ni en el backend existe
                  ningún camino para volver a tocar un reporte ya
                  resuelto - una vez en este estado, el modal es
                  únicamente un visor (ver más abajo, sección de solo
                  lectura). Esto es solo UX: la protección real está en
                  update_report_status_service > _assert_report_editable,
                  que rechaza la modificación aunque se llame al endpoint
                  directamente. */}
              {report.status === "resolved" ? (
                <div className="rounded-card border border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
                  Este reporte está resuelto y ya no puede modificarse.
                </div>
              ) : (
              /* ACCIONES ADMIN (ver ALCANCE > sección 9) - NUNCA
                  suspenden empresa ni desactivan producto por sí solas;
                  eso lo decide el admin aparte con los servicios ya
                  existentes (ver ALCANCE > punto 10). */
              <div className="rounded-card border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900">
                  Gestionar reporte
                </h3>

                {pendingAction === null ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {report.status !== "reviewing" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={submitting}
                        onClick={() => handleConfirmAction("reviewing")}
                      >
                        Marcar en revisión
                      </Button>
                    )}

                    <Button
                      size="sm"
                      disabled={submitting}
                      onClick={() => setPendingAction("resolved")}
                    >
                      Resolver
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      disabled={submitting}
                      onClick={() => setPendingAction("rejected")}
                    >
                      Rechazar
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4">
                    <Textarea
                      label="Respuesta administrativa (opcional)"
                      value={adminResponse}
                      onChange={(event) => setAdminResponse(event.target.value)}
                      disabled={submitting}
                      rows={3}
                      placeholder="Explica brevemente la decisión tomada."
                    />

                    <div className="mt-4 flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={submitting}
                        onClick={() => {
                          setPendingAction(null);
                          setAdminResponse("");
                        }}
                      >
                        Cancelar
                      </Button>

                      <Button
                        variant={pendingAction === "resolved" ? "primary" : "danger"}
                        size="sm"
                        loading={submitting}
                        onClick={() => handleConfirmAction(pendingAction)}
                      >
                        {pendingAction === "resolved"
                          ? "Confirmar resolución"
                          : "Confirmar rechazo"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              )}
            </div>
      )}

      {!loading && !report && (
        <EmptyState
          variant="plain"
          title="No se pudo cargar la información del reporte"
        />
      )}
    </Modal>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-sm text-gray-900">{value}</p>
    </div>
  );
}
