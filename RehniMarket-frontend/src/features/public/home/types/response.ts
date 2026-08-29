export interface PublicAdvertisement {
  id: string;
  title: string;
  description: string | null;
  // Desktop/tablet
  image_url: string;
  // Móvil, nullable: fallback a image_url si es null
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
  // Catálogo del producto; habilita filtrar/navegar por categoría.
  catalog_id: string;
  catalog_name: string;
  // Pydantic serializa Decimal como string.
  price: string;
  discount_enabled: boolean;
  // null cuando discount_enabled es false.
  discount_percentage: number | null;
  final_price: string;
  // Para el badge "Agotado" y el filtro de disponibilidad.
  stock: number;

  // Calificación; null/0 cuando no tiene reseñas activas.
  average_rating: number | null;
  review_count: number;
}
