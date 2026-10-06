"""Configuración de la billetera RehniCoin (1 RehniCoin = 1 COP).

Mismo criterio que PayoutConfig.py / TaxConfig.py: constantes de negocio en un
solo lugar, tipadas como Decimal.
"""

from decimal import Decimal

# Máximo por OPERACIÓN de recarga administrativa (admin/owner). No es un tope de
# saldo total: el usuario puede acumular más saldo con varias recargas.
MAX_ADMIN_RECHARGE_AMOUNT: Decimal = Decimal("10000000")

# Mensaje único de error para frontend y backend. El número sale de la constante
# de arriba (formato COP: separador de miles ".").
MAX_ADMIN_RECHARGE_MESSAGE: str = (
    "El monto máximo de recarga es de "
    + f"${int(MAX_ADMIN_RECHARGE_AMOUNT):,}".replace(",", ".")
    + "."
)
