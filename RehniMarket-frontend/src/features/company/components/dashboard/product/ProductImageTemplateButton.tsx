/** Botón "Descargar plantilla" de las imágenes de producto y variante: guía 1200×900 px (4:3), el marco
 * de la tarjeta y de la galería, con los formatos y el peso que aceptan web y backend. */
import { Download } from "lucide-react";

import productImageTemplate from "@/assets/product-image-template.png";
import { Button } from "@/shared/components/ui";
import { downloadFile } from "@/shared/utils/downloadFile";

export const PRODUCT_IMAGE_HINT = "1200 × 900 px (4:3) · JPEG, PNG o WEBP · máximo 5 MB por imagen";

export default function ProductImageTemplateButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      leadingIcon={<Download size={16} />}
      onClick={() => downloadFile(productImageTemplate, "plantilla-imagen-producto-1200x900.png")}
    >
      Descargar plantilla
    </Button>
  );
}
