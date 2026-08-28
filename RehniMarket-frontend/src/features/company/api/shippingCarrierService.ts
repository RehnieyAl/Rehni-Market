import { api } from "@/api/Client";
import type { ShippingCarrierResponse } from "../types/response";

// Transportadoras activas (ver ALCANCE > Transportadoras) - mismo patrón
// que getCatalogs() (catalogService.ts): ruta pública, la Empresa no
// tiene un endpoint autenticado propio para leer este catálogo global
// administrado por Admin/Owner.
export async function getShippingCarriers() {
  const { data } = await api.get<ShippingCarrierResponse[]>(
    "/public/shipping-carriers",
  );

  return data;
}
