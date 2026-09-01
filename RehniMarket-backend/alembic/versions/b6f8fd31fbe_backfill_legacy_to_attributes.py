"""backfill legacy colors and specifications into catalog attributes

Revision ID: b6f8fd31fbe
Revises: a90540bebea
Create Date: 2026-08-29 02:40:00.000000

"""
import hashlib
import uuid
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b6f8fd31fbe"
down_revision: Union[str, Sequence[str], None] = "a90540bebea"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _combo_key(option_id) -> str:
    return hashlib.sha256(str(option_id).lower().encode("utf-8")).hexdigest()


def _get_or_create_attribute(bind, catalog_id, name, role, input_type) -> uuid.UUID:
    existing = bind.execute(
        sa.text(
            "SELECT id FROM catalog_attributes "
            "WHERE catalog_id = :catalog_id AND lower(name) = lower(:name)"
        ),
        {"catalog_id": str(catalog_id), "name": name},
    ).first()
    if existing:
        return existing[0]

    new_id = uuid.uuid4()
    bind.execute(
        sa.text(
            "INSERT INTO catalog_attributes "
            "(id, catalog_id, name, role, input_type, is_active, position, created_at) "
            "VALUES (:id, :catalog_id, :name, :role, :input_type, true, 0, now())"
        ),
        {
            "id": str(new_id),
            "catalog_id": str(catalog_id),
            "name": name,
            "role": role,
            "input_type": input_type,
        },
    )
    return new_id


def _get_or_create_option(bind, attribute_id, value, hex_color) -> uuid.UUID:
    existing = bind.execute(
        sa.text(
            "SELECT id FROM catalog_attribute_options "
            "WHERE attribute_id = :attribute_id AND lower(value) = lower(:value)"
        ),
        {"attribute_id": str(attribute_id), "value": value},
    ).first()
    if existing:
        return existing[0]

    new_id = uuid.uuid4()
    bind.execute(
        sa.text(
            "INSERT INTO catalog_attribute_options "
            "(id, attribute_id, value, hex_color, position) "
            "VALUES (:id, :attribute_id, :value, :hex_color, 0)"
        ),
        {
            "id": str(new_id),
            "attribute_id": str(attribute_id),
            "value": value,
            "hex_color": hex_color,
        },
    )
    return new_id


def upgrade() -> None:
    bind = op.get_bind()

    variant_rows = bind.execute(
        sa.text(
            "SELECT v.id AS variant_id, p.catalog_id AS catalog_id, "
            "c.name AS color_name, c.hex_color AS hex_color "
            "FROM product_variants v "
            "JOIN products p ON p.id = v.product_id "
            "JOIN color_variants c ON c.id = v.color_id "
            "WHERE v.color_id IS NOT NULL AND v.deleted_at IS NULL"
        )
    ).mappings().all()

    for row in variant_rows:
        attribute_id = _get_or_create_attribute(
            bind, row["catalog_id"], "Color", "variant", "color"
        )
        option_id = _get_or_create_option(
            bind, attribute_id, row["color_name"], row["hex_color"]
        )

        already_linked = bind.execute(
            sa.text(
                "SELECT 1 FROM variant_options "
                "WHERE variant_id = :variant_id AND attribute_id = :attribute_id"
            ),
            {"variant_id": str(row["variant_id"]), "attribute_id": str(attribute_id)},
        ).first()

        if not already_linked:
            bind.execute(
                sa.text(
                    "INSERT INTO variant_options (id, variant_id, attribute_id, option_id) "
                    "VALUES (:id, :variant_id, :attribute_id, :option_id)"
                ),
                {
                    "id": str(uuid.uuid4()),
                    "variant_id": str(row["variant_id"]),
                    "attribute_id": str(attribute_id),
                    "option_id": str(option_id),
                },
            )

        bind.execute(
            sa.text(
                "UPDATE product_variants SET combo_key = :combo_key "
                "WHERE id = :variant_id AND combo_key IS NULL"
            ),
            {"combo_key": _combo_key(option_id), "variant_id": str(row["variant_id"])},
        )

    spec_rows = bind.execute(
        sa.text(
            "SELECT ps.product_id AS product_id, st.catalog_id AS catalog_id, "
            "st.name AS name, ps.value AS value "
            "FROM product_specifications ps "
            "JOIN specification_templates st ON st.id = ps.specification_template_id"
        )
    ).mappings().all()

    for row in spec_rows:
        attribute_id = _get_or_create_attribute(
            bind, row["catalog_id"], row["name"], "product", "text"
        )

        exists = bind.execute(
            sa.text(
                "SELECT 1 FROM product_attribute_values "
                "WHERE product_id = :product_id AND attribute_id = :attribute_id"
            ),
            {"product_id": str(row["product_id"]), "attribute_id": str(attribute_id)},
        ).first()

        if not exists:
            bind.execute(
                sa.text(
                    "INSERT INTO product_attribute_values (id, product_id, attribute_id, value) "
                    "VALUES (:id, :product_id, :attribute_id, :value)"
                ),
                {
                    "id": str(uuid.uuid4()),
                    "product_id": str(row["product_id"]),
                    "attribute_id": str(attribute_id),
                    "value": row["value"],
                },
            )


def downgrade() -> None:
    bind = op.get_bind()

    bind.execute(sa.text("DELETE FROM variant_options"))
    bind.execute(sa.text("DELETE FROM product_attribute_values"))
    bind.execute(sa.text("UPDATE product_variants SET combo_key = NULL"))
