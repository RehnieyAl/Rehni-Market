import { formatPrice } from "@/shared/utils/formatPrice";

interface ProductPriceProps {
  price: string;
  discountEnabled: boolean;
  discountPercentage: number | null;
  finalPrice: string;
}

export default function ProductPrice({
  price,
  discountEnabled,
  discountPercentage,
  finalPrice,
}: ProductPriceProps) {
  if (!discountEnabled) {
    return (
      <span className="text-3xl font-bold text-gray-900 dark:text-ink">
        {formatPrice(price)}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="text-base text-gray-400 line-through dark:text-ink-muted">
        {formatPrice(price)}
      </span>
      <span className="text-3xl font-bold text-gray-900 dark:text-ink">
        {formatPrice(finalPrice)}
      </span>

      {discountPercentage !== null && (
        <span className="rounded-md bg-brand-50 px-2 py-0.5 text-sm font-semibold text-primary dark:bg-brand-600/25 dark:text-brand-300">
          {discountPercentage}% descuento
        </span>
      )}
    </div>
  );
}
