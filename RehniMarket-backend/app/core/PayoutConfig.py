"""Parámetros de negocio de las liquidaciones: comisión, conversión a RehniCoin y plazo de consignación."""

from decimal import Decimal

COMMISSION_PERCENTAGE: Decimal = Decimal("0.05")
REHNICOIN_CONVERSION_RATE: Decimal = Decimal("1.0")

# Regla interna de RehniMarket (no un plazo legal): días hábiles tras el cierre del mes para consignar.
CONSIGNMENT_BUSINESS_DAYS: int = 5
