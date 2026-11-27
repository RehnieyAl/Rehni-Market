/** Selector de cantidad del detalle: mínimo 1 y, si se conoce el stock, nunca por encima de él. */
interface QuantityStepperProps {
  quantity: number;
  stock: number;
  onChange: (quantity: number) => void;
}

const BUTTON_CLASS =
  "flex h-11 w-11 items-center justify-center text-lg text-ink-muted transition hover:bg-white/5 hover:text-ink disabled:opacity-40";

export default function QuantityStepper({ quantity, stock, onChange }: QuantityStepperProps) {
  return (
    <div className="mt-6">
      <h3 className="mb-2 text-sm font-semibold text-ink">Cantidad</h3>

      <div className="flex w-fit items-center overflow-hidden rounded-control border border-hairline bg-surface-2">
        <button
          type="button"
          aria-label="Disminuir cantidad"
          className={BUTTON_CLASS}
          onClick={() => onChange(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
        >
          −
        </button>

        <span className="w-12 text-center text-sm font-medium tabular-nums text-ink">{quantity}</span>

        <button
          type="button"
          aria-label="Aumentar cantidad"
          className={BUTTON_CLASS}
          onClick={() => onChange(Math.min(stock || 1, quantity + 1))}
          disabled={stock > 0 && quantity >= stock}
        >
          +
        </button>
      </div>
    </div>
  );
}
