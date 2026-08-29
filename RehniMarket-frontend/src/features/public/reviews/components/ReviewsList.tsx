import StarRating from "./StarRating";
import { Button, EmptyState, Skeleton } from "@/shared/components/ui";

import type { Review } from "../types/response";

interface ReviewsListProps {
  reviews: Review[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function ReviewsList({
  reviews,
  loading,
  page,
  totalPages,
  onPageChange,
}: ReviewsListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex gap-3 rounded-card border border-gray-200 p-4">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        title="Este producto todavía no tiene reseñas"
        description="Sé el primero en compartir tu opinión después de comprarlo."
      />
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-card border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold text-primary-fg">
                {review.buyerPhoto ? (
                  <img
                    src={review.buyerPhoto}
                    alt={review.buyerName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  review.buyerName.charAt(0).toUpperCase()
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-gray-900">{review.buyerName}</p>

                  <span className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString("es-CO")}
                  </span>
                </div>

                <StarRating value={review.rating} size={14} />

                {review.comment && (
                  <p className="mt-2 text-sm text-gray-600">{review.comment}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
          >
            Anterior
          </Button>

          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
