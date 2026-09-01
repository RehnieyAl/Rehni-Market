import { useLocalSearchParams } from "expo-router";

import { CatalogScreen } from "@/screens/catalog/CatalogScreen";

export default function ProductsRoute() {
  const { catalogId, catalogName } = useLocalSearchParams<{
    catalogId?: string;
    catalogName?: string;
  }>();

  return <CatalogScreen initialCatalogId={catalogId} initialCatalogName={catalogName} />;
}
