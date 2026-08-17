import { useCallback, useEffect, useState } from "react";

import ReviewsList from "./ReviewsList";
import ReviewForm from "./ReviewForm";

import { getProductReviews, getReviewEligibility, deleteReview } from "../api/reviewService";
import { useRole } from "@/hooks/useRole";
import { useAlert } from "@/shared/components/alert/useAlert";

import type { Review, ReviewEligibility } from "../types/response";

const PAGE_SIZE = 10;

interface ReviewsSectionProps {
  productId: string;
}

// Sección de reseñas del detalle público de producto (ver ALCANCE >
// sistema de reseñas): listado real (GET /public/products/{id}/reviews,
// sin auth) + formulario de escritura, mostrado solo cuando el backend
// confirma elegibilidad (compra entregada y sin reseña previa - ver
// ReviewEligibility).
export default function ReviewsSection({ productId }: ReviewsSectionProps) {
  const { role } = useRole();
  const { showAlert } = useAlert();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getProductReviews(productId, page, PAGE_SIZE);

      setReviews(response.items);
      setTotal(response.total);
      setTotalPages(response.total_pages || 1);
    } catch (error) {
      console.error("Error cargando reseñas:", error);
    } finally {
      setLoading(false);
    }
  }, [productId, page]);

  const loadEligibility = useCallback(async () => {
    if (role !== "user") {
      setEligibility(null);
      return;
    }

    try {
      const response = await getReviewEligibility(productId);
      setEligibility(response);
    } catch (error) {
      console.error("Error verificando elegibilidad de reseña:", error);
    }
  }, [productId, role]);

  useEffect(() => {
    const timeout = setTimeout(loadReviews);
    return () => clearTimeout(timeout);
  }, [loadReviews]);

  useEffect(() => {
    const timeout = setTimeout(loadEligibility);
    return () => clearTimeout(timeout);
  }, [loadEligibility]);

  const handleCreated = () => {
    setPage(1);
    loadReviews();
    loadEligibility();
  };

  const handleDeleteMyReview = async () => {
    if (!eligibility?.my_review_id) return;
    if (!window.confirm("¿Eliminar tu reseña?")) return;

    try {
      setDeleting(true);

      await deleteReview(eligibility.my_review_id);

      showAlert("success", "Tu reseña fue eliminada.");
      loadReviews();
      loadEligibility();
    } catch (error) {
      console.error("Error eliminando la reseña:", error);
      showAlert("error", "No se pudo eliminar tu reseña.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-2xl font-bold">Reseñas</h2>

        <span className="text-sm text-gray-500">
          ({total} {total === 1 ? "reseña" : "reseñas"})
        </span>
      </div>

      <div className="mb-6">
        {eligibility?.can_review ? (
          <ReviewForm productId={productId} onCreated={handleCreated} />
        ) : eligibility?.already_reviewed ? (
          <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-600">Ya reseñaste este producto.</p>

            <button
              onClick={handleDeleteMyReview}
              disabled={deleting}
              className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
            >
              {deleting ? "Eliminando..." : "Eliminar mi reseña"}
            </button>
          </div>
        ) : role === "user" ? (
          <p className="text-sm text-gray-500">
            Podrás reseñar este producto una vez que te sea entregado.
          </p>
        ) : null}
      </div>

      <ReviewsList
        reviews={reviews}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </section>
  );
}
