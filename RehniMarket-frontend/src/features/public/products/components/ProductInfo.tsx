import ProductPrice from "./ProductPrice";

import type { PublicProductColor } from "../types/response";

interface ProductInfoProps {
  categoryName: string;
  name: string;
  companyName: string;
  isActive: boolean;
  price: string;
  discountEnabled: boolean;
  discountPercentage: number | null;
  finalPrice: string;
  stock: number;
  color: PublicProductColor | null;
}

export default function ProductInfo({
  categoryName,
  name,
  companyName,
  isActive,
  price,
  discountEnabled,
  discountPercentage,
  finalPrice,
  stock,
  color,
}: ProductInfoProps) {
  const isLowStock = stock > 0 && stock <= 5;
  const isOutOfStock = stock <= 0;

  return (
    <div>
      {/* Categoría */}
      <p className="text-sm font-medium uppercase tracking-wide text-[#6D0F2D]">
        {categoryName}
      </p>

      {/* Título */}
      <h1 className="mt-2 text-3xl font-bold leading-tight text-gray-900">
        {name}
      </h1>

      {/* Empresa */}
      <p className="mt-2 text-sm text-gray-500">
        Vendido por{" "}
        <span className="font-semibold text-gray-800">
          {companyName}
        </span>
      </p>

      {/* Estado */}
      <div className="mt-4">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
            isActive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isActive ? "bg-green-600" : "bg-red-600"
            }`}
          />

          {isActive ? "Disponible" : "No disponible"}
        </span>
      </div>

      {/* Precio */}
      <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-5">
        <ProductPrice
          price={price}
          discountEnabled={discountEnabled}
          discountPercentage={discountPercentage}
          finalPrice={finalPrice}
        />
      </div>

      {/* Stock */}
      <div className="mt-5">
        {isOutOfStock ? (
          <span className="font-semibold text-red-600">
            Agotado
          </span>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-600">
              Stock disponible:
            </span>

            <span className="font-bold text-gray-900">
              {stock}
            </span>

            {isLowStock && (
              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                Últimas unidades
              </span>
            )}
          </div>
        )}
      </div>

      {/* Color */}
      {color && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-gray-700">
            Color seleccionado
          </p>

          <div className="inline-flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-2">
            <span
              className="h-6 w-6 rounded-full border border-gray-300"
              style={{
                backgroundColor: color.hex_color,
              }}
            />

            <span className="font-medium text-gray-800">
              {color.name}
            </span>
          </div>
        </div>
      )}

      {/* Beneficios */}
      <div className="mt-8 space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm">
        <div className="flex items-center gap-2">
          <span>Envíos a toda Colombia</span>
        </div>

        <div className="flex items-center gap-2">
          <span>Pago seguro</span>
        </div>

        <div className="flex items-center gap-2">
          ↩️ <span>Garantía del vendedor</span>
        </div>
      </div>
    </div>
  );
}