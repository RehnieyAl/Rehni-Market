export type AttributeRole = "product" | "variant";
export type AttributeInputType = "select" | "color" | "text" | "number";

export interface CatalogAttributeOption {
  id: string;
  value: string;
  hex_color: string | null;
  position: number;
}

export interface CatalogAttribute {
  id: string;
  name: string;
  input_type: AttributeInputType;
  unit: string | null;
  position: number;
  options: CatalogAttributeOption[];
}

export interface CatalogAttributes {
  product_attributes: CatalogAttribute[];
  variant_attributes: CatalogAttribute[];
}

export interface AttributeValueInput {
  attributeId: string;
  value: string;
}
