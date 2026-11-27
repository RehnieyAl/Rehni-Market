/** Perfil público de una empresa: carga datos, seguidores y productos y compone la cabecera (calificación y
 * Seguir), el contenedor "Sobre" a la izquierda y los productos publicados a la derecha. */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Clock, Flag, Store } from "lucide-react";

import {
  getPublicCompanyProfile,
  getPublicCompanyProducts,
  getCompanyRating,
} from "../api/companyService";
import CompanyHero from "./CompanyHero";
import CompanyProfileSkeleton from "./CompanyProfileSkeleton";
import CompanyStoreAside from "./CompanyStoreAside";
import { formatMemberSince } from "./companyFormat";
import ProductGrid from "@/features/public/products/components/ProductGrid";
import ReportModal from "@/features/reports/components/ReportModal";
import { EmptyState, buttonClasses } from "@/shared/components/ui";
import { useRole } from "@/hooks/useRole";
import { useCompanyFollow } from "@/hooks/useCompanyFollow";
import { useRedirectToLogin } from "@/features/public/auth/hooks/useRedirectToLogin";

import type { CompanyRating, PublicCompanyProfile } from "../types/response";
import type { PublicProductCard } from "@/features/public/home/types/response";

const PRODUCTS_PER_PAGE = 12;

export default function CompanyProfile() {
  const { companyId } = useParams<{ companyId: string }>();

  const { role, status } = useRole();
  const redirectToLogin = useRedirectToLogin();
  const follow = useCompanyFollow(companyId);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const [company, setCompany] = useState<PublicCompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [rating, setRating] = useState<CompanyRating | null>(null);

  const [products, setProducts] = useState<PublicProductCard[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsFailed, setProductsFailed] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [productsReloadKey, setProductsReloadKey] = useState(0);


  useEffect(() => {
    if (!companyId) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setNotFound(false);

        const response = await getPublicCompanyProfile(companyId);

        if (!cancelled) {
          setCompany(response);
        }
      } catch (error) {
        console.error("Error cargando el perfil de la empresa:", error);

        if (!cancelled) {
          setNotFound(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;

    let cancelled = false;

    getCompanyRating(companyId)
      .then((response) => {
        if (!cancelled) setRating(response);
      })
      .catch((error) =>
        console.error("Error cargando la reputación de la empresa:", error),
      );

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;

    let cancelled = false;

    const loadProducts = async () => {
      try {
        setProductsLoading(true);
        setProductsFailed(false);

        const response = await getPublicCompanyProducts(
          companyId,
          page,
          PRODUCTS_PER_PAGE,
        );

        if (!cancelled) {
          setProducts(response.products);
          setTotal(response.total);
          setTotalPages(response.total_pages || 1);
        }
      } catch (error) {
        console.error("Error cargando los productos de la empresa:", error);

        if (!cancelled) {
          setProductsFailed(true);
        }
      } finally {
        if (!cancelled) {
          setProductsLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, [companyId, page, productsReloadKey]);

  const handleReportClick = () => {
    if (status === "loading") return;
    if (role === null) {
      redirectToLogin();
      return;
    }

    setReportModalOpen(true);
  };

  const handleFollowClick = () => {
    if (status === "loading") return;
    if (role === null) {
      redirectToLogin();
      return;
    }

    void follow.toggleFollow();
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return <CompanyProfileSkeleton />;
  }

  if (notFound || !company) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16">
        <EmptyState
          icon={<Store size={22} />}
          title="No encontramos esta empresa"
          description="Puede que ya no esté disponible o que el enlace sea incorrecto."
          action={
            <Link to="/products" className={buttonClasses({ variant: "outline" })}>
              <ChevronLeft size={16} />
              Volver a productos
            </Link>
          }
        />
      </div>
    );
  }

  const memberSince = formatMemberSince(company.created_at);
  const isBuyerOrVisitor = role === null || role === "user";

  const reportButton = isBuyerOrVisitor ? (
    <button
      type="button"
      onClick={handleReportClick}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-control px-2 text-xs font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-secondary"
    >
      <Flag size={14} aria-hidden="true" />
      Reportar empresa
    </button>
  ) : null;

  return (
    <div className="mx-auto w-full max-w-[clamp(1280px,90vw,1600px)] px-3 py-6 sm:px-4 sm:py-8 lg:px-8">
      <Link
        to="/products"
        className="inline-flex min-h-10 items-center gap-2 text-sm text-ink-muted transition hover:text-ink"
      >
        <ChevronLeft size={16} aria-hidden="true" />
        Volver a productos
      </Link>

      <CompanyHero
        company={company}
        rating={rating}
        memberSince={memberSince}
        followersCount={follow.followersCount}
        follow={
          isBuyerOrVisitor
            ? {
                isFollowing: follow.isFollowing,
                pending: follow.pending,
                disabled: status === "loading" || (role === "user" && follow.loading),
                onClick: handleFollowClick,
              }
            : undefined
        }
      />

      <div className="mt-6 grid gap-6 sm:mt-8 md:grid-cols-[14rem_minmax(0,1fr)] lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[17rem_minmax(0,1fr)]">
        <CompanyStoreAside company={company} memberSince={memberSince} footer={reportButton} />

        <section aria-labelledby="company-products-title" className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5 border-b border-hairline pb-3">
            <h2 id="company-products-title" className="text-xl font-semibold text-ink sm:text-2xl">
              Productos publicados{" "}
              <span className="font-semibold tabular-nums text-ink-muted">({company.total_products})</span>
            </h2>

            <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
              <Clock size={13} aria-hidden="true" />
              Más recientes primero
            </span>
          </div>

          <div className="mt-5">
            <ProductGrid
              products={products}
              loading={productsLoading}
              failed={productsFailed}
              total={total}
              page={page}
              totalPages={totalPages}
              pageSize={PRODUCTS_PER_PAGE}
              onPageChange={handlePageChange}
              onRetry={() => setProductsReloadKey((key) => key + 1)}
              emptyMessage="Esta empresa todavía no tiene productos publicados."
              gridClassName="min-[360px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              cardLayout="compact"
            />
          </div>
        </section>
      </div>

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetType="company"
        targetId={company.id}
        targetLabel={company.name}
      />
    </div>
  );
}
