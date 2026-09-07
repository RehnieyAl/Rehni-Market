import { BadgeCheck, RotateCcw, ShieldHalf, Truck } from "lucide-react";
import type { ReactNode } from "react";

interface ProductTrustCardsProps {
  isVerified: boolean;
}

interface TrustCard {
  icon: ReactNode;
  title: string;
  description: string;
}

/**
 * Tarjetas informativas. El texto es factual: RehniMarket NO tiene hoy reglas de
 * "envío gratis" ni de "garantía oficial" (no hay costo de envío en el pedido ni
 * campo de garantía), así que no se prometen esas condiciones. "Vendedor verificado"
 * sí es un concepto real (certificado empresarial aprobado). "Devolución fácil"
 * corresponde al flujo de devoluciones del panel del usuario.
 */
export default function ProductTrustCards({ isVerified }: ProductTrustCardsProps) {
  const cards: TrustCard[] = [
    {
      icon: <Truck size={20} />,
      title: "Envío nacional",
      description: "Coordinamos la entrega con transportadoras aliadas a todo el país.",
    },
    {
      icon: <BadgeCheck size={20} />,
      title: isVerified ? "Vendedor verificado" : "Vendedor registrado",
      description: isVerified
        ? "La empresa completó la verificación de su certificado en RehniMarket."
        : "La empresa está registrada en RehniMarket.",
    },
    {
      icon: <RotateCcw size={20} />,
      title: "Devolución fácil",
      description:
        "Si tu pedido fue entregado, puedes solicitar la devolución de un producto desde Mis pedidos.",
    },
    {
      icon: <ShieldHalf size={20} />,
      title: "Compra protegida",
      description:
        "Pagas con RehniCoin dentro de la plataforma; no compartes datos de pago con el vendedor.",
    },
  ];

  return (
    <div className="theme-dark mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-card border border-hairline bg-surface-1 p-4"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-control bg-brand-600/20 text-brand-300">
            {card.icon}
          </span>

          <p className="mt-3 text-sm font-semibold text-ink">{card.title}</p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">{card.description}</p>
        </div>
      ))}
    </div>
  );
}
