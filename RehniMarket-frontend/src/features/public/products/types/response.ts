// Espejo de CatalogResponse (backend > app/schemas/SchemaPublic.py),
// reutilizado para el filtro de categoría del listado público.
export interface PublicCatalog {
  id: string;
  name: string;
}

export interface PublicProductImage {
  id: string;
  url: string;
  is_main: boolean;
}

export interface PublicProductSpecification {
  name: string;
  value: string;
}

export interface PublicProductColor {
  name: string;
  hex_color: string;
}

export interface PublicProductVariant {
  id: string;
  name: string;
  // Pydantic serializa Decimal como string en JSON.
  price: string;
  // Descuento propio de la variante, independiente del descuento del
  // producto base.
  discount_enabled: boolean;
  discount_percentage: number | null;
  final_price: string;
  stock: number;
  color: PublicProductColor | null;
  images: PublicProductImage[];
  specifications: PublicProductSpecification[];
}

export interface PublicProductDetail {
  id: string;
  name: string;
  descripcion: string;
  catalog_name: string;
  company_name: string;
  is_active: boolean;
  price: string;
  discount_enabled: boolean;
  discount_percentage: number | null;
  final_price: string;
  stock: number;
  color: PublicProductColor | null;
  images: PublicProductImage[];
  specifications: PublicProductSpecification[];
  variants: PublicProductVariant[];
}
