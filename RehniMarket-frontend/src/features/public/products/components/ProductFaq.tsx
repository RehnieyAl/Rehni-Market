import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Preguntas frecuentes a nivel de plataforma. RehniMarket no tiene un sistema de
 * preguntas y respuestas por producto, así que este bloque solo explica cómo
 * funciona la plataforma (pago, envío, devoluciones). Contenido estático y veraz.
 */
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
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="theme-dark mt-10">
      <h2 className="text-xl font-bold text-ink">Preguntas frecuentes</h2>

      <div className="mt-4 divide-y divide-hairline overflow-hidden rounded-card border border-hairline bg-surface-1">
        {FAQ.map((item, index) => {
          const isOpen = open === index;

          return (
            <div key={item.question}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-ink transition hover:bg-white/5"
              >
                {item.question}
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-ink-muted transition ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isOpen && (
                <p className="px-5 pb-5 text-sm leading-6 text-ink-muted">{item.answer}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
