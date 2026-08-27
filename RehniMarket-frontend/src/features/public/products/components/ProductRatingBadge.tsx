import StarRating from "@/features/public/reviews/components/StarRating";

interface ProductRatingBadgeProps {
  averageRating: number | null;
  reviewCount: number;
}

// Calificación promedio + total de opiniones, junto al nombre del
// producto (ver ALCANCE > rediseño detalle de producto, requisito 2).
// Reutiliza StarRating (mismo componente que el listado de reseñas y el
// formulario) - datos reales del backend (product.average_rating/
// review_count, ya calculados en publicService/Products.py), nunca
// quemados. Si todavía no hay reseñas, no se muestra un promedio "0.0"
// con 0 opiniones - simplemente no hay nada que mostrar todavía.
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
