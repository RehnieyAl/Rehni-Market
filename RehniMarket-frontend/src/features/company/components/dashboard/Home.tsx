import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  EyeOff,
  ImageOff,
  Mail,
  MapPin,
  Package,
  PackageX,
} from "lucide-react";

import StatCard from "@/shared/components/dashboard/StatCard";
import { Badge, EmptyState, Skeleton } from "@/shared/components/ui";
import CompanyRatingBadge from "@/features/public/company/components/CompanyRatingBadge";

import { useAuth } from "@/features/public/auth/context/useAuth";

import {
  getCompanyHero,
  getProductsSummary,
} from "@/features/company/api/companyService";
import { getMyProducts } from "@/features/company/api/productService";

import type {
  DashboardHomeResponse,
  ProductsSummaryResponse,
  MyProductResponse,
} from "@/features/company/types/response";

import defaultLogo from "@/assets/logo-default.png";
import defaultbanner from "@/assets/banner-template.png";

interface HomeProps {
  onNavigate: (view: string) => void;
}

function getVerificationBadge(company: DashboardHomeResponse | null) {
  if (!company) {
    return { label: "", className: "bg-gray-100 text-gray-500" };
  }

  if (company.certificate_status === "approved") {
    return {
      label: "Empresa verificada",
      className: "bg-success-bg text-success",
    };
  }

  if (company.certificate_status === "rejected") {
    return {
      label: "Empresa rechazada",
      className: "bg-danger-bg text-danger",
    };
  }

  if (company.certificate_status === "needs_update") {
    return {
      label: "Certificado no válido",
      className: "bg-danger-bg text-danger",
    };
  }

  return {
    label: "Empresa pendiente de verificación",
    className: "bg-warning-bg text-warning",
  };
}

export default function Home({ onNavigate }: HomeProps) {
  const { user } = useAuth();

  const [company, setCompany] = useState<DashboardHomeResponse | null>(null);

  const [summary, setSummary] = useState<ProductsSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [recentProducts, setRecentProducts] = useState<MyProductResponse[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const data = await getCompanyHero();
        setCompany(data);
      } catch (error) {
        console.error("Error al cargar la empresa:", error);
      }
    };

    loadCompany();
  }, []);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setSummaryLoading(true);
        const data = await getProductsSummary();
        setSummary(data);
      } catch (error) {
        console.error("Error al cargar las estadísticas de productos:", error);
      } finally {
        setSummaryLoading(false);
      }
    };

    loadSummary();
  }, []);

  useEffect(() => {
    const loadRecentProducts = async () => {
      try {
        setRecentLoading(true);
        const data = await getMyProducts(1, 10, "");
        setRecentProducts(data.products);
      } catch (error) {
        console.error("Error al cargar los productos recientes:", error);
      } finally {
        setRecentLoading(false);
      }
    };

    loadRecentProducts();
  }, []);

  const badge = getVerificationBadge(company);

  return (
    <>
      <section className="mt-8 overflow-hidden rounded-card border border-gray-200 bg-surface-1 shadow-card">
        <div className="h-48 overflow-hidden md:h-52 lg:h-56">
          <img
            src={company?.banner ?? defaultbanner}
            alt="Banner de la empresa"
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = defaultbanner;
            }}
          />
        </div>

        <div className="relative px-8 pb-10">
          <div className="flex items-start gap-6">
            <div className="-mt-6 flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-surface-1 shadow-pop">
              <img
                src={company?.logo ?? defaultLogo}
                alt={company?.nameCompany ?? "Logo por defecto"}
                className="h-full w-full scale-125 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = defaultLogo;
                }}
              />
            </div>

            <div className="pt-2">
              {company ? (
                <h2 className="text-2xl font-bold text-gray-900">
                  {company.nameCompany}
                </h2>
              ) : (
                <Skeleton className="h-7 w-56" />
              )}

              <div className="mt-2 flex flex-wrap items-center gap-3">
                {company ? (
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                ) : (
                  <Skeleton className="h-6 w-24 rounded-full" />
                )}

                {company && <CompanyRatingBadge companyId={company.id} />}
              </div>

              {company?.description && (
                <p className="mt-3 max-w-2xl text-sm text-gray-600">
                  {company.description}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />

                  <span>
                    {company ? (
                      `Desde ${new Date(company.memberAT).getFullYear()}`
                    ) : (
                      <Skeleton className="inline-block h-3.5 w-16 align-middle" />
                    )}
                  </span>
                </div>

                {user?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />

                    <span>{user.email}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />

                  <span>
                    {company ? (
                      company.addressCompany
                    ) : (
                      <Skeleton className="inline-block h-3.5 w-40 align-middle" />
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Productos publicados"
          value={summaryLoading ? "…" : String(summary?.total ?? 0)}
          subtitle="Total en tu catálogo"
          icon={<Package size={24} />}
        />

        <StatCard
          title="Activos"
          value={summaryLoading ? "…" : String(summary?.active ?? 0)}
          subtitle="Visibles para compradores"
          icon={<CheckCircle2 size={24} />}
        />

        <StatCard
          title="Agotados"
          value={summaryLoading ? "…" : String(summary?.out_of_stock ?? 0)}
          subtitle="Sin stock disponible"
          icon={<PackageX size={24} />}
        />

        <StatCard
          title="Ocultos"
          value={summaryLoading ? "…" : String(summary?.hidden ?? 0)}
          subtitle="Desactivados"
          icon={<EyeOff size={24} />}
        />
      </section>

      <section className="mt-8 overflow-hidden rounded-card border border-gray-200 bg-surface-1 shadow-card">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Productos recientes
            </h2>

            <p className="mt-0.5 text-sm text-gray-500">
              Los últimos productos que agregaste a tu catálogo.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("products")}
            className="shrink-0 text-sm font-medium text-primary transition hover:text-primary-hover"
          >
            Ver todos →
          </button>
        </div>

        {recentLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12" />
            ))}
          </div>
        ) : recentProducts.length === 0 ? (
          <EmptyState
            variant="plain"
            title="Aún no tienes productos publicados"
            description="Crea tu primer producto para empezar a vender."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-6 py-3 font-medium">Producto</th>
                  <th className="px-6 py-3 font-medium">Precio</th>
                  <th className="px-6 py-3 font-medium">Stock</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                </tr>
              </thead>

              <tbody>
                {recentProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-11 w-11 shrink-0 rounded-control object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-gray-100 text-gray-300">
                            <ImageOff size={18} />
                          </div>
                        )}

                        <span className="text-sm font-medium text-gray-900">
                          {product.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-3 text-sm text-gray-700">
                      ${product.price.toLocaleString("es-CO")}
                    </td>

                    <td className="px-6 py-3 text-sm text-gray-700">
                      {product.stock}
                    </td>

                    <td className="px-6 py-3">
                      <Badge tone={product.is_active ? "success" : "warning"}>
                        {product.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
