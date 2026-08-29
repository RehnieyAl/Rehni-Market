import { Link } from "react-router-dom";
import { BadgeCheck, ShieldCheck, Store } from "lucide-react";

interface SellerCardProps {
  companyId: string;
  companyName: string;
  companyLogo: string | null;
  isVerified: boolean;
}

// Tarjeta "Vendido por": nombre, badge de verificación y enlace al perfil público de la empresa.
export default function SellerCard({
  companyId,
  companyName,
  companyLogo,
  isVerified,
}: SellerCardProps) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
          {companyLogo ? (
            <img src={companyLogo} alt={companyName} className="h-full w-full object-cover" />
          ) : (
            <Store size={18} className="text-gray-400" />
          )}
        </div>

        <div className="min-w-0">
          <p className="text-xs text-gray-500">Vendido por</p>

          <div className="flex items-center gap-1.5">
            <p className="truncate font-semibold text-gray-900">{companyName}</p>

            {isVerified && (
              <BadgeCheck size={16} className="shrink-0 text-blue-500" aria-label="Empresa verificada" />
            )}
          </div>

          {isVerified && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-green-600">
              <ShieldCheck size={12} />
              Empresa verificada
            </p>
          )}
        </div>
      </div>

      <Link
        to={`/company/${companyId}`}
        className="shrink-0 rounded-xl border border-[#6D0F2D] px-4 py-2 text-sm font-medium text-[#6D0F2D] transition hover:bg-[#6D0F2D]/5"
      >
        Ver tienda
      </Link>
    </div>
  );
}
