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

// Etiqueta del estado real de verificación (CompanyCertificateStatus) -
// antes se mostraba "verificada" con solo tener un certificado subido,
// sin importar si un admin lo había aprobado (ver Dashboard.py >
// company_dashboard_me_service).
function getVerificationBadge(company: DashboardHomeResponse | null) {
  if (!company) {
    return {
      label: "Cargando...",
      className: "bg-gray-100 text-gray-500",
    };
  }

  if (company.certificate_status === "approved") {
    return {
      label: "Empresa verificada",
      className: "bg-green-100 text-green-700",
    };
  }

  if (company.certificate_status === "rejected") {
    return {
      label: "Certificado rechazado",
      className: "bg-red-100 text-red-700",
    };
  }

  return {
    label: "Empresa pendiente de verificación",
    className: "bg-yellow-100 text-yellow-700",
  };
}

export default function Home({ onNavigate }: HomeProps) {
  // El correo es un dato de la CUENTA (no de la empresa) - se reutiliza
  // el mismo AuthContext que ya alimenta navbar/sidebar/topbar (ver
  // AccountSettings.tsx) en vez de volver a pedirlo aquí (GET /auth/me).
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
        // Los 10 productos más recientes (el backend ya los ordena por
        // fecha de creación descendente - ver
        // company_dashboard_get_my_products).
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
      {/* Hero */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Banner */}
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

        {/* Información */}
        <div className="relative px-8 pb-10">
          <div className="flex items-start gap-6">
            {/* Logo */}
            <div className="-mt-6 flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-md">
              <img
                src={company?.logo ?? defaultLogo}
                alt={company?.nameCompany ?? "Logo por defecto"}
                className="h-full w-full scale-125 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = defaultLogo;
                }}
              />
            </div>

            {/* Datos */}
            <div className="pt-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {company?.nameCompany ?? "Cargando..."}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${badge.className}`}
                >
                  {badge.label}
                </span>

                {/* Reputación real, calculada sobre las reseñas activas
                    de todos los productos de la empresa - ver ALCANCE >
                    Calificaciones de empresa (la empresa no tiene
                    reseñas propias). */}
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
                    {company
                      ? `Desde ${new Date(company.memberAT).getFullYear()}`
                      : "Cargando..."}
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

                  <span>{company?.addressCompany ?? "Cargando..."}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Estadísticas: solo datos reales calculados sobre los productos
          de la empresa (no hay ventas/visitas/favoritos/reseñas en el
          backend - ver ALCANCE > Home > ESTADÍSTICAS). */}
      <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Productos publicados"
          value={summaryLoading ? "..." : String(summary?.total ?? 0)}
          subtitle="Total en tu catálogo"
          icon={<Package size={24} />}
        />

        <StatCard
          title="Activos"
          value={summaryLoading ? "..." : String(summary?.active ?? 0)}
          subtitle="Visibles para compradores"
          icon={<CheckCircle2 size={24} />}
        />

        <StatCard
          title="Agotados"
          value={summaryLoading ? "..." : String(summary?.out_of_stock ?? 0)}
          subtitle="Sin stock disponible"
          icon={<PackageX size={24} />}
        />

        <StatCard
          title="Ocultos"
          value={summaryLoading ? "..." : String(summary?.hidden ?? 0)}
          subtitle="Desactivados"
          icon={<EyeOff size={24} />}
        />
      </section>

      {/* Productos recientes */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
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
            className="shrink-0 text-sm font-medium text-red-700 transition hover:text-red-800"
          >
            Ver todos →
          </button>
        </div>

        {recentLoading ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            Cargando productos...
          </div>
        ) : recentProducts.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            Aún no tienes productos publicados.
          </div>
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
                            className="h-11 w-11 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-300">
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
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          product.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {product.is_active ? "Activo" : "Inactivo"}
                      </span>
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
