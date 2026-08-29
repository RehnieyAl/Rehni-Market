import { Search, Eye, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import {
  getAdminReports,
  type ReportStatusFilter,
  type ReportTypeFilter,
} from "@/features/reports/api/reportService";

import ReportDetailModal from "./ReportDetailModal";

import type { ReportListItem } from "@/features/reports/types/response";

// Gestión de reportes. Mismo patrón de listado que Companies.tsx: búsqueda + filtros + tabla + paginación + modal de detalle.
export default function Reports() {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);

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

        const response = await getAdminReports(1, 10, "all", "all", "");

        setReports(response.items);
        setTotalPages(response.total_pages || 1);
        setTotal(response.total);
      } catch (error) {
        console.error("Error cargando reportes:", error);
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

      <section className="mt-6 shrink-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="flex flex-1 items-center gap-3 rounded-lg border border-gray-200 px-4 py-3">
            <Search size={19} className="shrink-0 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Buscar por producto, empresa, motivo o usuario..."
              className="w-full text-sm outline-none"
            />
          </div>

          <div className="relative">
            <select
              value={typeFilter}
              onChange={(event) =>
                handleTypeFilter(event.target.value as ReportTypeFilter)
              }
              className="h-full min-w-[160px] appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-gray-700 outline-none transition focus:border-[#7A1833]"
            >
              <option value="all">Todos</option>
              <option value="product">Productos</option>
              <option value="company">Empresas</option>
            </select>

            <ChevronDown
              size={17}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(event) =>
                handleStatusFilter(event.target.value as ReportStatusFilter)
              }
              className="h-full min-w-[160px] appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-gray-700 outline-none transition focus:border-[#7A1833]"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="reviewing">En revisión</option>
              <option value="resolved">Resueltos</option>
              <option value="rejected">Rechazados</option>
            </select>

            <ChevronDown
              size={17}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>
      </section>

      <section className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
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
                  <td
                    colSpan={8}
                    className="px-5 py-8 text-center text-sm text-gray-500"
                  >
                    Cargando reportes...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-8 text-center text-sm text-gray-500"
                  >
                    No se encontraron reportes con este filtro.
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
                          className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
                          title="Ver reporte"
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
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Atrás
            </button>

            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="rounded-xl bg-[#7A1833] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#64132a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Cargando..." : "Siguiente"}
            </button>
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
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        type === "product"
          ? "bg-blue-50 text-blue-700"
          : "bg-purple-50 text-purple-700"
      }`}
    >
      {type === "product" ? "Producto" : "Empresa"}
    </span>
  );
}

const STATUS_CONFIG: Record<
  ReportListItem["status"],
  { text: string; className: string }
> = {
  pending: { text: "Pendiente", className: "bg-yellow-50 text-yellow-700" },
  reviewing: { text: "En revisión", className: "bg-blue-50 text-blue-700" },
  resolved: { text: "Resuelto", className: "bg-green-50 text-green-700" },
  rejected: { text: "Rechazado", className: "bg-red-50 text-red-700" },
};

export function ReportStatusBadge({
  status,
}: {
  status: ReportListItem["status"];
}) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      {config.text}
    </span>
  );
}
