import { Link } from "react-router-dom";
import { BadgeCheck, ShieldCheck, Store } from "lucide-react";

interface SellerCardProps {
  companyId: string;
  companyName: string;
  companyLogo: string | null;
  isVerified: boolean;
}

export default function SellerCard({
  companyId,
  companyName,
  companyLogo,
  isVerified,
}: SellerCardProps) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-card border border-gray-200 bg-surface-1 p-4 dark:border-hairline dark:bg-surface-2">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-white/5">
          {companyLogo ? (
            <img src={companyLogo} alt={companyName} className="h-full w-full object-cover" />
          ) : (
            <Store size={18} className="text-gray-400 dark:text-ink-muted" />
          )}
        </div>

        <div className="min-w-0">
          <p className="text-xs text-gray-500 dark:text-ink-muted">Vendido por</p>

          <div className="flex items-center gap-1.5">
            <p className="truncate font-semibold text-gray-900 dark:text-ink">{companyName}</p>

            {isVerified && (
              <BadgeCheck size={16} className="shrink-0 text-blue-500" aria-label="Empresa verificada" />
            )}
          </div>

          {isVerified && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-success dark:text-stock">
              <ShieldCheck size={12} />
              Empresa verificada
            </p>
          )}
        </div>
      </div>

      <Link
        to={`/company/${companyId}`}
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-control border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-white/25 dark:text-ink dark:hover:bg-white/10"
      >
        Ver tienda
      </Link>
    </div>
  );
}
