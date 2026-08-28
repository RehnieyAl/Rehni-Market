import { Link } from "react-router-dom";
import { ArrowRight, Users } from "lucide-react";

export default function CommunityBanner() {
  return (
    <section
      id="comunidad"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8"
    >
      <div className="flex flex-col items-start gap-6 rounded-2xl bg-[#FBF3F1] px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-12">
        <div className="flex items-center gap-4">
          <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-[#6D0F2D] shadow-sm sm:flex">
            <Users size={26} aria-hidden="true" />
          </span>

          <div>
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Únete a nuestra comunidad
            </h2>

            <p className="mt-1 max-w-md text-sm text-gray-600">
              Crea tu cuenta y comienza a comprar y vender productos en
              Rehni-Market.
            </p>
          </div>
        </div>

        <Link
          to="/register-user"
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#6D0F2D] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#530A20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D0F2D] focus-visible:ring-offset-2 sm:w-auto"
        >
          Crear cuenta
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
