import { useCallback, useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";

import ReviewsList from "./ReviewsList";
import ReviewForm from "./ReviewForm";
import ProductReviewsSummary from "./ProductReviewsSummary";

import ConfirmModal from "@/shared/components/ConfirmModal";
import { getProductReviews, getReviewEligibility, deleteReview } from "../api/reviewService";
import { useRole } from "@/hooks/useRole";
import { useAlert } from "@/shared/components/alert/useAlert";

import type { Review, ReviewEligibility } from "../types/response";
import type { PublicRatingDistribution } from "@/features/public/products/types/response";

const PAGE_SIZE = 10;
// Cuántas reseñas se muestran antes de "Ver todas": recorta la vista de la página 1 ya cargada.
const COMPACT_COUNT = 3;

interface ReviewsSectionProps {
  productId: string;
  // Resumen (promedio/total/distribución) ya calculado por el backend; se reutiliza tal cual.
  averageRating: number | null;
  reviewCount: number;
  distribution: PublicRatingDistribution;
}

// Sección "Opiniones de compradores": resumen + comentarios recientes + formulario
// (solo si el backend confirma elegibilidad: compra entregada, sin reseña previa).
export default function ReviewsSection({
  productId,
  averageRating,
  reviewCount,
  distribution,
}: ReviewsSectionProps) {
  const { role } = useRole();
  const { showAlert } = useAlert();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // "Ver todas": arranca compacto (COMPACT_COUNT) y se expande a lista completa + paginación, sin re-fetch.
  const [expanded, setExpanded] = useState(false);

  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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
    setExpanded(true);
    loadReviews();
    loadEligibility();
  };

  const handleDeleteMyReview = async () => {
    if (!eligibility?.my_review_id) return;

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
      setConfirmDeleteOpen(false);
    }
  };

  // En vista compacta la paginación no aplica: siempre los primeros COMPACT_COUNT de la página 1.
  const visibleReviews = expanded ? reviews : reviews.slice(0, COMPACT_COUNT);

  return (
    <div id="opiniones" className="grid gap-6 lg:grid-cols-[280px_1fr]">

      <ProductReviewsSummary
        averageRating={averageRating}
        reviewCount={reviewCount}
        distribution={distribution}
      />

      <div>
        <div className="mb-4">
          {eligibility?.can_review ? (
            <ReviewForm productId={productId} onCreated={handleCreated} />
          ) : eligibility?.already_reviewed ? (
            <div className="flex items-center justify-between rounded-card border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Ya reseñaste este producto.</p>

              <button
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={deleting}
                className="text-sm font-medium text-danger hover:underline disabled:opacity-50"
              >
                {deleting ? "Eliminando…" : "Eliminar mi reseña"}
              </button>
            </div>
          ) : role === "user" ? (
            <p className="text-sm text-gray-500">
              Podrás reseñar este producto una vez que te sea entregado.
            </p>
          ) : null}
        </div>

        <ReviewsList
          reviews={visibleReviews}
          loading={loading}
          page={page}
          totalPages={expanded ? totalPages : 1}
          onPageChange={setPage}
        />

        {!expanded && !loading && total > COMPACT_COUNT && (
          <button
            onClick={() => setExpanded(true)}
            className="mt-4 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver todas las opiniones
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        title="Eliminar reseña"
        message="¿Eliminar tu reseña? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={handleDeleteMyReview}
        onClose={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
