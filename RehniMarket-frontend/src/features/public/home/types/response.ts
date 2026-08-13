export interface PublicAdvertisement {
  id: string;
  title: string;
  description: string | null;
  // Desktop/tablet
  image_url: string;
  // Mobile - nullable, hacer fallback a image_url si es null
  mobile_image_url: string | null;
  button_text: string | null;
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
  // Pydantic serializa Decimal como string en JSON (mismo criterio que
  // ProductDetailResponse en el dashboard de empresa).
  price: string;
  discount_enabled: boolean;
  // null cuando discount_enabled es false.
  discount_percentage: number | null;
  final_price: string;
}
