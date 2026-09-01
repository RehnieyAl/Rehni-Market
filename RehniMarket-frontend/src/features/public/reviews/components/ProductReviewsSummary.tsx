import { Star } from "lucide-react";

import StarRating from "./StarRating";

import type { PublicRatingDistribution } from "@/features/public/products/types/response";

interface ProductReviewsSummaryProps {
  averageRating: number | null;
  reviewCount: number;
  distribution: PublicRatingDistribution;
}

const STARS: { key: keyof PublicRatingDistribution; label: number }[] = [
  { key: "five", label: 5 },
  { key: "four", label: 4 },
  { key: "three", label: 3 },
  { key: "two", label: 2 },
  { key: "one", label: 1 },
];

export default function ProductReviewsSummary({
  averageRating,
  reviewCount,
  distribution,
}: ProductReviewsSummaryProps) {
  return (
    <div className="rounded-card border border-gray-200 bg-white p-5">
      <h3 className="font-semibold text-gray-900">Opiniones de compradores</h3>

      {reviewCount === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          Este producto todavía no tiene reseñas.
        </p>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-4xl font-bold text-gray-900">
              {averageRating?.toFixed(1)}
            </span>

            <div>
              <StarRating value={Math.round(averageRating ?? 0)} size={16} />

              <p className="mt-0.5 text-xs text-gray-500">
                ({reviewCount} {reviewCount === 1 ? "opinión" : "opiniones"})
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-1.5">
            {STARS.map(({ key, label }) => {
              const count = distribution[key];
              const percentage = reviewCount ? Math.round((count / reviewCount) * 100) : 0;

              return (
                <div key={key} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-2 shrink-0 text-right">{label}</span>
                  <Star size={12} className="shrink-0 fill-amber-400 text-amber-400" />

                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <span className="w-6 shrink-0 text-right text-gray-500">{count}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
