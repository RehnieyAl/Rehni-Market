import {
  Search,
  Eye,
  Lock,
  Unlock,
  ChevronDown,
} from "lucide-react";

import { useEffect, useState } from "react";

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialCompanies = async () => {
      try {
        setLoading(true);

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

      <section className="mt-6 shrink-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">

          <div className="flex flex-1 items-center gap-3 rounded-lg border border-gray-200 px-4 py-3">
            <Search
              size={19}
              className="shrink-0 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                handleSearch(
                  event.target.value,
                )
              }
              placeholder="Buscar por correo, teléfono, NIT o empresa..."
              className="w-full text-sm outline-none"
            />
          </div>

          <div className="relative">
            <select
              value={certificateFilter}
              onChange={(event) =>
                handleCertificateFilter(
                  event.target
                    .value as CompanyCertificateFilter,
                )
              }
              className="h-full min-w-[190px] appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-gray-700 outline-none transition focus:border-[#7A1833]"
            >
              <option value="all">
                Todas
              </option>

              <option value="pending">
                Pendientes
              </option>

              <option value="rejected">
                Rechazadas
              </option>

              <option value="approved">
                Aprobadas
              </option>
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
              Empresas registradas
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              {companies.length} empresa
              {companies.length !== 1
                ? "s"
                : ""}
            </p>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
            {getFilterLabel()}
          </span>
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
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-center text-sm text-gray-500"
                  >
                    Cargando empresas...
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-center text-sm text-gray-500"
                  >
                    No se encontraron empresas
                    con este filtro.
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
                            className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
                            title="Ver empresa"
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
                            className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              company.CompanyStatus
                                ? "text-red-600 hover:bg-red-50"
                                : "text-green-600 hover:bg-green-50"
                            }`}
                            title={
                              company.CompanyStatus
                                ? "Bloquear empresa"
                                : "Desbloquear empresa"
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

            <button
              type="button"
              onClick={
                handlePreviousPage
              }
              disabled={
                cursorHistory.length ===
                  0 || loading
              }
              className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Atrás
            </button>

            <button
              type="button"
              onClick={
                handleNextPage
              }
              disabled={
                !hasNext || loading
              }
              className="rounded-xl bg-[#7A1833] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#64132a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Cargando..."
                : "Siguiente"}
            </button>

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
    pending: {
      text: "Pendiente",
      className:
        "bg-yellow-50 text-yellow-700",
    },

    approved: {
      text: "Aprobado",
      className:
        "bg-green-50 text-green-700",
    },

    rejected: {
      text: "Rechazado",
      className:
        "bg-red-50 text-red-700",
    },
  };

  const current = config[status];

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${current.className}`}
    >
      {current.text}
    </span>
  );
}

function CompanyStatus({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-green-50 text-green-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      {active
        ? "Activa"
        : "Bloqueada"}
    </span>
  );
}