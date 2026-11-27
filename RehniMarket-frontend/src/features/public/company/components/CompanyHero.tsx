/** Cabecera del perfil público: banner, logo superpuesto, identidad, estadísticas reales y Seguir tienda. */
import { CalendarDays, Package, Star, Users } from "lucide-react";

import CompanyAvatar from "@/features/company/components/CompanyAvatar";
import CompanyBanner from "@/features/company/components/CompanyBanner";
import CompanyVerificationBadge from "@/features/company/components/CompanyVerificationBadge";
import FollowCompanyButton from "./FollowCompanyButton";
import FollowersCount from "./FollowersCount";
import { pluralize } from "./companyFormat";

import type { CompanyRating, PublicCompanyProfile } from "../types/response";

interface CompanyHeroProps {
  company: PublicCompanyProfile;
  rating: CompanyRating | null;
  memberSince: string;
  followersCount: number | null;
  /** Sin este objeto no se muestra el botón (empresa, administración y propietario no siguen). */
  follow?: {
    isFollowing: boolean;
    pending: boolean;
    disabled: boolean;
    onClick: () => void;
  };
}

export default function CompanyHero({ company, rating, memberSince, followersCount, follow }: CompanyHeroProps) {
  const reviewCount = rating?.total_reviews ?? 0;
  const averageRating = reviewCount > 0 ? rating?.average_rating : null;

  return (
    <section
      aria-labelledby="company-name"
      className="mt-2 overflow-hidden rounded-card border border-hairline bg-surface-1 shadow-card"
    >
      <CompanyBanner src={company.banner_url} priority />

      <div className="relative bg-surface-1 px-4 pb-5 sm:px-6 sm:pb-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <CompanyAvatar
            src={company.logo_url}
            name={company.name}
            className="-mt-12 h-24 w-24 sm:-mt-14 sm:h-28 sm:w-28 lg:-mt-16 lg:h-32 lg:w-32"
          />

          <div className="min-w-0 flex-1 sm:pt-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1
                id="company-name"
                className="min-w-0 break-words text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
              >
                {company.name}
              </h1>

              {company.is_verified && <CompanyVerificationBadge status="approved" />}
            </div>

            {company.description && (
              <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
                {company.description}
              </p>
            )}

            <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-ink-muted">
              <li className="inline-flex items-center gap-1.5">
                <CalendarDays size={15} aria-hidden="true" />
                Desde {memberSince}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Package size={15} aria-hidden="true" />
                {pluralize(company.total_products, "producto publicado", "productos publicados")}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Users size={15} aria-hidden="true" />
                <FollowersCount count={followersCount} />
              </li>
              {averageRating != null ? (
                <li className="inline-flex items-center gap-1.5">
                  <Star size={15} aria-hidden="true" className="fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-ink">{averageRating.toFixed(1)}</span>
                  ({pluralize(reviewCount, "reseña", "reseñas")})
                </li>
              ) : (
                rating && (
                  <li className="inline-flex items-center gap-1.5">
                    <Star size={15} aria-hidden="true" />
                    Sin reseñas todavía
                  </li>
                )
              )}
            </ul>
          </div>

          {follow && (
            <FollowCompanyButton
              isFollowing={follow.isFollowing}
              pending={follow.pending}
              disabled={follow.disabled}
              onClick={follow.onClick}
              className="w-full sm:w-auto sm:self-center"
            />
          )}
        </div>
      </div>
    </section>
  );
}
