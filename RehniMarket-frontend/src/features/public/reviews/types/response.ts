// Espejo de ReviewResponse / ReviewsPaginatedResponse / EligibilityResponse
// (backend > app/schemas/SchemaCommerce/SchemaReview.py).
export interface Review {
  id: string;
  productId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string | null;
  buyerName: string;
  buyerPhoto: string | null;
}

export interface ReviewsPaginated {
  items: Review[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Le dice al frontend si mostrar el formulario de "Escribir reseña" sin
// reimplementar las reglas de negocio (compra entregada, reseña ya
// existente) del lado del cliente - ver backend >
// ReviewService.check_review_eligibility_service.
export interface ReviewEligibility {
  can_review: boolean;
  already_reviewed: boolean;
  my_review_id: string | null;
}
