/** Inicio del panel del comprador: métricas reales (pedidos en curso, saldo, favoritos, devoluciones),
 * pedidos recientes y productos del día. Los datos personales se editan en Configuración de cuenta. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Coins, Heart, House, Package, RotateCcw, ShoppingBag, Store } from "lucide-react";

import { useFavorites } from "@/features/favorites/context/useFavorites";
import { getDailyProducts } from "@/features/public/home/api/homeService";
import ProductCard from "@/features/public/home/components/ProductCard";
import ProductCardSkeleton from "@/features/public/home/components/ProductCardSkeleton";
import { getMyOrders } from "@/features/orders/api/orderService";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/features/orders/utils/orderStatus";
import { getMyReturns } from "@/features/returns/api/returnService";
import { getMyWallet } from "@/features/wallet/api/walletService";
import DashboardPageHeader from "@/shared/components/dashboard/DashboardPageHeader";
import DashboardSection from "@/shared/components/dashboard/DashboardSection";
import StatCard from "@/shared/components/dashboard/StatCard";
import { Badge, EmptyState, ErrorState, Skeleton } from "@/shared/components/ui";
import { buttonClasses } from "@/shared/components/ui/buttonVariants";
import { formatPrice } from "@/shared/utils/formatPrice";

import type { Order } from "@/features/orders/types/response";
import type { PublicProductCard } from "@/features/public/home/types/response";

const DAILY_LIMIT = 4;
const RECENT_ORDERS = 3;
const IN_PROGRESS = new Set(["pending", "paid", "processing", "shipped"]);

interface Summary {
  inProgress: number;
  balance: string;
  returns: number;
  recentOrders: Order[];
}

interface HomeProps {
  onNavigate: (tab: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const { favoriteIds, loading: favoritesLoading } = useFavorites();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryFailed, setSummaryFailed] = useState(false);
  const [products, setProducts] = useState<PublicProductCard[] | null>(null);

  useEffect(() => {
    Promise.all([getMyOrders(1, 10), getMyWallet(), getMyReturns(1, 1)])
      .then(([orders, wallet, returns]) =>
        setSummary({
          inProgress: orders.items.filter((order) => IN_PROGRESS.has(order.status)).length,
          balance: wallet.balance,
          returns: returns.total,
          recentOrders: orders.items.slice(0, RECENT_ORDERS),
        }),
      )
      .catch((error) => {
        console.error("Error cargando el resumen de la cuenta:", error);
        setSummaryFailed(true);
      });
  }, []);

  useEffect(() => {
    getDailyProducts(DAILY_LIMIT)
      .then(setProducts)
      .catch((error) => {
        console.error("Error cargando los productos del día:", error);
        setProducts([]);
      });
  }, []);

  const loading = summary === null && !summaryFailed;
  // Sin datos no se muestran ceros que parezcan reales.
  const metric = (value: (data: Summary) => string) => (summary ? value(summary) : loading ? "…" : "—");

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon={<House size={26} />}
        title="Inicio"
        action={
          <Link to="/products" className={buttonClasses()}>
            <ShoppingBag size={18} aria-hidden="true" />
            Seguir comprando
          </Link>
        }
      />

      <section aria-label="Resumen de tu cuenta" className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pedidos en curso"
          value={metric((data) => String(data.inProgress))}
          subtitle="Pendientes, en preparación o enviados"
          icon={<Package size={22} />}
          tone="brand"
        />
        <StatCard
          title="Saldo RehniCoin"
          value={metric((data) => `${formatPrice(data.balance)} RC`)}
          subtitle="Disponible"
          icon={<Coins size={22} />}
          tone="success"
        />
        <StatCard
          title="Favoritos"
          value={favoritesLoading ? "…" : String(favoriteIds.size)}
          subtitle="Productos guardados"
          icon={<Heart size={22} />}
          tone="danger"
        />
        <StatCard
          title="Devoluciones"
          value={metric((data) => String(data.returns))}
          subtitle="Solicitudes registradas"
          icon={<RotateCcw size={22} />}
          tone="info"
        />
      </section>

      <DashboardSection
        title="Pedidos recientes"
        description="Tus últimas compras y su estado."
        icon={<Package size={18} />}
        action={
          summary && summary.recentOrders.length > 0 ? (
            <button
              type="button"
              onClick={() => onNavigate("orders")}
              className="inline-flex items-center gap-1 text-sm font-medium brand-link"
            >
              Ver todos <ChevronRight size={15} aria-hidden="true" />
            </button>
          ) : undefined
        }
        bodyClassName="p-0 pt-4"
      >
        {summaryFailed ? (
          <ErrorState variant="plain" title="No pudimos cargar tus pedidos recientes" />
        ) : !summary ? (
          <div className="space-y-3 px-4 pb-4 sm:px-5">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-16 rounded-control" />
            ))}
          </div>
        ) : summary.recentOrders.length === 0 ? (
          <EmptyState
            variant="plain"
            icon={<ShoppingBag size={22} />}
            title="Todavía no tienes pedidos"
            description="Tu compra más reciente aparecerá aquí."
          />
        ) : (
          <ul className="divide-y divide-hairline border-t border-hairline">
            {summary.recentOrders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface-2 text-sm font-semibold text-ink"
                >
                  {order.companyName.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {order.firstItemName}
                    {order.totalItems > 1 ? ` y ${order.totalItems - 1} producto(s) más` : ""}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {order.reference} · {order.companyName} · {new Date(order.createdAt).toLocaleDateString("es-CO")}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-ink">{formatPrice(order.total)}</span>
                <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>

      <DashboardSection
        title="Productos del día"
        icon={<Store size={18} />}
        action={
          <Link to="/products" className="inline-flex items-center gap-1 text-sm font-medium brand-link">
            Ver catálogo <ChevronRight size={15} aria-hidden="true" />
          </Link>
        }
      >
        {products === null ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: DAILY_LIMIT }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState variant="plain" icon={<ShoppingBag size={22} />} title="Todavía no hay productos del día" />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );
}
