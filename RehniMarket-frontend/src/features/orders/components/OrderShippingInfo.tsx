import { Truck, PackageSearch, ExternalLink } from "lucide-react";

import { EmptyState } from "@/shared/components/ui";
import { buttonClasses } from "@/shared/components/ui/buttonVariants";

import { buildTrackingUrl } from "../utils/tracking";

import type { OrderShippingCarrier } from "../types/response";

interface OrderShippingInfoProps {
  carrier: OrderShippingCarrier | null;
  trackingNumber: string | null;
}

export default function OrderShippingInfo({ carrier, trackingNumber }: OrderShippingInfoProps) {
  if (!carrier || !trackingNumber) {
    return (
      <EmptyState
        variant="plain"
        icon={<PackageSearch size={22} />}
        title="Información de envío pendiente"
        description="La empresa aún no ha registrado la transportadora ni el número de guía."
      />
    );
  }

  const trackingUrl = buildTrackingUrl(carrier.trackingUrl, trackingNumber);

  return (
    <div className="rounded-card border border-gray-200 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
            <Truck size={14} />
            Transportadora
          </span>
          <p className="mt-1 text-sm font-semibold text-gray-900">{carrier.name}</p>
        </div>

        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Número de guía
          </span>
          <p className="mt-1 select-all font-mono text-sm font-semibold text-gray-900">
            {trackingNumber}
          </p>
        </div>
      </div>

      {trackingUrl && (
        <a
          href={trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Consultar el seguimiento del envío en ${carrier.name}`}
          className={buttonClasses({
            variant: "outline",
            size: "sm",
            className: "mt-4 w-full sm:w-auto",
          })}
        >
          Consultar seguimiento
          <ExternalLink size={15} />
        </a>
      )}
    </div>
  );
}
