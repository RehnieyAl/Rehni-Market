import { useEffect, useState } from "react";
import { Coins, Heart, Package, ShoppingBag } from "lucide-react";

import { useAuth } from "@/features/public/auth/context/useAuth";

import StatCard from "@/shared/components/dashboard/StatCard";
import ComingSoon from "@/shared/components/dashboard/ComingSoon";

import { getDailyProducts } from "@/features/public/home/api/homeService";
import ProductCard from "@/features/public/home/components/ProductCard";
import ProductCardSkeleton from "@/features/public/home/components/ProductCardSkeleton";

import { getMyOrders } from "@/features/orders/api/orderService";
import { getFavorites } from "@/features/favorites/api/favoriteService";
import { getMyWallet } from "@/features/wallet/api/walletService";
import { ORDER_STATUS_LABEL } from "@/features/orders/utils/orderStatus";
import { formatPrice } from "@/shared/utils/formatPrice";

import type { PublicProductCard } from "@/features/public/home/types/response";
import type { Order } from "@/features/orders/types/response";

const RECOMMENDED_LIMIT = 4;

// Los pedidos "en curso" son cualquiera que no haya terminado ni se haya
// cancelado - mismo criterio que count_pending_user_orders en el backend
// (ver app/repository/OrderRepository.py).
const PENDING_STATUSES = new Set(["pending", "paid", "processing", "shipped"]);

export default function Home() {
  const { user } = useAuth();

  const [products, setProducts] = useState<PublicProductCard[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const [pendingOrders, setPendingOrders] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
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

        const [orders, favorites, wallet] = await Promise.all([
          getMyOrders(1, 10),
          getFavorites(),
          getMyWallet(),
        ]);

        setPendingOrders(
          orders.items.filter((order) => PENDING_STATUSES.has(order.status)).length,
        );
        setFavoritesCount(favorites.length);
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
      {/* Bienvenida */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hola, {user?.name ?? "Cargando..."} 👋
        </h1>

        <p className="mt-2 text-gray-500">
          Bienvenido nuevamente a RehniMarket
        </p>
      </div>

      {/* Resumen rápido */}
      <section className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard
          title="Pedidos pendientes"
          value={summaryLoading ? "..." : String(pendingOrders)}
          subtitle="En curso"
          icon={<Package size={24} />}
        />

        <StatCard
          title="Favoritos"
          value={summaryLoading ? "..." : String(favoritesCount)}
          subtitle="Productos guardados"
          icon={<Heart size={24} />}
        />

        <StatCard
          title="Saldo RehniCoin"
          value={summaryLoading ? "..." : `${formatPrice(walletBalance)} RC`}
          subtitle="Disponible"
          icon={<Coins size={24} />}
        />
      </section>

      {/* Último pedido */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Último pedido
        </h2>

        {summaryLoading ? (
          <p className="mt-4 text-sm text-gray-500">Cargando...</p>
        ) : lastOrder ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-6">
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

            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              {ORDER_STATUS_LABEL[lastOrder.status]}
            </span>
          </div>
        ) : (
          <ComingSoon
            icon={<ShoppingBag className="h-10 w-10 text-red-700" />}
            title="Aún no tienes pedidos."
            action={{ label: "Explorar productos", to: "/products" }}
          />
        )}
      </section>

      {/* Recomendados para ti */}
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
          <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            Todavía no hay productos disponibles para recomendarte.
          </div>
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
