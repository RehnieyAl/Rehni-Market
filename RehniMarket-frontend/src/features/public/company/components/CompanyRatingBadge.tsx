import { useEffect, useState } from "react";
import { Star } from "lucide-react";

import { getCompanyRating } from "../api/companyService";

import type { CompanyRating } from "../types/response";

interface CompanyRatingBadgeProps {
  companyId: string;
  className?: string;
}

// Único componente de reputación de empresa (ver ALCANCE >
// Calificaciones de empresa, regla 6) - reutilizado en Dashboard Empresa
// (Home.tsx), "Mi tienda" (MyCompany.tsx) y el perfil público de empresa
// (CompanyProfile.tsx). Consume el mismo endpoint reutilizable
// (GET /public/company/{id}/rating) en los 3 lugares, no recalcula nada
// en el cliente.
export default function CompanyRatingBadge({ companyId, className = "" }: CompanyRatingBadgeProps) {
  const [rating, setRating] = useState<CompanyRating | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getCompanyRating(companyId)
      .then((response) => {
        if (!cancelled) setRating(response);
      })
      .catch((error) => console.error("Error cargando la reputación de la empresa:", error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  if (loading) {
    return (
      <span className={`inline-flex h-5 w-32 animate-pulse rounded bg-gray-200 ${className}`} />
    );
  }

  // Regla 7: "Sin calificaciones todavía" cuando no hay reseñas -
  // nunca "0.0 estrellas" (average_rating es None en ese caso, ver
  // CompanyRatingResponse).
  if (!rating || rating.total_reviews === 0 || rating.average_rating === null) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-sm text-gray-500 ${className}`}>
        <Star size={16} className="text-gray-300" />
        Sin calificaciones todavía
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 ${className}`}>
      <Star size={16} className="fill-amber-400 text-amber-400" />
      {rating.average_rating.toFixed(1)} ({rating.total_reviews}{" "}
      {rating.total_reviews === 1 ? "reseña" : "reseñas"})
    </span>
  );
}
