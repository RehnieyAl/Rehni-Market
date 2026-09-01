import { User, Building2, Package, CalendarDays, ExternalLink, Ban } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  getAdminReport,
  updateReportStatus,
} from "@/features/reports/api/reportService";
import { getAdminCompany, updateCompanyStatus } from "@/features/admin/api/companyService";
import { useAlert } from "@/shared/components/alert/useAlert";
import { Modal, Button, Textarea, Spinner, EmptyState, Badge } from "@/shared/components/ui";
import { formatPrice } from "@/shared/utils/formatPrice";
import CompanyStatusConfirmModal from "@/features/admin/components/dashboard/company/CompanyStatusConfirmModal";

import { ReportStatusBadge } from "./Reports";

import type { ReportDetail, ReportStatus } from "@/features/reports/types/response";

interface ReportDetailModalProps {
  reportId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onResolved: () => void;
}

interface TargetCompanyState {
  id: string;
  active: boolean;
  suspensionReason: string | null;
}

export default function ReportDetailModal({
  reportId,
  isOpen,
  onClose,
  onResolved,
}: ReportDetailModalProps) {
  const { showAlert } = useAlert();

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const [pendingAction, setPendingAction] = useState<
    "reviewing" | "resolved" | "rejected" | null
  >(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [targetCompany, setTargetCompany] = useState<TargetCompanyState | null>(null);
  const [targetCompanyLoading, setTargetCompanyLoading] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    if (!isOpen || !reportId) return;

    const loadReport = async () => {
      try {
        setLoading(true);
        setPendingAction(null);
        setAdminResponse("");
        setTargetCompany(null);
        setBlockOpen(false);
        setBlockReason("");

        const response = await getAdminReport(reportId);

        setReport(response);

        if (response.companyId) {
          try {
            setTargetCompanyLoading(true);

            const company = await getAdminCompany(response.companyId);

            setTargetCompany({
              id: company.id,
              active: company.CompanyStatus,
              suspensionReason: company.suspensionReason,
            });
          } catch (companyError) {
            console.error("Error cargando la empresa del reporte:", companyError);
          } finally {
            setTargetCompanyLoading(false);
          }
        }
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

  const handleBlockCompany = async () => {
    if (!report?.companyId || blocking) return;
    if (blockReason.trim().length === 0) return;

    try {
      setBlocking(true);

      const result = await updateCompanyStatus(
        report.companyId,
        false,
        blockReason.trim(),
      );

      setTargetCompany({
        id: result.id,
        active: result.CompanyStatus,
        suspensionReason: result.suspensionReason,
      });
      setBlockOpen(false);
      setBlockReason("");

      const message =
        result.affectedOrdersCount > 0
          ? `Empresa suspendida correctamente. Se procesaron ${result.affectedOrdersCount} pedido${
              result.affectedOrdersCount !== 1 ? "s" : ""
            } y se reembolsaron ${formatPrice(result.totalRefunded)} en RehniCoins.`
          : "Empresa suspendida correctamente. No había pedidos pendientes de reembolso.";

      showAlert("success", message);
    } catch (error) {
      console.error("Error suspendiendo la empresa desde el reporte:", error);
    } finally {
      setBlocking(false);
    }
  };

  const handleCloseBlockModal = useCallback(() => {
    setBlockOpen(false);
    setBlockReason("");
  }, []);

  const isProduct = report?.targetType === "product";

  return (
    <>
      <Modal
        isOpen={isOpen && !blockOpen}
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
            <Spinner /> Cargando reporte…
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

            {isProduct && (
              <InfoRow
                icon={<Building2 size={18} />}
                label="Empresa propietaria"
                value={report.companyName ?? "Empresa eliminada"}
              />
            )}

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
                      className="block h-20 w-20 shrink-0 overflow-hidden rounded-card border border-gray-200 transition hover:opacity-80"
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

            {report.companyId && (
              <div className="rounded-card border border-gray-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900">
                      {isProduct
                        ? "Empresa propietaria del producto"
                        : "Empresa reportada"}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {report.companyName ?? "Empresa"}
                    </p>
                  </div>

                  {targetCompanyLoading && !targetCompany ? (
                    <Spinner size={16} />
                  ) : targetCompany ? (
                    targetCompany.active ? (
                      <Button
                        variant="danger"
                        size="sm"
                        leadingIcon={<Ban size={16} />}
                        disabled={blocking}
                        onClick={() => setBlockOpen(true)}
                      >
                        Suspender empresa
                      </Button>
                    ) : (
                      <Badge tone="danger" dot>
                        Empresa suspendida
                      </Badge>
                    )
                  ) : null}
                </div>

                {targetCompany && !targetCompany.active && targetCompany.suspensionReason && (
                  <p className="mt-3 rounded-control bg-danger-bg p-3 text-sm text-danger">
                    Motivo: {targetCompany.suspensionReason}
                  </p>
                )}
              </div>
            )}

            {report.adminResponse && (
              <div className="rounded-card bg-gray-50 p-4">
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

            {report.status === "resolved" ? (
              <div className="rounded-card border border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
                Este reporte está resuelto y ya no puede modificarse.
              </div>
            ) : (
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

      {report?.companyId && (
        <CompanyStatusConfirmModal
          isOpen={blockOpen}
          companyName={report.companyName ?? "esta empresa"}
          active
          loading={blocking}
          reason={blockReason}
          onReasonChange={setBlockReason}
          onConfirm={handleBlockCompany}
          onClose={handleCloseBlockModal}
        />
      )}
    </>
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
