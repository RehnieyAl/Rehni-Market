"""company certificate NEEDS_UPDATE status

Agrega el valor `NEEDS_UPDATE` al enum `companycertificateenum`.

Distingue dos resultados de la revisión del certificado que antes eran uno solo:

- `REJECTED`      -> rechazo **terminal** de la empresa. No puede resubir el
                     certificado por sí misma; solo un admin/owner puede volver a
                     moverla de estado.
- `NEEDS_UPDATE`  -> el certificado presentado no es válido (ilegible, vencido,
                     incorrecto...). La empresa SÍ puede subir uno nuevo
                     (POST /company/certificate/update sin JWT o
                     PUT /company/certificate con JWT), lo que la devuelve a PENDING.

Solo agrega el label del enum; no toca filas existentes (las que estaban en
`REJECTED` siguen en `REJECTED`).

Revision ID: a7c4e1f9b2d8
Revises: f7a2b9c1d3e4
Create Date: 2026-09-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = "a7c4e1f9b2d8"
down_revision: Union[str, Sequence[str], None] = "f7a2b9c1d3e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # PostgreSQL >= 12 permite ADD VALUE dentro de una transacción siempre que el
    # nuevo valor no se use en la misma transacción (aquí no se usa).
    op.execute(
        "ALTER TYPE companycertificateenum ADD VALUE IF NOT EXISTS 'NEEDS_UPDATE'"
    )


def downgrade() -> None:
    # PostgreSQL no permite quitar un valor de un enum: se recrea el tipo sin
    # NEEDS_UPDATE. Las empresas que estuvieran en ese estado pasan a REJECTED.
    op.execute(
        "UPDATE company SET \"CompanyCertificateStatus\" = 'REJECTED' "
        "WHERE \"CompanyCertificateStatus\" = 'NEEDS_UPDATE'"
    )
    op.execute(
        "ALTER TYPE companycertificateenum RENAME TO companycertificateenum_old"
    )
    op.execute(
        "CREATE TYPE companycertificateenum AS ENUM "
        "('PENDING', 'APPROVED', 'REJECTED')"
    )
    op.execute(
        "ALTER TABLE company ALTER COLUMN \"CompanyCertificateStatus\" TYPE "
        "companycertificateenum USING "
        "\"CompanyCertificateStatus\"::text::companycertificateenum"
    )
    op.execute("DROP TYPE companycertificateenum_old")
