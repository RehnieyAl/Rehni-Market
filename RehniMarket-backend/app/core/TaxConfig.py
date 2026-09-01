"""Configuración de IVA. Tasa única de Colombia; el IVA es opcional POR PRODUCTO
(Product.applies_tax), nunca una tasa personalizada. Nada que ver con la comisión
de RehniMarket (PayoutConfig.COMMISSION_PERCENTAGE)."""

from decimal import Decimal

TAX_RATE: Decimal = Decimal("0.19")

_CENTS = Decimal("0.01")


def compute_tax(taxable_base: Decimal) -> Decimal:
    """IVA sobre una base ya con descuentos aplicados. Mismo redondeo en checkout,
    carrito y serialización de producto para que los montos coincidan punta a punta."""

    return (Decimal(taxable_base) * TAX_RATE).quantize(_CENTS)
