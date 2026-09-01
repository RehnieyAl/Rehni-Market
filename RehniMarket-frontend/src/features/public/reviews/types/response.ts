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

export interface ReviewEligibility {
  can_review: boolean;
  already_reviewed: boolean;
  my_review_id: string | null;
}
