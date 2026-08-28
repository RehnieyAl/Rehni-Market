"""
Huella determinista de la combinacion de opciones de una variante.

`combo_key` + UNIQUE(product_id, combo_key) es la garantia REAL, a nivel
de base de datos, de que un producto no tenga dos variantes con la misma
combinacion de atributos (Verde+40 no puede repetirse). No se confia solo
en una comprobacion de Python: entre el SELECT de "ya existe?" y el
INSERT hay una ventana de carrera; el UNIQUE la cierra.

La generacion es determinista e independiente del orden en que se
seleccionaron las opciones:

    [option_talla_40, option_color_verde]  -> mismo hash que
    [option_color_verde, option_talla_40]

Producto sin ejes de variante (SKU unico): combo_key = hash de "" -> una
sola variante posible.
"""

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
