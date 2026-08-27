// Espejo de RehniMarket-frontend/src/features/public/products/types/
// response.ts > PublicCatalog (backend: SchemaPublic.py > CatalogResponse).
// `product_count` ya viene calculado del backend, nunca se calcula acá.
export interface PublicCatalog {
  id: string;
  name: string;
  product_count: number;
  image_url: string | null;
}
