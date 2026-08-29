from __future__ import annotations

import hashlib
from collections.abc import Iterable
from uuid import UUID


def build_combo_key(option_ids: Iterable[UUID | str]) -> str:
    """sha256 hex de los ids de opción normalizados y ordenados; independiente del orden."""

    normalized = sorted({str(option_id).lower() for option_id in option_ids})
    return hashlib.sha256("|".join(normalized).encode("utf-8")).hexdigest()
