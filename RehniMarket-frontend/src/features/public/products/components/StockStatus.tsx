/** Línea de disponibilidad del detalle: combinación inválida, falta elegir opciones, en stock o agotado. */
interface StockStatusProps {
  stock: number;
  invalidCombination: boolean;
  /** El producto tiene variantes y aún no se eligieron todas sus opciones. */
  pendingSelection: boolean;
  anyVariantInStock: boolean;
}

const OUT_OF_STOCK = <span className="font-semibold text-danger">Sin stock</span>;

function StockMessage({ stock, invalidCombination, pendingSelection, anyVariantInStock }: StockStatusProps) {
  if (invalidCombination) {
    return <span className="font-semibold text-danger">Esa combinación no está disponible.</span>;
  }

  if (pendingSelection) {
    return anyVariantInStock ? (
      <span className="text-ink-muted">Selecciona una opción para ver el stock disponible.</span>
    ) : (
      OUT_OF_STOCK
    );
  }

  if (stock <= 0) return OUT_OF_STOCK;

  return (
    <>
      <span className="h-2 w-2 shrink-0 rounded-full bg-stock" />
      <span className="text-ink-muted">En stock · </span>
      <span className="font-semibold text-stock">{stock} unidades disponibles</span>
    </>
  );
}

export default function StockStatus(props: StockStatusProps) {
  return (
    <p className="mt-4 flex items-center gap-2 text-sm">
      <StockMessage {...props} />
    </p>
  );
}
