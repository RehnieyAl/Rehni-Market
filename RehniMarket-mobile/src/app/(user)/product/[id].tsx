import { useLocalSearchParams } from "expo-router";

import { ProductDetailScreen } from "@/screens/product-detail/ProductDetailScreen";

// RUTA MÍNIMA (ver Fase Product Detail > RUTA): solo obtiene el `id` real
// vía Expo Router y renderiza ProductDetailScreen - toda la carga/lógica
// vive en el screen, no acá.
export default function ProductDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <ProductDetailScreen productId={id} />;
}
