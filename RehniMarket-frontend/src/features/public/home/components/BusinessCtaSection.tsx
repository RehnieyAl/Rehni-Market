import { Link } from "react-router-dom";
import { ArrowRight, Eye, ShieldCheck, Store, TrendingUp } from "lucide-react";

import bg from "@/assets/business-cta-bg.webp";

const BULLETS = [
  { icon: Eye, label: "Más visibilidad" },
  { icon: ShieldCheck, label: "Ventas seguras" },
  { icon: TrendingUp, label: "Herramientas de gestión" },
];

export default function BusinessCtaSection() {
  return (
    <section className="mt-14 sm:mt-20">
      <div className="relative overflow-hidden rounded-card border border-hairline bg-gradient-to-r from-brand-700 via-brand-800 to-[#160611]">
        {/* Fondo tecnológico generado localmente (Pillow), sólo decorativo. */}
        <img
          src={bg}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[46%] object-cover opacity-70 [mask-image:linear-gradient(to_right,transparent,black_35%)] lg:block"
        />

        <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.3fr_1fr_1fr] lg:items-center lg:gap-6">
          <div>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
              <Store size={22} />
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              ¿Tienes una empresa?
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/75">
              Registra tu empresa y lleva tus productos a más clientes.
            </p>
            <Link
              to="/register-company"
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-control bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-hover"
            >
              Registrar mi empresa
              <ArrowRight size={16} />
            </Link>
          </div>

          <ul className="space-y-3 lg:justify-self-center">
            {BULLETS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-sm text-white/85">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                  <Icon size={14} />
                </span>
                {label}
              </li>
            ))}
          </ul>

          <p className="text-lg font-semibold leading-snug text-white lg:text-right">
            Haz crecer
            <br className="hidden lg:block" /> tu negocio con{" "}
            <span className="text-accent">RehniMarket</span>
          </p>
        </div>
      </div>
    </section>
  );
}
