import { useEffect, useState } from "react";
import { AlertTriangle, Building2, Search, X } from "lucide-react";
import axios from "axios";

import PayoutPreviewCard from "./PayoutPreviewCard";
import PayoutPreviewSkeleton from "./PayoutPreviewSkeleton";

import { getAdminCompanies } from "@/features/admin/api/companyService";
import {
  generatePayout,
  getAvailablePayoutPeriods,
  getPayoutPreview,
} from "@/features/admin/api/payoutService";
import { useAlert } from "@/shared/components/alert/useAlert";

import type { AdminCompanyResponse } from "@/features/admin/types/response";
import type { PayoutAvailablePeriod, PayoutPreview } from "@/features/payouts/types/response";

interface GeneratePayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: () => void;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// "2026-08-01" -> "Agosto 2026". Se parsea a mano para evitar el desfase UTC de new Date("YYYY-MM-DD").
function formatPeriodLabel(period: PayoutAvailablePeriod): string {
  const [year, month] = period.periodStart.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

// Modal "Generar liquidación": único punto que crea una liquidación (POST /admin/payouts/generate).
// Ofrece solo meses con ventas DELIVERED sin liquidar, no un input de fecha libre.
export default function GeneratePayoutModal({
  isOpen,
  onClose,
  onGenerated,
}: GeneratePayoutModalProps) {
  const { showAlert } = useAlert();

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AdminCompanyResponse[]>([]);
  const [searching, setSearching] = useState(false);

  const [selectedCompany, setSelectedCompany] = useState<AdminCompanyResponse | null>(null);

  // Periodos liquidables de la empresa elegida (con ventas válidas, sin liquidación previa).
  const [periods, setPeriods] = useState<PayoutAvailablePeriod[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PayoutAvailablePeriod | null>(null);

  const [generating, setGenerating] = useState(false);

  // Vista previa financiera. preview=null + previewError=null = estado inicial sin selección suficiente.
  const [preview, setPreview] = useState<PayoutPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Diferido con setTimeout para no hacer setState síncrono dentro del efecto.
  useEffect(() => {
    if (isOpen) return;

    const timeout = setTimeout(() => {
      setSearch("");
      setResults([]);
      setSelectedCompany(null);
      setPeriods([]);
      setSelectedPeriod(null);
      setPreview(null);
      setPreviewError(null);
    });

    return () => clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || selectedCompany || !search.trim()) {
      const timeout = setTimeout(() => setResults([]));
      return () => clearTimeout(timeout);
    }

    let cancelled = false;

    const timeout = setTimeout(async () => {
      try {
        setSearching(true);
        const response = await getAdminCompanies(8, undefined, search.trim(), "all");
        if (!cancelled) setResults(response.items);
      } catch (error) {
        console.error("Error buscando empresas:", error);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [isOpen, search, selectedCompany]);

  // Carga los periodos liquidables al elegir empresa; se reinicia periodo/preview al cambiar de empresa.
  useEffect(() => {
    if (!isOpen || !selectedCompany) {
      const timeout = setTimeout(() => {
        setPeriods([]);
        setSelectedPeriod(null);
      });

      return () => clearTimeout(timeout);
    }

    let cancelled = false;

    const timeout = setTimeout(async () => {
      try {
        setPeriodsLoading(true);
        setSelectedPeriod(null);

        const response = await getAvailablePayoutPeriods(selectedCompany.id);
        if (!cancelled) setPeriods(response);
      } catch (error) {
        console.error("Error cargando periodos disponibles:", error);
        if (!cancelled) setPeriods([]);
      } finally {
        if (!cancelled) setPeriodsLoading(false);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [isOpen, selectedCompany]);

  // Vista previa automática al elegir empresa+periodo; GET /admin/payouts/preview corre la misma
  // validación/cálculo que generar, sin persistir.
  useEffect(() => {
    if (!isOpen || !selectedCompany || !selectedPeriod) {
      const timeout = setTimeout(() => {
        setPreview(null);
        setPreviewError(null);
      });

      return () => clearTimeout(timeout);
    }

    let cancelled = false;

    const timeout = setTimeout(async () => {
      try {
        setPreviewLoading(true);
        setPreviewError(null);

        const response = await getPayoutPreview(
          selectedCompany.id,
          selectedPeriod.periodStart,
          selectedPeriod.periodEnd,
        );

        if (!cancelled) setPreview(response);
      } catch (error) {
        if (cancelled) return;

        console.error("Error cargando la vista previa de liquidación:", error);

        const message = axios.isAxiosError(error)
          ? error.response?.data?.detail?.message
          : undefined;

        setPreview(null);
        setPreviewError(message ?? "No se pudo calcular la vista previa.");
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [isOpen, selectedCompany, selectedPeriod]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedCompany || !preview) {
      showAlert("error", "Selecciona una empresa y un periodo con vista previa válida.");
      return;
    }

    try {
      setGenerating(true);

      // Reutiliza el periodo que confirmó el preview: se genera exactamente lo que el admin vio.
      await generatePayout({
        companyId: selectedCompany.id,
        periodStart: preview.periodStart,
        periodEnd: preview.periodEnd,
      });

      showAlert("success", `Liquidación generada para ${selectedCompany.nameCompany}.`);
      onGenerated();
      onClose();
    } catch (error) {
      console.error("Error generando liquidación:", error);

      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail?.message
        : undefined;

      showAlert("error", message ?? "No se pudo generar la liquidación.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">Generar liquidación</h2>

          <button
            type="button"
            onClick={onClose}
            disabled={generating}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <div>
            <label className="mb-1.5 block text-sm text-gray-700">Empresa</label>

            {selectedCompany ? (
              <div className="flex items-center justify-between rounded-xl border border-[#6D0F2D]/30 bg-[#6D0F2D]/5 px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Building2 size={16} className="text-[#6D0F2D]" />
                  {selectedCompany.nameCompany}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCompany(null)}
                  className="text-xs font-medium text-[#6D0F2D] hover:underline"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5">
                  <Search size={16} className="text-gray-400" />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar empresa por nombre..."
                    className="w-full text-sm outline-none"
                  />
                </div>

                {search.trim() && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                    {searching ? (
                      <p className="px-4 py-3 text-sm text-gray-500">Buscando...</p>
                    ) : results.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-500">Sin resultados.</p>
                    ) : (
                      results.map((company) => (
                        <button
                          key={company.id}
                          type="button"
                          onClick={() => {
                            setSelectedCompany(company);
                            setSearch("");
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Building2 size={14} className="text-gray-400" />
                          {company.nameCompany}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedCompany && (
            <div>
              <label className="mb-1.5 block text-sm text-gray-700">Mes a liquidar</label>

              {periodsLoading ? (
                <div className="flex h-[42px] items-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-400">
                  Cargando periodos disponibles...
                </div>
              ) : periods.length === 0 ? (
                <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-gray-400" />

                  <p className="text-sm text-gray-500">
                    Esta empresa no tiene periodos pendientes de liquidar (sin ventas entregadas
                    sin liquidar todavía).
                  </p>
                </div>
              ) : (
                <select
                  value={selectedPeriod?.periodStart ?? ""}
                  onChange={(e) =>
                    setSelectedPeriod(
                      periods.find((period) => period.periodStart === e.target.value) ?? null,
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#6D0F2D]"
                >
                  <option value="" disabled>
                    Selecciona un mes...
                  </option>

                  {periods.map((period) => (
                    <option key={period.periodStart} value={period.periodStart}>
                      {formatPeriodLabel(period)}
                    </option>
                  ))}
                </select>
              )}

              <p className="mt-1.5 text-xs text-gray-400">
                Solo se muestran meses con ventas entregadas que todavía no tienen liquidación.
              </p>
            </div>
          )}

          {selectedCompany && selectedPeriod && (
            <div>
              <label className="mb-1.5 block text-sm text-gray-700">Vista previa</label>

              {previewLoading ? (
                <PayoutPreviewSkeleton />
              ) : previewError ? (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />

                  <p className="text-sm text-amber-800">{previewError}</p>
                </div>
              ) : preview ? (
                <PayoutPreviewCard preview={preview} />
              ) : null}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={generating}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={generating || previewLoading || !selectedCompany || !selectedPeriod || !preview}
            className="rounded-xl bg-[#6D0F2D] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#5b0d26] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? "Generando..." : "Generar liquidación"}
          </button>
        </div>
      </div>
    </div>
  );
}
