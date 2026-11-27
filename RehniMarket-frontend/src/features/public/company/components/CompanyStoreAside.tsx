/** Columna izquierda del perfil público: un solo contenedor "Sobre" con la descripción, la antigüedad, los
 * productos publicados, el contacto comercial que la empresa autorizó publicar y, al final, "Reportar empresa".
 * La calificación y Seguir viven en la cabecera. */
import type { ReactNode } from "react";
import { Store } from "lucide-react";

import CompanyDescription from "./CompanyDescription";

import type { PublicCompanyProfile } from "../types/response";

interface CompanyStoreAsideProps {
  company: PublicCompanyProfile;
  memberSince: string;
  /** Acción "Reportar empresa" (con su modal), al final del contenedor; ausente para roles que no reportan. */
  footer?: ReactNode;
}

const UNAVAILABLE = <span className="text-ink-muted">No disponible</span>;

// tel: solo admite dígitos y un + inicial; el backend ya lo guarda normalizado, esto es una defensa más.
function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export default function CompanyStoreAside({ company, memberSince, footer }: CompanyStoreAsideProps) {
  const rows: { label: string; value: ReactNode }[] = [
    { label: "En RehniMarket desde", value: memberSince },
    { label: "Productos publicados", value: <span className="tabular-nums">{company.total_products}</span> },
    {
      label: "Correo comercial",
      value: company.contact_email ? (
        <a href={`mailto:${company.contact_email}`} className="brand-link break-all">
          {company.contact_email}
        </a>
      ) : (
        UNAVAILABLE
      ),
    },
    {
      label: "Teléfono comercial",
      value: company.contact_phone ? (
        <a href={telHref(company.contact_phone)} className="brand-link tabular-nums">
          {company.contact_phone}
        </a>
      ) : (
        UNAVAILABLE
      ),
    },
  ];

  return (
    <aside
      aria-labelledby="company-about-title"
      className="min-w-0 self-start rounded-card border border-hairline bg-surface-1 p-5 lg:sticky lg:top-24"
    >
      <h2 id="company-about-title" className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Store size={16} aria-hidden="true" className="text-ink-muted" />
        Sobre {company.name}
      </h2>

      <CompanyDescription description={company.description} />

      <dl className="mt-4 divide-y divide-hairline border-t border-hairline text-sm">
        {rows.map((row) => (
          <div key={row.label} className="py-2.5">
            <dt className="text-ink-muted">{row.label}</dt>
            <dd className="mt-0.5 min-w-0 font-medium text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>

      {footer && <div className="mt-3 border-t border-hairline pt-3">{footer}</div>}
    </aside>
  );
}
