export interface PublicAdvertisement {
  id: string;
  image_url: string;
  mobile_image_url: string | null;
  button_link: string | null;
  is_active: boolean;
  order: number;
  created_at: string;
}

export interface PublicProductCard {
  id: string;
  name: string;
  image: string | null;
  company_name: string;
  catalog_id: string;
  catalog_name: string;
  price: string;
  discount_enabled: boolean;
  discount_percentage: number | null;
  final_price: string;
  applies_tax: boolean;
  stock: number;

  average_rating: number | null;
  review_count: number;
}
