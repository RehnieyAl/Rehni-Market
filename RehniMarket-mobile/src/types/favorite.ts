export interface FavoriteProduct {
  id: string;
  name: string;
  image: string | null;
  companyName: string;
  price: string;
  finalPrice: string;
  discountEnabled: boolean;
  isActive: boolean;
}

export interface Favorite {
  id: string;
  createdAt: string;
  product: FavoriteProduct;
}

export interface AddFavoriteRequest {
  productId: string;
}
