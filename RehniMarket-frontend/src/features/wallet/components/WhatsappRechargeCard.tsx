/** "¿Necesitas más RehniCoin?": abre WhatsApp con el número público que publica el owner. Solo es un
 * canal de contacto: no acredita saldo; la recarga la hace después el personal autorizado. */
import { MessageCircle } from "lucide-react";

import usePublicPlatformContact from "@/features/platform/hooks/usePublicPlatformContact";
import { cn } from "@/shared/utils/cn";

import { buildRechargeWhatsappUrl } from "../utils/rechargeWhatsapp";

export default function WhatsappRechargeCard({ className }: { className?: string }) {
  const contact = usePublicPlatformContact();
  const url = buildRechargeWhatsappUrl(contact?.phone);

  return (
    <section
      aria-labelledby="whatsapp-recharge-title"
      className={cn("flex h-full flex-col rounded-card border border-hairline bg-surface-1 p-5", className)}
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-success-bg text-success"
        >
          <MessageCircle size={22} />
        </span>
        <div className="min-w-0">
          <h2 id="whatsapp-recharge-title" className="text-base font-semibold text-ink">
            ¿Necesitas más RehniCoin?
          </h2>
          <p className="mt-1 text-sm text-ink-muted">Solicita una recarga a nuestro equipo de atención por WhatsApp.</p>
        </div>
      </div>

      <div className="mt-auto pt-4">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-control bg-whatsapp px-4 text-sm font-semibold text-white transition-shadow fill-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success"
          >
            <MessageCircle size={18} aria-hidden="true" />
            Solicitar recarga por WhatsApp
            <span className="sr-only">(se abre en una pestaña nueva)</span>
          </a>
        ) : (
          <p role="status" className="rounded-control bg-surface-2 px-4 py-3 text-sm text-ink-muted">
            La solicitud por WhatsApp no está disponible en este momento. Inténtalo más tarde.
          </p>
        )}
      </div>
    </section>
  );
}
