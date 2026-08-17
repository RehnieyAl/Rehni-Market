import StarRating from "./StarRating";

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
    return <p className="text-sm text-gray-500">Cargando reseñas...</p>;
  }

  if (reviews.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
        Este producto todavía no tiene reseñas.
      </p>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-2xl border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#6D0F2D] text-sm font-bold text-white">
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
          <button
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50"
          >
            Anterior
          </button>

          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
