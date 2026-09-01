import StarRating from "@/features/public/reviews/components/StarRating";

interface ProductRatingBadgeProps {
  averageRating: number | null;
  reviewCount: number;
}

export default function ProductRatingBadge({
  averageRating,
  reviewCount,
}: ProductRatingBadgeProps) {
  if (reviewCount === 0 || averageRating === null) return null;

  return (
    <div className="mt-2 flex items-center gap-2">
      <StarRating value={Math.round(averageRating)} size={16} />

      <span className="text-sm font-semibold text-gray-900">{averageRating.toFixed(1)}</span>

      <span className="text-sm text-gray-500">
        ({reviewCount} {reviewCount === 1 ? "opinión" : "opiniones"})
      </span>
    </div>
  );
}
