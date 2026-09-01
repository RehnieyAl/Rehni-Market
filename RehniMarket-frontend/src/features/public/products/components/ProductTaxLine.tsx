import { formatPrice } from "@/shared/utils/formatPrice";

interface ProductTaxLineProps {
  appliesTax: boolean;
  taxRate: string;
  taxAmount: string;
  priceWithTax: string;
}

export default function ProductTaxLine({
  appliesTax,
  taxRate,
  taxAmount,
  priceWithTax,
}: ProductTaxLineProps) {
  if (!appliesTax) {
    return (
      <p className="mt-2 text-sm text-gray-500">
        IVA: <span className="font-medium text-gray-700">No aplica</span>
      </p>
    );
  }

  const ratePercent = Math.round(Number(taxRate) * 100);

  return (
    <div className="mt-2 space-y-0.5 text-sm text-gray-500">
      <p className="flex flex-wrap gap-x-2">
        <span>IVA ({ratePercent}%):</span>
        <span className="font-medium text-gray-700">{formatPrice(taxAmount)}</span>
      </p>
      <p className="flex flex-wrap gap-x-2">
        <span>Total con IVA:</span>
        <span className="font-semibold text-gray-900">{formatPrice(priceWithTax)}</span>
      </p>
    </div>
  );
}
