import { formatPrice } from "@/shared/utils/formatPrice";

interface ProductPriceProps {
  price: string;
  discountEnabled: boolean;
  discountPercentage: number | null;
  finalPrice: string;
}

// Precio + descuento. El backend ya entrega el precio final y el
// porcentaje calculados (ver publicService/Products.py > _compute_price_fields)
// - nunca se recalcula aquí. Sin descuento: solo el precio, sin tachado ni
// "0% descuento" (ver ALCANCE > 3 y 22).
export default function ProductPrice({
  price,
  discountEnabled,
  discountPercentage,
  finalPrice,
}: ProductPriceProps) {
  if (!discountEnabled) {
    return (
      <span className="text-3xl font-bold text-gray-900">{formatPrice(price)}</span>
    );
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="text-base text-gray-400 line-through">{formatPrice(price)}</span>
      <span className="text-3xl font-bold text-gray-900">{formatPrice(finalPrice)}</span>

      {discountPercentage !== null && (
        <span className="rounded-md bg-[#6D0F2D]/10 px-2 py-0.5 text-sm font-semibold text-[#6D0F2D]">
          {discountPercentage}% descuento
        </span>
      )}
    </div>
  );
}
