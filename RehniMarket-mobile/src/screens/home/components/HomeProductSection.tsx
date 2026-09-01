import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProductPreviewGrid } from "@/components/product/ProductPreviewGrid";
import { spacing } from "@/theme";
import type { PublicProductCard } from "@/types/product";

interface Props {
  title: string;
  fetcher: () => Promise<PublicProductCard[]>;
  onSeeAll: () => void;
  limit?: number;
}

export function HomeProductSection({ title, fetcher, onSeeAll, limit = 6 }: Props) {
  const [products, setProducts] = useState<PublicProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setFailed(false);
      const response = await fetcher();
      setProducts(response.slice(0, limit));
    } catch (error) {
      console.error(`Error cargando la sección "${title}":`, error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [fetcher, limit, title]);

  useEffect(() => {
    load();
  }, [load]);

  if (failed || (!loading && products.length === 0)) {
    return null;
  }

  return (
    <View style={styles.section}>
      <SectionHeader
        title={title}
        actionLabel={!loading ? "Ver todos" : undefined}
        onPressAction={!loading ? onSeeAll : undefined}
      />
      <ProductPreviewGrid products={products} loading={loading} skeletonCount={limit} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
});
