import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Coins, Heart, Package, ShoppingBag } from "lucide-react";

import { useAuth } from "@/features/public/auth/context/useAuth";

import StatCard from "@/shared/components/dashboard/StatCard";
import { Badge, EmptyState, Skeleton } from "@/shared/components/ui";
import { buttonClasses } from "@/shared/components/ui/buttonVariants";

import { getDailyProducts } from "@/features/public/home/api/homeService";
import ProductCard from "@/features/public/home/components/ProductCard";
import ProductCardSkeleton from "@/features/public/home/components/ProductCardSkeleton";

import { getMyOrders } from "@/features/orders/api/orderService";
import { useFavorites } from "@/features/favorites/context/useFavorites";
import { getMyWallet } from "@/features/wallet/api/walletService";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/features/orders/utils/orderStatus";
import { formatPrice } from "@/shared/utils/formatPrice";

import type { PublicProductCard } from "@/features/public/home/types/response";
import type { Order } from "@/features/orders/types/response";

const RECOMMENDED_LIMIT = 4;

const PENDING_STATUSES = new Set(["pending", "paid", "processing", "shipped"]);

export default function Home() {
  const { user } = useAuth();
  const { favoriteIds, loading: favoritesLoading } = useFavorites();

  const [products, setProducts] = useState<PublicProductCard[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const [pendingOrders, setPendingOrders] = useState(0);
  const [walletBalance, setWalletBalance] = useState("0");
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProductsLoading(true);
        const data = await getDailyProducts(RECOMMENDED_LIMIT);
        setProducts(data);
      } catch (error) {
        console.error("Error cargando productos recomendados:", error);
      } finally {
        setProductsLoading(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setSummaryLoading(true);

        const [orders, wallet] = await Promise.all([getMyOrders(1, 10), getMyWallet()]);

        setPendingOrders(
          orders.items.filter((order) => PENDING_STATUSES.has(order.status)).length,
        );
        setWalletBalance(wallet.balance);
        setLastOrder(orders.items[0] ?? null);
      } catch (error) {
        console.error("Error cargando el resumen de la cuenta:", error);
      } finally {
        setSummaryLoading(false);
      }
    };

    loadSummary();
  }, []);

  return (
    <>
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          Hola,{" "}
          {user?.name ?? <Skeleton className="inline-block h-6 w-32 align-middle" />}
        </h1>

        <p className="mt-2 text-gray-500">
          Bienvenido nuevamente a RehniMarket
        </p>
      </div>

      <section className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard
          title="Pedidos pendientes"
          value={summaryLoading ? "…" : String(pendingOrders)}
          subtitle="En curso"
          icon={<Package size={24} />}
        />

        <StatCard
          title="Favoritos"
          value={favoritesLoading ? "…" : String(favoriteIds.size)}
          subtitle="Productos guardados"
          icon={<Heart size={24} />}
        />

        <StatCard
          title="Saldo RehniCoin"
          value={summaryLoading ? "…" : `${formatPrice(walletBalance)} RC`}
          subtitle="Disponible"
          icon={<Coins size={24} />}
        />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Último pedido
        </h2>

        {summaryLoading ? (
          <Skeleton className="mt-4 h-24 rounded-card" />
        ) : lastOrder ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-card border border-gray-200 bg-white p-6 shadow-card">
            <div>
              <p className="font-semibold text-gray-900">
                {lastOrder.firstItemName}
                {lastOrder.totalItems > 1
                  ? ` y ${lastOrder.totalItems - 1} producto(s) más`
                  : ""}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {new Date(lastOrder.createdAt).toLocaleDateString("es-CO")} ·{" "}
                {formatPrice(lastOrder.total)}
              </p>
            </div>

            <Badge tone={ORDER_STATUS_TONE[lastOrder.status]}>
              {ORDER_STATUS_LABEL[lastOrder.status]}
            </Badge>
          </div>
        ) : (
          <EmptyState
            className="mt-4"
            icon={<ShoppingBag size={22} />}
            title="Todavía no tienes pedidos"
            description="Tu compra más reciente aparecerá aquí."
            action={
              <Link to="/products" className={buttonClasses({ size: "sm" })}>
                Explorar productos
              </Link>
            }
          />
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Recomendados para ti
        </h2>

        {productsLoading ? (
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: RECOMMENDED_LIMIT }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={<ShoppingBag size={22} />}
            title="Todavía no hay productos para recomendarte"
          />
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
