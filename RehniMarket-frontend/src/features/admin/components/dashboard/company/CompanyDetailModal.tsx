import {
  MapPin,
  FileText,
  CalendarDays,
  Eye,
  Check,
  Ban,
  Building2,
  UserRound,
  Mail,
  Phone,
  Shield,
  IdCard,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Badge, Button, ErrorState, Modal, Skeleton, Spinner } from "@/shared/components/ui";
import type { BadgeTone } from "@/shared/components/ui";
import { getAdminCompany, updateCertificateStatus } from "@/features/admin/api/companyService";
import { getAdminUserById } from "@/features/admin/api/userService";
import type {
  AdminCompanyResponse,
  AdminUserResponse,
  CompanyCertificateStatus,
} from "@/features/admin/types/response";
import CertificateModal from "./CertificateModal";

interface CompanyDetailModalProps {
  companyId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCompanyUpdated?: (company: AdminCompanyResponse) => void;
}

const ROLE_LABEL: Record<string, string> = {
  user: "Usuario",
  admin: "Administrador",
  company: "Empresa",
  owner: "Propietario",
};

const CERT_TONE: Record<CompanyCertificateStatus, BadgeTone> = {
  approved: "success",
  rejected: "danger",
  pending: "warning",
};

function certLabel(status: CompanyCertificateStatus): string {
  if (status === "approved") return "Aprobado";
  if (status === "rejected") return "Rechazado";
  return "Pendiente";
}

export default function CompanyDetailModal({
  companyId,
  isOpen,
  onClose,
  onCompanyUpdated,
}: CompanyDetailModalProps) {
  const [company, setCompany] = useState<AdminCompanyResponse | null>(null);
  const [representative, setRepresentative] = useState<AdminUserResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [certificateOpen, setCertificateOpen] = useState(false);
  const [updatingCertificate, setUpdatingCertificate] = useState(false);

  useEffect(() => {
    if (!isOpen || !companyId) return;

    const load = async () => {
      try {
        setLoading(true);
        setFailed(false);
        setRepresentative(null);
        setCertificateOpen(false);

        const detail = await getAdminCompany(companyId);
        setCompany(detail);

        try {
          const rep = await getAdminUserById(detail.user_id);
          setRepresentative(rep);
        } catch (repError) {
          console.error("Error cargando el representante de la empresa:", repError);
        }
      } catch (error) {
        console.error("Error cargando empresa:", error);
        setFailed(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen, companyId, reloadKey]);

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

  return (
    <>
      <Modal
        isOpen={isOpen && !certificateOpen}
        onClose={onClose}
        size="xl"
        title="Detalle de empresa"
        description="Información de la empresa y de su representante."
        footer={
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        }
      >
        {loading && (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500">
            <Spinner /> Cargando empresa…
          </div>
        )}

        {!loading && failed && (
          <ErrorState
            variant="plain"
            title="No pudimos cargar la información de la empresa"
            description="Intenta de nuevo en unos momentos."
            onRetry={() => setReloadKey((k) => k + 1)}
          />
        )}

        {!loading && !failed && company && (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-card border border-gray-200">
              <div className="relative h-40 w-full bg-gray-100 sm:h-52">
                {company.CompanyBanner ? (
                  <img
                    src={company.CompanyBanner}
                    alt={`Banner de ${company.nameCompany}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                    Sin banner
                  </div>
                )}

                <div className="absolute -bottom-10 left-5 sm:left-6">
                  {company.CompanyLogo ? (
                    <img
                      src={company.CompanyLogo}
                      alt={company.nameCompany}
                      className="h-24 w-24 rounded-card border-4 border-white bg-white object-cover shadow-card"
                      onError={(e) => {
                        e.currentTarget.style.visibility = "hidden";
                      }}
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-card border-4 border-white bg-brand-50 text-3xl font-bold text-primary shadow-card">
                      {company.nameCompany.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 px-5 pb-5 pt-14 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-bold text-gray-900">
                    {company.nameCompany}
                  </h3>
                  <p className="mt-0.5 text-sm text-gray-500">
                    NIT: {company.CompanyNIT}-{company.CompanyNITDV}
                  </p>
                </div>

                <Badge tone={company.CompanyStatus ? "success" : "danger"} dot>
                  {company.CompanyStatus ? "Activa" : "Suspendida"}
                </Badge>
              </div>
            </div>

            <section>
              <SectionHeader icon={<Building2 size={18} />} title="Información de la empresa" />

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field icon={<Building2 size={18} />} label="Nombre de la empresa">
                  {company.nameCompany}
                </Field>

                <Field icon={<IdCard size={18} />} label="NIT">
                  {company.CompanyNIT}-{company.CompanyNITDV}
                </Field>

                <Field icon={<MapPin size={18} />} label="Dirección">
                  {company.addressCompany || "No registrada"}
                </Field>

                <Field icon={<Shield size={18} />} label="Estado">
                  <Badge tone={company.CompanyStatus ? "success" : "danger"} dot>
                    {company.CompanyStatus ? "Activa" : "Suspendida"}
                  </Badge>
                </Field>

                <Field icon={<FileText size={18} />} label="Estado del certificado">
                  <Badge tone={CERT_TONE[company.CompanyCertificateStatus]}>
                    {certLabel(company.CompanyCertificateStatus)}
                  </Badge>
                </Field>

                <Field icon={<CalendarDays size={18} />} label="Fecha de registro">
                  {new Date(company.created_at).toLocaleDateString("es-CO")}
                </Field>

                {company.CompanyStatus === false && company.suspensionReason && (
                  <div className="sm:col-span-2">
                    <Field icon={<Ban size={18} />} label="Motivo de suspensión">
                      {company.suspensionReason}
                    </Field>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-card border border-gray-200 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-gray-900">Certificado empresarial</h4>
                    <p className="mt-1 text-sm text-gray-500">
                      {company.CompanyCertificate
                        ? "Certificado disponible para visualizar."
                        : "La empresa no tiene certificado cargado."}
                    </p>
                  </div>

                  {company.CompanyCertificate && (
                    <Button
                      size="sm"
                      leadingIcon={<Eye size={16} />}
                      onClick={() => setCertificateOpen(true)}
                    >
                      Ver certificado
                    </Button>
                  )}
                </div>

                {company.CompanyCertificate &&
                  company.CompanyCertificateStatus === "pending" && (
                    <div className="mt-5 border-t border-gray-200 pt-5">
                      <h5 className="font-semibold text-gray-900">Revisión del certificado</h5>
                      <p className="mt-1 text-sm text-gray-500">
                        Revisa el documento antes de tomar una decisión.
                      </p>

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <Button
                          leadingIcon={<Check size={18} />}
                          loading={updatingCertificate}
                          disabled={updatingCertificate}
                          onClick={() => handleCertificateStatus("approved")}
                        >
                          {updatingCertificate ? "Actualizando…" : "Aprobar certificado"}
                        </Button>

                        <Button
                          variant="danger"
                          leadingIcon={<Ban size={18} />}
                          disabled={updatingCertificate}
                          onClick={() => handleCertificateStatus("rejected")}
                        >
                          {updatingCertificate ? "Actualizando…" : "No aprobar"}
                        </Button>
                      </div>
                    </div>
                  )}
              </div>
            </section>

            <section className="border-t border-gray-200 pt-6">
              <SectionHeader icon={<UserRound size={18} />} title="Representante" />

              {representative ? (
                <>
                  <div className="mt-4 flex items-center gap-4 rounded-card border border-gray-200 p-5">
                    {representative.profileImagen ? (
                      <img
                        src={representative.profileImagen}
                        alt={representative.fullName}
                        className="h-16 w-16 shrink-0 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.visibility = "hidden";
                        }}
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xl font-bold text-primary">
                        {representative.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-lg font-bold text-gray-900">
                        {representative.fullName}
                      </p>
                      <p className="truncate text-sm text-gray-500">{representative.email}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge tone={representative.isActive ? "success" : "danger"} dot>
                          {representative.isActive ? "Cuenta activa" : "Cuenta bloqueada"}
                        </Badge>
                        <Badge tone="brand">
                          {ROLE_LABEL[representative.role] ?? representative.role}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field icon={<UserRound size={18} />} label="Nombre completo">
                      {representative.fullName}
                    </Field>

                    <Field icon={<Mail size={18} />} label="Correo">
                      {representative.email}
                    </Field>

                    <Field icon={<Phone size={18} />} label="Teléfono">
                      {representative.tell || "No registrado"}
                    </Field>

                    <Field icon={<Shield size={18} />} label="Estado de la cuenta">
                      <Badge tone={representative.isActive ? "success" : "danger"} dot>
                        {representative.isActive ? "Activo" : "Bloqueado"}
                      </Badge>
                    </Field>

                    <Field icon={<Shield size={18} />} label="Rol">
                      <Badge tone="brand">
                        {ROLE_LABEL[representative.role] ?? representative.role}
                      </Badge>
                    </Field>

                    <Field icon={<CalendarDays size={18} />} label="Cuenta creada">
                      {new Date(representative.created_at).toLocaleDateString("es-CO")}
                    </Field>
                  </div>
                </>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 rounded-card" />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </Modal>

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

function SectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-brand-50 text-primary">
        {icon}
      </span>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon?: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-card border border-gray-200 p-4">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 text-sm font-semibold text-gray-900">{children}</div>
    </div>
  );
}
