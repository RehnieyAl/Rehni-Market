import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  Clock,
  Flag,
  Info,
  Package,
  Star,
  Store,
  Tag,
} from "lucide-react";

import {
  getPublicCompanyProfile,
  getPublicCompanyProducts,
  getCompanyRating,
} from "../api/companyService";
import CompanyProfileSkeleton from "./CompanyProfileSkeleton";
import ProductGrid from "@/features/public/products/components/ProductGrid";
import ReportModal from "@/features/reports/components/ReportModal";
import { Badge, EmptyState, buttonClasses } from "@/shared/components/ui";
import { cn } from "@/shared/utils/cn";
import { useRole } from "@/hooks/useRole";
import { useRedirectToLogin } from "@/features/public/auth/hooks/useRedirectToLogin";

import defaultLogo from "@/assets/logo-default.png";
import defaultBanner from "@/assets/banner-template.png";

import type { CompanyRating, PublicCompanyProfile } from "../types/response";
import type { PublicProductCard } from "@/features/public/home/types/response";

const PRODUCTS_PER_PAGE = 12;

type StoreTab = "tienda" | "informacion" | "calificaciones";

export default function CompanyProfile() {
  const { companyId } = useParams<{ companyId: string }>();

  const { role, status } = useRole();
  const redirectToLogin = useRedirectToLogin();
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

  const [activeTab, setActiveTab] = useState<StoreTab>("tienda");

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

    load();

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

    loadProducts();

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

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const categoryBreakdown = useMemo(() => {
    const counts = new Map<string, number>();

    for (const product of products) {
      counts.set(product.catalog_name, (counts.get(product.catalog_name) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "es"));
  }, [products]);

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

  const memberSince = new Date(company.created_at).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
  });

  const productsLabel =
    company.total_products === 1 ? "producto publicado" : "productos publicados";

  const reviewCount = rating?.total_reviews ?? 0;
  const showCategoryCard = totalPages <= 1 && categoryBreakdown.length > 0;

  const tabs: { id: StoreTab; label: string; icon: typeof Store }[] = [
    { id: "tienda", label: "Tienda", icon: Store },
    { id: "informacion", label: "Información", icon: Info },
    {
      id: "calificaciones",
      label: `Calificaciones (${reviewCount})`,
      icon: Star,
    },
  ];

  const renderReportButton = () =>
    role === null || role === "user" ? (
      <button
        type="button"
        onClick={handleReportClick}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 transition hover:text-danger"
      >
        <Flag size={14} />
        Reportar empresa
      </button>
    ) : null;

  return (
    <div className="mx-auto w-full max-w-[clamp(1280px,90vw,1600px)] px-3 py-6 sm:px-4 sm:py-8 lg:px-8">
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-900"
      >
        <ChevronLeft size={16} />
        Volver a productos
      </Link>

      <section className="relative mt-4 overflow-hidden rounded-card bg-brand-800 shadow-card sm:mt-6">
        <img
          src={company.banner_url || defaultBanner}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-right"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-brand-900 via-brand-900/90 to-brand-900/65 sm:bg-gradient-to-r sm:from-brand-900 sm:via-brand-800/90 sm:to-brand-800/50"
        />

        <div className="relative flex flex-col gap-5 p-6 sm:min-h-[300px] sm:flex-row sm:items-center sm:gap-8 sm:p-8 lg:min-h-[320px] lg:gap-10 lg:p-12">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-card border-4 border-white bg-white shadow-pop sm:h-32 sm:w-32 lg:h-40 lg:w-40">
            <img
              src={company.logo_url || defaultLogo}
              alt={`Logo de ${company.name}`}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="min-w-0 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                {company.name}
              </h1>

              {company.is_verified && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/25">
                  <BadgeCheck size={13} />
                  Empresa verificada
                </span>
              )}
            </div>

            {company.description && (
              <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
                {company.description}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm text-white/80 sm:mt-6">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={15} className="text-white/60" />
                Desde {memberSince}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Package size={15} className="text-white/60" />
                {company.total_products} {productsLabel}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 border-b border-gray-200">
        <div className="flex items-stretch justify-between gap-4">
          <nav
            className="-mb-px flex min-w-0 gap-1 overflow-x-auto sm:gap-2"
            aria-label="Secciones de la tienda"
          >
            {tabs.map((item) => {
              const TabIcon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3.5 text-sm font-medium transition",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-800",
                  )}
                >
                  <TabIcon size={16} className={isActive ? "text-primary" : "text-gray-400"} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="hidden shrink-0 items-center sm:flex">
            {renderReportButton()}
          </div>
        </div>
      </div>

      <div className="mt-3 sm:hidden">{renderReportButton()}</div>

      <div className="mt-8">
        {activeTab === "tienda" && (
          <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[17rem_minmax(0,1fr)]">
            <aside className="order-2 space-y-4 lg:order-1 lg:sticky lg:top-6 lg:self-start">
              {showCategoryCard && (
                <div className="rounded-card border border-gray-200 bg-white p-5 shadow-card">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Tag size={15} className="text-gray-400" />
                    Categorías de la tienda
                  </h3>

                  <ul className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                    {categoryBreakdown.map((category) => (
                      <li
                        key={category.name}
                        className="flex items-center justify-between gap-3 text-sm text-gray-600"
                      >
                        <span className="inline-flex min-w-0 items-center gap-2">
                          <Tag size={14} className="shrink-0 text-gray-400" />
                          <span className="truncate">{category.name}</span>
                        </span>

                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {category.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-card border border-gray-200 bg-white p-5 shadow-card">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Store size={15} className="text-gray-400" />
                  Sobre {company.name}
                </h3>

                {company.description ? (
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                    {company.description}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-gray-400">
                    Esta tienda todavía no agregó una descripción.
                  </p>
                )}

                <dl className="mt-4 space-y-2.5 border-t border-gray-100 pt-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-gray-500">En RehniMarket desde</dt>
                    <dd className="font-medium text-gray-900">{memberSince}</dd>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-gray-500">Productos publicados</dt>
                    <dd className="font-medium text-gray-900">
                      {company.total_products}
                    </dd>
                  </div>

                  {company.is_verified && (
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-gray-500">Verificación</dt>
                      <dd>
                        <Badge tone="success">
                          <BadgeCheck size={13} />
                          Verificada
                        </Badge>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </aside>

            <div className="order-1 lg:order-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5 border-b border-gray-200 pb-3">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  Productos publicados{" "}
                  <span className="font-semibold text-gray-400">
                    ({company.total_products})
                  </span>
                </h2>

                <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock size={13} />
                  Más recientes primero
                </span>
              </div>

              <div className="mt-6">
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
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "informacion" && (
          <div className="max-w-2xl rounded-card border border-gray-200 bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-lg font-bold text-gray-900">
              Información de la tienda
            </h2>

            {company.description ? (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {company.description}
              </p>
            ) : (
              <p className="mt-3 text-sm text-gray-400">
                Esta tienda todavía no agregó una descripción.
              </p>
            )}

            <dl className="mt-5 divide-y divide-gray-100 border-t border-gray-100 text-sm">
              <div className="flex items-center justify-between gap-3 py-3">
                <dt className="text-gray-500">Nombre</dt>
                <dd className="font-medium text-gray-900">{company.name}</dd>
              </div>

              <div className="flex items-center justify-between gap-3 py-3">
                <dt className="text-gray-500">En RehniMarket desde</dt>
                <dd className="font-medium text-gray-900">{memberSince}</dd>
              </div>

              <div className="flex items-center justify-between gap-3 py-3">
                <dt className="text-gray-500">Productos publicados</dt>
                <dd className="font-medium text-gray-900">
                  {company.total_products}
                </dd>
              </div>

              {company.is_verified && (
                <div className="flex items-center justify-between gap-3 py-3">
                  <dt className="text-gray-500">Verificación</dt>
                  <dd>
                    <Badge tone="success">
                      <BadgeCheck size={13} />
                      Empresa verificada
                    </Badge>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {activeTab === "calificaciones" && (
          <div className="max-w-2xl">
            {reviewCount === 0 || !rating || rating.average_rating === null ? (
              <EmptyState
                icon={<Star size={22} />}
                title="Todavía no hay calificaciones"
                description="Las reseñas de los productos de esta tienda aparecerán aquí cuando sus clientes las publiquen."
              />
            ) : (
              <div className="rounded-card border border-gray-200 bg-white p-6 shadow-card">
                <div className="inline-flex items-center gap-2">
                  <Star size={22} className="fill-amber-400 text-amber-400" />
                  <span className="text-2xl font-bold text-gray-900">
                    {rating.average_rating.toFixed(1)}
                  </span>
                </div>

                <p className="mt-2 text-sm text-gray-500">
                  Promedio de {reviewCount}{" "}
                  {reviewCount === 1 ? "reseña" : "reseñas"} de los productos de
                  esta tienda.
                </p>
              </div>
            )}
          </div>
        )}
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
