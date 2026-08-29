"""Huella determinista de la combinación de opciones de una variante, independiente
del orden. `combo_key` + UNIQUE(product_id, combo_key) impide dos variantes con la
misma combinación a nivel de BD. SKU único: combo_key = hash de ""."""

from __future__ import annotations

import hashlib
from collections.abc import Iterable
from uuid import UUID


def build_combo_key(option_ids: Iterable[UUID | str]) -> str:
    """
    Devuelve un hex de 64 chars (sha256) a partir de los ids de opcion,
    normalizados a minusculas y ordenados. Deduplica ids repetidos.
    """

    normalized = sorted({str(option_id).lower() for option_id in option_ids})
    payload = "|".join(normalized)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()
