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
// Cuántas reseñas se muestran por defecto en el panel derecho antes de
// que el usuario pida ver todas (ver ALCANCE > rediseño detalle de
// producto, botón "Ver todas las opiniones") - misma página ya cargada
// (page=1, PAGE_SIZE=10), solo se recorta la vista, no se pide de nuevo.
const COMPACT_COUNT = 3;

interface ReviewsSectionProps {
  productId: string;
  // Resumen (promedio/total/distribución) ya calculado por el backend
  // junto con el detalle del producto (ver ProductDetail.tsx > product.
  // average_rating/review_count/rating_distribution) - se reutiliza acá
  // en vez de recalcularlo con la página de reseñas ya cargada, que solo
  // trae 10 a la vez y daría un promedio incompleto.
  averageRating: number | null;
  reviewCount: number;
  distribution: PublicRatingDistribution;
}

// Sección "Opiniones de compradores" del detalle público de producto (ver
// ALCANCE > rediseño detalle de producto, requisito 5): panel izquierdo
// (resumen real) + panel derecho (comentarios recientes, con
// GET /public/products/{id}/reviews, sin auth) + formulario de escritura,
// mostrado solo cuando el backend confirma elegibilidad (compra entregada
// y sin reseña previa - ver ReviewEligibility).
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

  // "Ver todas las opiniones": arranca compacto (COMPACT_COUNT, sin
  // paginación visible) y se expande a la lista completa + paginación al
  // hacer click - sin volver a pedir la página 1, ya está cargada.
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

  // En vista compacta (sin expandir), la paginación real no aplica -
  // siempre son los primeros COMPACT_COUNT de la página 1.
  const visibleReviews = expanded ? reviews : reviews.slice(0, COMPACT_COUNT);

  return (
    <div id="opiniones" className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* PANEL IZQUIERDO */}
      <ProductReviewsSummary
        averageRating={averageRating}
        reviewCount={reviewCount}
        distribution={distribution}
      />

      {/* PANEL DERECHO */}
      <div>
        <div className="mb-4">
          {eligibility?.can_review ? (
            <ReviewForm productId={productId} onCreated={handleCreated} />
          ) : eligibility?.already_reviewed ? (
            <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Ya reseñaste este producto.</p>

              <button
                onClick={() => setConfirmDeleteOpen(true)}
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
          reviews={visibleReviews}
          loading={loading}
          page={page}
          totalPages={expanded ? totalPages : 1}
          onPageChange={setPage}
        />

        {!expanded && !loading && total > COMPACT_COUNT && (
          <button
            onClick={() => setExpanded(true)}
            className="mt-4 flex items-center gap-1 text-sm font-medium text-[#6D0F2D] hover:underline"
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
