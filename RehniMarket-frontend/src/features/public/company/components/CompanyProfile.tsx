import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { BadgeCheck, CalendarDays, ChevronLeft, Package } from "lucide-react";

import {
  getPublicCompanyProfile,
  getPublicCompanyProducts,
} from "../api/companyService";
import CompanyProfileSkeleton from "./CompanyProfileSkeleton";
import CompanyRatingBadge from "./CompanyRatingBadge";
import ProductCard from "@/features/public/home/components/ProductCard";
import ProductCardSkeleton from "@/features/public/home/components/ProductCardSkeleton";

import defaultLogo from "@/assets/logo-default.png";
import defaultBanner from "@/assets/banner-template.png";

import type { PublicCompanyProfile } from "../types/response";
import type { PublicProductCard } from "@/features/public/home/types/response";

const PRODUCTS_PER_PAGE = 12;

export default function CompanyProfile() {
  const { companyId } = useParams<{ companyId: string }>();

  const [company, setCompany] = useState<PublicCompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [products, setProducts] = useState<PublicProductCard[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Perfil de la empresa.
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

  // Productos publicados (paginados).
  useEffect(() => {
    if (!companyId) return;

    let cancelled = false;

    const loadProducts = async () => {
      try {
        setProductsLoading(true);

        const response = await getPublicCompanyProducts(
          companyId,
          page,
          PRODUCTS_PER_PAGE,
        );

        if (!cancelled) {
          setProducts(response.products);
          setTotalPages(response.total_pages || 1);
        }
      } catch (error) {
        console.error("Error cargando los productos de la empresa:", error);
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
  }, [companyId, page]);

  if (loading) {
    return <CompanyProfileSkeleton />;
  }

  if (notFound || !company) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-lg font-medium text-gray-700">
          No encontramos esta empresa.
        </p>

        <Link
          to="/products"
          className="mt-4 inline-flex items-center gap-2 text-sm text-[#6D0F2D] hover:underline"
        >
          <ChevronLeft size={16} />
          Volver a productos
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* BANNER */}
      <div className="h-40 w-full overflow-hidden bg-gray-100 sm:h-56 lg:h-72">
        <img
          src={company.banner_url || defaultBanner}
          alt={`Banner de ${company.name}`}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* LOGO + NOMBRE */}
        <div className="-mt-12 flex flex-col items-center sm:-mt-16 sm:flex-row sm:items-end sm:gap-6 lg:-mt-20">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg sm:h-32 sm:w-32 lg:h-40 lg:w-40">
            <img
              src={company.logo_url || defaultLogo}
              alt={`Logo de ${company.name}`}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="mt-4 text-center sm:mt-0 sm:pb-2 sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {company.name}
              </h1>

              {company.is_verified && (
                <BadgeCheck
                  size={22}
                  className="shrink-0 text-[#6D0F2D]"
                  aria-label="Empresa verificada"
                />
              )}
            </div>

            <CompanyRatingBadge companyId={company.id} className="mt-1.5" />
          </div>
        </div>

        {/* DESCRIPCIÓN */}
        {company.description && (
          <p className="mt-4 text-center text-gray-600 sm:text-left">
            {company.description}
          </p>
        )}

        {/* INFORMACIÓN DE LA EMPRESA */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
          <InfoPill
            icon={<BadgeCheck size={16} />}
            label={company.is_verified ? "Empresa verificada" : "Sin verificar"}
          />

          <InfoPill
            icon={<CalendarDays size={16} />}
            label={`Desde ${new Date(company.created_at).toLocaleDateString("es-CO", {
              year: "numeric",
              month: "long",
            })}`}
          />

          <InfoPill
            icon={<Package size={16} />}
            label={`${company.total_products} producto${company.total_products === 1 ? "" : "s"} publicado${company.total_products === 1 ? "" : "s"}`}
          />
        </div>

        {/* PRODUCTOS PUBLICADOS */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Productos publicados
          </h2>

          {productsLoading ? (
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-gray-200 p-10 text-center text-gray-500">
              Esta empresa todavía no tiene productos publicados.
            </div>
          ) : (
            <>
              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-5">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((prev) => prev - 1)}
                    className="rounded-xl border px-4 py-2 disabled:opacity-50"
                  >
                    Anterior
                  </button>

                  <span className="text-sm text-gray-600">
                    Página {page} de {totalPages}
                  </span>

                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="rounded-xl border px-4 py-2 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function InfoPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700">
      {icon}
      {label}
    </span>
  );
}
