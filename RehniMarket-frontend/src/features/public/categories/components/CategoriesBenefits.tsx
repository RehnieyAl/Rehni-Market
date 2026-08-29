import { Coins, Headset, ShieldCheck, Truck } from "lucide-react";

const BENEFITS = [
  { icon: ShieldCheck, label: "Compra segura" },
  { icon: Coins, label: "RehniCoin" },
  { icon: Headset, label: "Soporte 24/7" },
  { icon: Truck, label: "Envíos rápidos" },
];

// Sección inferior minimalista: son
// beneficios propios de la plataforma (no datos de negocio calculados),
// mismo criterio que el resto del storefront público para no mezclar
// contenido estático con datos reales del backend.
export default function CategoriesBenefits() {
  return (
    <section className="border-t border-gray-100 bg-gray-50">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
        {BENEFITS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-card">
              <Icon size={18} />
            </span>

            <span className="text-sm font-medium text-gray-700">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
