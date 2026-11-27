/** Preguntas frecuentes de la plataforma en el detalle de producto (pago, envío, devoluciones). */
import { ChevronDown } from "lucide-react";

// RehniMarket no tiene preguntas y respuestas por producto: este bloque solo explica la plataforma.
const FAQ: { question: string; answer: string }[] = [
  {
    question: "¿Cómo pago mi compra?",
    answer:
      "Los pagos en RehniMarket se hacen con RehniCoin, el saldo de tu billetera dentro de la plataforma. 1 RehniCoin equivale a 1 peso. Recargas tu saldo y pagas al finalizar la compra.",
  },
  {
    question: "¿Cómo sigo mi envío?",
    answer:
      "Cuando la empresa despacha tu pedido, asigna una transportadora y un número de guía. Puedes consultarlos en el detalle del pedido, en Mis pedidos.",
  },
  {
    question: "¿Puedo devolver un producto?",
    answer:
      "Sí. Si tu pedido fue entregado, entra a Mis pedidos, abre el detalle del pedido y solicita la devolución del producto indicando el motivo. La empresa vendedora revisa la solicitud y, si la aprueba, se te reintegran las RehniCoin.",
  },
  {
    question: "¿Qué pasa si cancelo un pedido?",
    answer:
      "Puedes cancelar un pedido mientras no haya entrado en preparación. Al cancelarlo se te reintegra automáticamente el total a tu billetera RehniCoin.",
  },
];

export default function ProductFaq() {
  return (
    <section className="mt-8" aria-labelledby="product-faq-title">
      <h2 id="product-faq-title" className="text-lg font-semibold text-ink sm:text-xl">
        Preguntas frecuentes
      </h2>

      <div className="mt-3 divide-y divide-hairline overflow-hidden rounded-card border border-hairline bg-surface-1">
        {FAQ.map((item) => (
          <details key={item.question} className="disclosure group">
            <summary className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3 text-sm font-medium text-ink transition hover:bg-white/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-secondary sm:px-5">
              {item.question}
              <ChevronDown
                size={18}
                aria-hidden="true"
                className="shrink-0 text-ink-muted transition group-open:rotate-180 motion-reduce:transition-none"
              />
            </summary>

            <p className="px-4 pb-4 text-sm leading-6 text-ink-muted sm:px-5">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
