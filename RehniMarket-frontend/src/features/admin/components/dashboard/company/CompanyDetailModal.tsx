import { X, MapPin, FileText, CalendarDays, Eye, Check, Ban } from "lucide-react";
import { useEffect, useState } from "react";
import { getAdminCompany, updateCertificateStatus } from "@/features/admin/api/companyService";
import type { AdminCompanyResponse } from "@/features/admin/types/response";
import CertificateModal from "./CertificateModal";

interface CompanyDetailModalProps {
  companyId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCompanyUpdated?: (company: AdminCompanyResponse) => void;
}

export default function CompanyDetailModal({ companyId, isOpen, onClose, onCompanyUpdated }: CompanyDetailModalProps) {
  const [company, setCompany] = useState<AdminCompanyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [updatingCertificate, setUpdatingCertificate] = useState(false);

  const handleCertificateStatus = async (status: "approved" | "rejected") => {
    if (!company) return;
    try {
      setUpdatingCertificate(true);
      await updateCertificateStatus(company.id, status);
      const updatedCompany: AdminCompanyResponse = {
        ...company,
        CompanyCertificateStatus: status,
      };
      setCompany(updatedCompany);
      onCompanyUpdated?.(updatedCompany);
    } catch (error) {
      console.error("Error actualizando estado del certificado:", error);
    } finally {
      setUpdatingCertificate(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !companyId) return;
    const loadCompany = async () => {
      try {
        setLoading(true);
        const response = await getAdminCompany(companyId);
        setCompany(response);
      } catch (error) {
        console.error("Error cargando empresa:", error);
      } finally {
        setLoading(false);
      }
    };
    loadCompany();
  }, [isOpen, companyId]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Detalle de empresa</h2>
              <p className="mt-1 text-sm text-gray-500">Información de la empresa registrada.</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100">
              <X size={22} />
            </button>
          </div>
          <div className="overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center p-12">
                <p className="text-gray-500">Cargando empresa...</p>
              </div>
            )}
            {!loading && company && (
              <div className="p-6">
                <div className="overflow-hidden rounded-2xl border border-gray-200">
                  <div className="relative h-52 w-full bg-gray-100">
                    {company.CompanyBanner ? (
                      <img src={company.CompanyBanner} alt={`Banner de ${company.nameCompany}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">Sin banner</div>
                    )}
                    <div className="absolute bottom-0 left-6 translate-y-1/2">
                      {company.CompanyLogo ? (
                        <img src={company.CompanyLogo} alt={company.nameCompany} className="h-28 w-28 rounded-2xl border-4 border-white bg-white object-cover shadow-lg" />
                      ) : (
                        <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-white bg-gray-100 text-4xl font-bold text-gray-500 shadow-lg">
                          {company.nameCompany.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-6 pb-6 pt-20">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{company.nameCompany}</h3>
                        <p className="mt-1 text-gray-500">NIT: {company.CompanyNIT}-{company.CompanyNITDV}</p>
                      </div>
                      <CompanyStatus active={company.CompanyStatus} />
                    </div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <InfoCard icon={<MapPin size={20} />} title="Dirección" value={company.addressCompany || "No registrada"} />
                  <InfoCard icon={<FileText size={20} />} title="Estado del certificado" value={getCertificateStatus(company.CompanyCertificateStatus)} />
                  <InfoCard icon={<CalendarDays size={20} />} title="Fecha de registro" value={new Date(company.created_at).toLocaleDateString("es-CO")} />
                  <InfoCard icon={<FileText size={20} />} title="NIT" value={`${company.CompanyNIT}-${company.CompanyNITDV}`} />
                  {/* Bloquear/suspender la empresa vive en el listado
                      (Companies.tsx), no acá - se removió el duplicado. Se
                      conserva el motivo como información de solo lectura. */}
                  {company.CompanyStatus === false && company.suspensionReason && (
                    <InfoCard icon={<FileText size={20} />} title="Motivo de suspensión" value={company.suspensionReason} />
                  )}
                </div>
                <div className="mt-6 rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">Certificado empresarial</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {company.CompanyCertificate ? "Certificado disponible para visualizar." : "La empresa no tiene certificado cargado."}
                      </p>
                    </div>
                    {company.CompanyCertificate && (
                      <button type="button" onClick={() => setCertificateOpen(true)} className="flex shrink-0 items-center gap-2 rounded-xl bg-[#7A1833] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#64132a]">
                        <Eye size={18} />
                        Ver certificado
                      </button>
                    )}
                  </div>
                  <div className="mt-4">
                    <CertificateStatus status={company.CompanyCertificateStatus} />
                  </div>
                  {company.CompanyCertificate && company.CompanyCertificateStatus === "pending" && (
                    <div className="mt-5 border-t border-gray-200 pt-5">
                      <h4 className="font-semibold text-gray-900">Revisión del certificado</h4>
                      <p className="mt-1 text-sm text-gray-500">Revisa el documento antes de tomar una decisión.</p>
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <button type="button" disabled={updatingCertificate} onClick={() => handleCertificateStatus("approved")} className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">
                          <Check size={18} />
                          {updatingCertificate ? "Actualizando..." : "Aprobar certificado"}
                        </button>
                        <button type="button" disabled={updatingCertificate} onClick={() => handleCertificateStatus("rejected")} className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
                          <Ban size={18} />
                          {updatingCertificate ? "Actualizando..." : "No aprobar"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {!loading && !company && (
              <div className="p-12 text-center text-gray-500">No se pudo cargar la información de la empresa.</div>
            )}
          </div>
          <div className="flex shrink-0 justify-end border-t border-gray-200 px-6 py-5">
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-300 px-5 py-2 transition hover:bg-gray-100">
              Cerrar
            </button>
          </div>
        </div>
      </div>
      {company?.CompanyCertificate && (
        <CertificateModal
          certificateUrl={company.CompanyCertificate}
          companyName={company.nameCompany}
          isOpen={certificateOpen}
          onClose={() => setCertificateOpen(false)}
        />
      )}
    </>
  );
}

function InfoCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-sm">{title}</span>
      </div>
      <p className="mt-3 font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function CompanyStatus({ active }: { active: boolean }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
      {active ? "Activa" : "Inactiva"}
    </span>
  );
}

function CertificateStatus({ status }: { status: AdminCompanyResponse["CompanyCertificateStatus"] }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${status === "approved" ? "bg-green-100 text-green-700" : status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
      {getCertificateStatus(status)}
    </span>
  );
}

function getCertificateStatus(status: AdminCompanyResponse["CompanyCertificateStatus"]) {
  if (status === "approved") return "Aprobado";
  if (status === "rejected") return "Rechazado";
  return "Pendiente";
}