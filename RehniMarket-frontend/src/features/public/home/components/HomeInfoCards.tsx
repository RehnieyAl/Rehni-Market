import { BadgeCheck, Headset, LayoutGrid, ShieldCheck } from "lucide-react";

/**
 * Fila de propuestas de valor bajo el banner. Texto factual (sin prometer
 * garantías o condiciones que la plataforma no tiene): el pago es con RehniCoin
 * dentro de la plataforma, las empresas pasan por verificación de certificado.
 */
const CARDS = [
  {
    icon: ShieldCheck,
    title: "Compra segura",
    description: "Tu información protegida",
  },
  {
    icon: BadgeCheck,
    title: "Empresas verificadas",
    description: "Vendedores confiables",
  },
  {
    icon: LayoutGrid,
    title: "Variedad y calidad",
    description: "Las mejores marcas",
  },
  {
    icon: Headset,
    title: "Soporte dedicado",
    description: "Estamos para ayudarte",
  },
];

export default function HomeInfoCards() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {CARDS.map(({ icon: Icon, title, description }) => (
        <div
          key={title}
          className="flex items-center gap-3 rounded-card border border-gray-200 bg-surface-1 p-3.5 sm:p-4 dark:border-hairline dark:bg-surface-1"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent sm:h-10 sm:w-10">
            <Icon size={17} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold leading-tight text-gray-900 dark:text-ink sm:text-sm">
              {title}
            </p>
            <p className="mt-0.5 text-xs leading-tight text-gray-500 dark:text-ink-muted">
              {description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
