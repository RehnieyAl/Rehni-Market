import { Search, Eye } from "lucide-react";
import { useEffect, useState } from "react";

import {
  getAdminReports,
  type ReportStatusFilter,
  type ReportTypeFilter,
} from "@/features/reports/api/reportService";

import { Badge, Button, EmptyState, ErrorState, Input, Select, TableSkeleton } from "@/shared/components/ui";
import type { BadgeTone } from "@/shared/components/ui";
import ReportDetailModal from "./ReportDetailModal";

import type { ReportListItem } from "@/features/reports/types/response";

// Gestión de reportes. Mismo patrón de listado que Companies.tsx: búsqueda + filtros + tabla + paginación + modal de detalle.
export default function Reports() {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ReportTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<ReportStatusFilter>("all");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    null,
  );

  const loadReports = async (
    pageValue: number = page,
    searchValue: string = search,
    typeValue: ReportTypeFilter = typeFilter,
    statusValue: ReportStatusFilter = statusFilter,
  ) => {
    try {
      setLoading(true);
      setFailed(false);

      const response = await getAdminReports(
        pageValue,
        10,
        typeValue,
        statusValue,
        searchValue,
      );

      setReports(response.items);
      setTotalPages(response.total_pages || 1);
      setTotal(response.total);
    } catch (error) {
      console.error("Error cargando reportes:", error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  // Solo carga inicial; los cambios de filtro/búsqueda recargan desde su propio handler.
  // Función definida dentro del efecto para no disparar react-hooks/set-state-in-effect.
  useEffect(() => {
    const loadInitialReports = async () => {
      try {
        setLoading(true);
        setFailed(false);

        const response = await getAdminReports(1, 10, "all", "all", "");

        setReports(response.items);
        setTotalPages(response.total_pages || 1);
        setTotal(response.total);
      } catch (error) {
        console.error("Error cargando reportes:", error);
        setFailed(true);
      } finally {
        setLoading(false);
      }
    };

    loadInitialReports();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    loadReports(1, value, typeFilter, statusFilter);
  };

  const handleTypeFilter = (value: ReportTypeFilter) => {
    setTypeFilter(value);
    setPage(1);
    loadReports(1, search, value, statusFilter);
  };

  const handleStatusFilter = (value: ReportStatusFilter) => {
    setStatusFilter(value);
    setPage(1);
    loadReports(1, search, typeFilter, value);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || loading) return;

    setPage(nextPage);
    loadReports(nextPage, search, typeFilter, statusFilter);
  };

  const handleReportResolved = () => {
    // Tras resolver/rechazar, se recarga la página: el reporte pudo salir del filtro de estado.
    loadReports(page, search, typeFilter, statusFilter);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">

      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Reportes de productos y empresas enviados por los usuarios.
        </p>
      </div>

      <section className="mt-6 shrink-0 rounded-card border border-gray-200 bg-white p-5 shadow-card">
        <div className="flex flex-col gap-3 md:flex-row">
          <Input
            className="flex-1"
            type="search"
            value={search}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder="Buscar por producto, empresa, motivo o usuario…"
            aria-label="Buscar reportes"
            leadingIcon={<Search size={16} />}
          />

          <Select
            className="md:w-44"
            aria-label="Filtrar por tipo"
            value={typeFilter}
            onChange={(event) => handleTypeFilter(event.target.value as ReportTypeFilter)}
          >
            <option value="all">Todos</option>
            <option value="product">Productos</option>
            <option value="company">Empresas</option>
          </Select>

          <Select
            className="md:w-44"
            aria-label="Filtrar por estado"
            value={statusFilter}
            onChange={(event) => handleStatusFilter(event.target.value as ReportStatusFilter)}
          >
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="reviewing">En revisión</option>
            <option value="resolved">Resueltos</option>
            <option value="rejected">Rechazados</option>
          </Select>
        </div>
      </section>

      <section className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-card border border-gray-200 bg-white shadow-card">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">
              Reportes registrados
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {total} reporte{total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="h-[420px] overflow-y-auto overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Objetivo</th>
                <th className="px-5 py-3 font-medium">Empresa</th>
                <th className="px-5 py-3 font-medium">Motivo</th>
                <th className="px-5 py-3 font-medium">Reportante</th>
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 text-center font-medium">Acción</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <TableSkeleton rows={6} columns={["22%", "18%", "16%", "14%", "12%", "10%", "8%"]} />
                  </td>
                </tr>
              ) : failed && reports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <ErrorState
                      variant="plain"
                      title="No pudimos cargar los reportes"
                      onRetry={() => loadReports(page, search, typeFilter, statusFilter)}
                    />
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <EmptyState
                      variant="plain"
                      title="No se encontraron reportes con este filtro"
                    />
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr
                    key={report.id}
                    className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-gray-50"
                    onClick={() => setSelectedReportId(report.id)}
                  >
                    <td className="px-5 py-3">
                      <ReportTypeBadge type={report.targetType} />
                    </td>

                    <td className="px-5 py-3 text-sm font-semibold text-gray-900">
                      {report.targetLabel}
                    </td>

                    <td className="px-5 py-3 text-sm text-gray-600">
                      {report.targetType === "company"
                        ? "—"
                        : (report.companyName ?? "—")}
                    </td>

                    <td className="max-w-[220px] truncate px-5 py-3 text-sm text-gray-600">
                      {report.reason}
                    </td>

                    <td className="px-5 py-3 text-sm text-gray-600">
                      {report.reporterName}
                    </td>

                    <td className="px-5 py-3 text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString("es-CO")}
                    </td>

                    <td className="px-5 py-3">
                      <ReportStatusBadge status={report.status} />
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedReportId(report.id);
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-control text-gray-600 transition hover:bg-gray-100"
                          title="Ver reporte"
                          aria-label={`Ver reporte de ${report.targetLabel}`}
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-gray-200 px-5 py-3">
          <span className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </span>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || loading}
            >
              Atrás
            </Button>

            <Button
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              loading={loading}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </section>

      <ReportDetailModal
        reportId={selectedReportId}
        isOpen={selectedReportId !== null}
        onClose={() => setSelectedReportId(null)}
        onResolved={handleReportResolved}
      />
    </div>
  );
}

function ReportTypeBadge({ type }: { type: ReportListItem["targetType"] }) {
  return (
    <Badge tone={type === "product" ? "info" : "brand"}>
      {type === "product" ? "Producto" : "Empresa"}
    </Badge>
  );
}

const STATUS_CONFIG: Record<
  ReportListItem["status"],
  { text: string; tone: BadgeTone }
> = {
  pending: { text: "Pendiente", tone: "warning" },
  reviewing: { text: "En revisión", tone: "info" },
  resolved: { text: "Resuelto", tone: "success" },
  rejected: { text: "Rechazado", tone: "danger" },
};

export function ReportStatusBadge({
  status,
}: {
  status: ReportListItem["status"];
}) {
  const config = STATUS_CONFIG[status];

  return <Badge tone={config.tone}>{config.text}</Badge>;
}
