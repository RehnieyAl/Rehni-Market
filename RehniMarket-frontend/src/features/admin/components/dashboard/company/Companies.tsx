import { Search, Eye, Lock, Unlock } from "lucide-react";

import { useEffect, useState } from "react";

import { Badge, Button, EmptyState, ErrorState, Input, Select, TableSkeleton } from "@/shared/components/ui";
import CompanyDetailModal from "./CompanyDetailModal";
import CompanyStatusConfirmModal from "./CompanyStatusConfirmModal";

import {
  getAdminCompanies,
  updateCompanyStatus,
} from "@/features/admin/api/companyService";

import { useAlert } from "@/shared/components/alert/useAlert";
import { formatPrice } from "@/shared/utils/formatPrice";

import type {
  AdminCompanyResponse,
  CompanyCertificateStatus,
} from "@/features/admin/types/response";

import type {
  CompanyCertificateFilter,
} from "@/features/admin/api/companyService";

export default function Companies() {
  const { showAlert } = useAlert();

  const [companies, setCompanies] = useState<
    AdminCompanyResponse[]
  >([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [nextCursor, setNextCursor] = useState<
    string | null
  >(null);

  const [hasNext, setHasNext] = useState(false);

  const [cursorHistory, setCursorHistory] = useState<
    string[]
  >([]);

  const [selectedCompanyId, setSelectedCompanyId] =
    useState<string | null>(null);

  const [statusModalOpen, setStatusModalOpen] =
    useState(false);

  const [selectedStatusCompany, setSelectedStatusCompany] =
    useState<AdminCompanyResponse | null>(null);

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const [statusReason, setStatusReason] =
    useState("");

  const [certificateFilter, setCertificateFilter] =
    useState<CompanyCertificateFilter>("all");

  const loadCompanies = async (
    cursor?: string,
    searchValue: string = search,
    filter: CompanyCertificateFilter = certificateFilter,
  ) => {
    try {
      setLoading(true);
      setFailed(false);

      const response = await getAdminCompanies(
        10,
        cursor,
        searchValue,
        filter,
      );

      setCompanies(response.items);
      setNextCursor(response.next_cursor);
      setHasNext(response.has_next);
    } catch (error) {
      console.error(
        "Error cargando empresas:",
        error,
      );
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialCompanies = async () => {
      try {
        setLoading(true);
        setFailed(false);

        const response = await getAdminCompanies(
          10,
          undefined,
          "",
          "all",
        );

        setCompanies(response.items);
        setNextCursor(response.next_cursor);
        setHasNext(response.has_next);
        setCursorHistory([]);
      } catch (error) {
        console.error(
          "Error cargando empresas:",
          error,
        );
        setFailed(true);
      } finally {
        setLoading(false);
      }
    };

    loadInitialCompanies();
  }, []);

  const handleSearch = async (
    value: string,
  ) => {
    setSearch(value);
    setNextCursor(null);
    setCursorHistory([]);

    await loadCompanies(
      undefined,
      value,
      certificateFilter,
    );
  };

  const handleCertificateFilter = async (
    filter: CompanyCertificateFilter,
  ) => {
    setCertificateFilter(filter);

    setNextCursor(null);
    setCursorHistory([]);

    await loadCompanies(
      undefined,
      search,
      filter,
    );
  };

  const handleNextPage = async () => {
    if (!nextCursor || loading) {
      return;
    }

    setCursorHistory(
      (currentHistory) => [
        ...currentHistory,
        nextCursor,
      ],
    );

    await loadCompanies(
      nextCursor,
      search,
      certificateFilter,
    );
  };

  const handlePreviousPage = async () => {
    if (
      loading ||
      cursorHistory.length === 0
    ) {
      return;
    }

    const history = [
      ...cursorHistory,
    ];

    history.pop();

    const previousCursor =
      history.length > 0
        ? history[history.length - 1]
        : undefined;

    setCursorHistory(history);

    await loadCompanies(
      previousCursor,
      search,
      certificateFilter,
    );
  };

  const handleOpenStatusModal = (
    company: AdminCompanyResponse,
  ) => {
    setSelectedStatusCompany(company);
    setStatusReason("");
    setStatusModalOpen(true);
  };

  const handleCloseStatusModal = () => {
    if (updatingStatus) {
      return;
    }

    setStatusModalOpen(false);
    setSelectedStatusCompany(null);
    setStatusReason("");
  };

  const handleCompanyStatus = async () => {
    if (!selectedStatusCompany) {
      return;
    }

    const newStatus =
      !selectedStatusCompany.CompanyStatus;

    // El motivo es obligatorio solo al suspender (newStatus false); respaldo del modal.
    if (!newStatus && !statusReason.trim()) {
      return;
    }

    try {
      setUpdatingStatus(true);

      const result = await updateCompanyStatus(
        selectedStatusCompany.id,
        newStatus,
        // El motivo aplica al suspender (newStatus=false), no al desbloquear.
        !newStatus ? statusReason.trim() : undefined,
      );

      setCompanies(
        (currentCompanies) =>
          currentCompanies.map(
            (company) =>
              company.id ===
              selectedStatusCompany.id
                ? {
                    ...company,
                    CompanyStatus:
                      result.CompanyStatus,
                    suspensionReason:
                      result.suspensionReason,
                  }
                : company,
          ),
      );

      setSelectedStatusCompany(null);
      setStatusModalOpen(false);
      setStatusReason("");

      // Feedback con los valores reales devueltos por el backend.
      if (newStatus) {
        showAlert(
          "success",
          "Empresa desbloqueada correctamente.",
        );
      } else if (result.affectedOrdersCount > 0) {
        showAlert(
          "success",
          `Empresa suspendida correctamente. Se procesaron ${result.affectedOrdersCount} pedido${
            result.affectedOrdersCount !== 1 ? "s" : ""
          } y se reembolsaron ${formatPrice(
            result.totalRefunded,
          )} en RehniCoins.`,
        );
      } else {
        showAlert(
          "success",
          "Empresa suspendida correctamente. No había pedidos pendientes de reembolso.",
        );
      }
    } catch (error) {
      console.error(
        "Error actualizando estado de la empresa:",
        error,
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCompanyUpdated = (
    updatedCompany: AdminCompanyResponse,
  ) => {
    setCompanies(
      (currentCompanies) =>
        currentCompanies.map(
          (company) =>
            company.id ===
            updatedCompany.id
              ? updatedCompany
              : company,
        ),
    );
  };

  const getFilterLabel = () => {
    switch (certificateFilter) {
      case "pending":
        return "Pendientes";

      case "rejected":
        return "Rechazadas";

      case "approved":
        return "Aprobadas";

      default:
        return "Todas";
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">

      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">
          Empresas
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Gestiona las empresas registradas
          en la plataforma.
        </p>
      </div>

      <section className="mt-6 shrink-0 rounded-card border border-gray-200 bg-white p-5 shadow-card">
        <div className="flex flex-col gap-3 md:flex-row">
          <Input
            className="flex-1"
            type="search"
            value={search}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder="Buscar por correo, teléfono, NIT o empresa…"
            aria-label="Buscar empresas"
            leadingIcon={<Search size={16} />}
          />

          <Select
            className="md:w-52"
            aria-label="Filtrar por certificado"
            value={certificateFilter}
            onChange={(event) =>
              handleCertificateFilter(
                event.target.value as CompanyCertificateFilter,
              )
            }
          >
            <option value="all">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="rejected">Rechazadas</option>
            <option value="approved">Aprobadas</option>
          </Select>
        </div>
      </section>

      <section className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-card border border-gray-200 bg-white shadow-card">

        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">

          <div>
            <h2 className="font-semibold text-gray-900">
              Empresas registradas
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              {companies.length} empresa
              {companies.length !== 1
                ? "s"
                : ""}
            </p>
          </div>

          <Badge>{getFilterLabel()}</Badge>
        </div>

        <div className="h-[360px] overflow-y-auto overflow-x-auto">
          <table className="w-full min-w-[900px]">

            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">

                <th className="px-5 py-3 font-medium">
                  Empresa
                </th>

                <th className="px-5 py-3 font-medium">
                  NIT
                </th>

                <th className="px-5 py-3 font-medium">
                  Dirección
                </th>

                <th className="px-5 py-3 font-medium">
                  Certificado
                </th>

                <th className="px-5 py-3 font-medium">
                  Estado
                </th>

                <th className="px-5 py-3 font-medium">
                  Registro
                </th>

                <th className="px-5 py-3 text-center font-medium">
                  Acción
                </th>

              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <TableSkeleton rows={6} columns={["24%", "18%", "16%", "14%", "12%", "10%"]} />
                  </td>
                </tr>
              ) : failed && companies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <ErrorState
                      variant="plain"
                      title="No pudimos cargar las empresas"
                      onRetry={() => loadCompanies()}
                    />
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState
                      variant="plain"
                      title="No se encontraron empresas con este filtro"
                    />
                  </td>
                </tr>
              ) : (
                companies.map(
                  (company) => (
                    <tr
                      key={company.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                    >

                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">

                          {company.CompanyLogo ? (
                            <img
                              src={
                                company.CompanyLogo
                              }
                              alt={
                                company.nameCompany
                              }
                              className="h-9 w-9 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-sm font-semibold text-gray-500">
                              {company.nameCompany
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}

                          <span className="text-sm font-semibold text-gray-900">
                            {
                              company.nameCompany
                            }
                          </span>

                        </div>
                      </td>

                      <td className="px-5 py-3 text-sm text-gray-600">
                        {company.CompanyNIT}-
                        {company.CompanyNITDV}
                      </td>

                      <td className="px-5 py-3 text-sm text-gray-600">
                        {company.addressCompany ||
                          "No registrada"}
                      </td>

                      <td className="px-5 py-3">
                        <CertificateStatus
                          status={
                            company.CompanyCertificateStatus
                          }
                        />
                      </td>

                      <td className="px-5 py-3">
                        <CompanyStatus
                          active={
                            company.CompanyStatus
                          }
                        />
                      </td>

                      <td className="px-5 py-3 text-sm text-gray-500">
                        {new Date(
                          company.created_at,
                        ).toLocaleDateString(
                          "es-CO",
                        )}
                      </td>

                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1">

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedCompanyId(
                                company.id,
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-control text-gray-600 transition hover:bg-gray-100"
                            title="Ver empresa"
                            aria-label={`Ver ${company.nameCompany}`}
                          >
                            <Eye size={18} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleOpenStatusModal(
                                company,
                              )
                            }
                            disabled={
                              updatingStatus
                            }
                            className={`flex h-9 w-9 items-center justify-center rounded-control transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              company.CompanyStatus
                                ? "text-danger hover:bg-danger-bg"
                                : "text-success hover:bg-success-bg"
                            }`}
                            title={
                              company.CompanyStatus
                                ? "Bloquear empresa"
                                : "Desbloquear empresa"
                            }
                            aria-label={
                              company.CompanyStatus
                                ? `Bloquear ${company.nameCompany}`
                                : `Desbloquear ${company.nameCompany}`
                            }
                          >
                            {company.CompanyStatus ? (
                              <Lock
                                size={18}
                              />
                            ) : (
                              <Unlock
                                size={18}
                              />
                            )}
                          </button>

                        </div>
                      </td>

                    </tr>
                  ),
                )
              )}

            </tbody>
          </table>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-gray-200 px-5 py-3">

          <span className="text-sm text-gray-500">
            Mostrando{" "}
            {companies.length}{" "}
            empresas
          </span>

          <div className="flex items-center gap-3">

            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={cursorHistory.length === 0 || loading}
            >
              Atrás
            </Button>

            <Button
              size="sm"
              onClick={handleNextPage}
              disabled={!hasNext}
              loading={loading}
            >
              Siguiente
            </Button>

          </div>
        </div>
      </section>

      <CompanyDetailModal
        companyId={
          selectedCompanyId
        }
        isOpen={
          selectedCompanyId !== null
        }
        onClose={() =>
          setSelectedCompanyId(null)
        }
        onCompanyUpdated={
          handleCompanyUpdated
        }
      />

      {selectedStatusCompany && (
        <CompanyStatusConfirmModal
          isOpen={
            statusModalOpen
          }
          companyName={
            selectedStatusCompany.nameCompany
          }
          active={
            selectedStatusCompany.CompanyStatus
          }
          loading={
            updatingStatus
          }
          reason={statusReason}
          onReasonChange={setStatusReason}
          onConfirm={
            handleCompanyStatus
          }
          onClose={
            handleCloseStatusModal
          }
        />
      )}
    </div>
  );
}

function CertificateStatus({
  status,
}: {
  status: CompanyCertificateStatus;
}) {
  const config = {
    pending: { text: "Pendiente", tone: "warning" as const },
    approved: { text: "Aprobado", tone: "success" as const },
    rejected: { text: "Rechazado", tone: "danger" as const },
  };

  const current = config[status];

  return <Badge tone={current.tone}>{current.text}</Badge>;
}

function CompanyStatus({
  active,
}: {
  active: boolean;
}) {
  return (
    <Badge tone={active ? "success" : "danger"}>
      {active ? "Activa" : "Bloqueada"}
    </Badge>
  );
}