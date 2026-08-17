import { api } from "@/api/Client";

import type { Review, ReviewsPaginated, ReviewEligibility } from "../types/response";

// Listado público de reseñas de un producto (sin auth) - reseñas
// ACTIVAS únicamente, ver backend > list_product_reviews_service.
export async function getProductReviews(
  productId: string,
  page = 1,
  limit = 10,
): Promise<ReviewsPaginated> {
  const { data } = await api.get<ReviewsPaginated>(`/public/products/${productId}/reviews`, {
    params: { page, limit },
  });

  return data;
}

// Resto de endpoints requieren auth (rol USER, ver
// app/middleware/RolePermissions.py > "/reviews").
export async function getReviewEligibility(productId: string): Promise<ReviewEligibility> {
  const { data } = await api.get<ReviewEligibility>(`/reviews/eligibility/${productId}`);

  return data;
}

export async function createReview(
  productId: string,
  rating: number,
  comment?: string,
): Promise<Review> {
  const { data } = await api.post<Review>("/reviews", { productId, rating, comment });

  return data;
}

export async function deleteReview(reviewId: string): Promise<void> {
  await api.delete(`/reviews/${reviewId}`);
}
