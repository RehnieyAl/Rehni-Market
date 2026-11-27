/** Cabecera del inicio del panel de empresa: banner de fondo compacto, logo, nombre, verificación,
 * descripción, datos de contacto reales y acceso a "Mi tienda" para editarlos. */
import { CalendarDays, Mail, MapPin, Pencil } from "lucide-react";

import CompanyAvatar from "@/features/company/components/CompanyAvatar";
import CompanyBanner from "@/features/company/components/CompanyBanner";
import CompanyVerificationBadge from "@/features/company/components/CompanyVerificationBadge";
import CompanyRatingBadge from "@/features/public/company/components/CompanyRatingBadge";
import { formatMemberSince } from "@/features/public/company/components/companyFormat";
import { Skeleton } from "@/shared/components/ui";

import type { DashboardHomeResponse } from "@/features/company/types/response";

interface CompanyDashboardHeroProps {
  company: DashboardHomeResponse | null;
  email?: string | null;
  onEditProfile: () => void;
}

export default function CompanyDashboardHero({ company, email, onEditProfile }: CompanyDashboardHeroProps) {
  return (
    <section
      aria-label="Tu empresa"
      className="relative isolate overflow-hidden rounded-card border border-hairline bg-surface-1"
    >
      <CompanyBanner src={company?.banner} alt="Banner de la empresa" variant="cover" priority />
      {/* Velo oscuro a la izquierda: el texto se lee igual sobre la plantilla o sobre un banner propio claro. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-canvas/95 via-canvas/75 to-canvas/20"
      />

      <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6 lg:min-h-48 lg:px-8">
        {company ? (
          <CompanyAvatar
            src={company.logo}
            name={company.nameCompany}
            shape="circle"
            className="h-20 w-20 sm:h-28 sm:w-28"
          />
        ) : (
          <Skeleton className="h-20 w-20 shrink-0 rounded-full sm:h-28 sm:w-28" />
        )}

        <div className="min-w-0 flex-1">
          {company ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="min-w-0 break-words text-2xl font-semibold text-ink sm:text-3xl">
                {company.nameCompany}
              </h2>
              <CompanyVerificationBadge status={company.certificate_status} />
            </div>
          ) : (
            <Skeleton className="h-8 w-56" />
          )}

          {company?.description && (
            <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-ink-muted sm:text-base">{company.description}</p>
          )}

          <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-ink-muted">
            <li className="inline-flex items-center gap-1.5">
              <CalendarDays size={15} aria-hidden="true" />
              {company ? `Desde ${formatMemberSince(company.memberAT)}` : <Skeleton className="h-4 w-32" />}
            </li>
            {email && (
              <li className="inline-flex min-w-0 items-center gap-1.5">
                <Mail size={15} aria-hidden="true" className="shrink-0" />
                <span className="truncate">{email}</span>
              </li>
            )}
            {company?.addressCompany && (
              <li className="inline-flex min-w-0 items-center gap-1.5">
                <MapPin size={15} aria-hidden="true" className="shrink-0" />
                <span className="truncate">{company.addressCompany}</span>
              </li>
            )}
            {company && (
              <li>
                <CompanyRatingBadge companyId={company.id} />
              </li>
            )}
          </ul>
        </div>

        <button
          type="button"
          onClick={onEditProfile}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-control border border-white/30 bg-black/50 px-4 text-sm font-medium text-white transition-colors hover:border-white/60 hover:bg-black/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary sm:self-center"
        >
          <Pencil size={15} aria-hidden="true" />
          Editar perfil
        </button>
      </div>
    </section>
  );
}
