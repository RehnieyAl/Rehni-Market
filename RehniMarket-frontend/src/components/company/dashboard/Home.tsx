import { useEffect, useState } from "react";
import {
  CalendarDays,
  Eye,
  Heart,
  Mail,
  MapPin,
  Package,
  ShoppingBag,
  Star,
} from "lucide-react";

import StatCard from "../StatCard";
import { getCompanyHero } from "../../../services/companyService";
import type { DashboardHomeResponse } from "../../../types/company";
import defaultLogo from "../../../assets/logo-default.png";
import defaultbanner from "../../../assets/banner-template.png";

export default function Home() {
  const [company, setCompany] = useState<DashboardHomeResponse | null>(null);

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
  console.log(company);
  return (
    <>

      {/* Hero */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Banner */}
        <div className="h-48 md:h-52 lg:h-56 overflow-hidden">
          <img
            src={
              company?.banner && !company.banner.endsWith("/None")
                ? company.banner
                : defaultbanner
            }
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
                src={
                  company?.logo && !company.logo.endsWith("/None")
                    ? company.logo
                    : defaultLogo
                }
                alt={company?.nameCompany ?? "Logo por defecto"}
                className="h-full w-full rounded-full object-cover scale-125"
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

              <span className="mt-2 inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                {company?.CompanyCertificate ? "Empresa verificada" : "Empresa pendiente de verificación"}
              </span>

              <div className="mt-5 flex flex-wrap gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>
                    {company?.stars ?? 0} ({company?.reviews ?? 0} reseñas)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    {company
                      ? `Desde ${new Date(company.memberAT).getFullYear()}`
                      : "Cargando..."}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{company?.emailCompany ?? "Cargando..."}</span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{company?.addressCompany ?? "Cargando..."}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Ventas"
          value={`$${company?.sales ?? 0}`}
          subtitle="Este mes"
          icon={<ShoppingBag size={24} />}
        />

        <StatCard
          title="Productos"
          value="0"
          subtitle="Publicados"
          icon={<Package size={24} />}
        />

        <StatCard
          title="Visitas"
          value="0"
          subtitle="Últimos 30 días"
          icon={<Eye size={24} />}
        />

        <StatCard
          title="Favoritos"
          value="0"
          subtitle="Guardados"
          icon={<Heart size={24} />}
        />
      </section>

      {/* Próximamente */}
      <section className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-12 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <Package className="h-10 w-10 text-red-700" />
          </div>

          <h2 className="text-2xl font-semibold text-gray-900">Próximamente</h2>

          <p className="mt-3 max-w-lg text-gray-500">
            Aquí podrás visualizar las estadísticas de tu empresa, el
            rendimiento de tus productos, ventas, visitas y otra información
            importante para administrar tu negocio.
          </p>
        </div>
      </section>
    </>
  );
}
