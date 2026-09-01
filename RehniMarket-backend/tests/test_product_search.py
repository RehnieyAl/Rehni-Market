"""Búsqueda pública de productos (GET /public/products?search=).

Cubre la búsqueda tolerante a errores de escritura (pg_trgm + unaccent):
coincidencia exacta, parcial, sin tildes, con mayúsculas, con errores de una o
varias letras, palabras parcialmente escritas, y el orden por relevancia. La
búsqueda por texto que ya existía debe seguir funcionando.
"""

from app.models.ModelProduct import Product


def _make_product(db, company, catalog, name, **overrides):
    data = dict(
        name=name,
        price=100,
        descripcion="d",
        stock=5,
        company_id=company.id,
        catalog_id=catalog.id,
    )
    data.update(overrides)
    product = Product(**data)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def _search(client, query):
    body = client.get("/public/products", params={"search": query}).json()
    return [product["name"] for product in body["products"]]


class TestProductSearchMatching:
    def test_exact_match_ranks_first(self, client, db, company, catalog):
        _make_product(db, company, catalog, "Laptop Gamer")
        _make_product(db, company, catalog, "Silla Gamer")

        assert _search(client, "Laptop Gamer")[0] == "Laptop Gamer"

    def test_partial_match_still_works(self, client, db, company, catalog):
        _make_product(db, company, catalog, "Laptop Gamer")
        _make_product(db, company, catalog, "Laptop")
        _make_product(db, company, catalog, "Teclado")

        names = _search(client, "laptop")

        assert set(names) == {"Laptop Gamer", "Laptop"}

    def test_case_insensitive(self, client, db, company, catalog):
        _make_product(db, company, catalog, "Laptop")

        assert _search(client, "LAPTOP") == ["Laptop"]

    def test_accent_insensitive_both_directions(self, client, db, company, catalog):
        _make_product(db, company, catalog, "Audífonos Bluetooth")

        assert _search(client, "audifonos bluetooth") == ["Audífonos Bluetooth"]
        assert _search(client, "AUDÍFONOS") == ["Audífonos Bluetooth"]
        assert _search(client, "audifonos") == ["Audífonos Bluetooth"]

    def test_single_letter_typo(self, client, db, company, catalog):
        _make_product(db, company, catalog, "Laptop")

        assert _search(client, "laptp") == ["Laptop"]

    def test_multi_letter_typo_with_words(self, client, db, company, catalog):
        _make_product(db, company, catalog, "Audífonos Bluetooth")

        assert _search(client, "audifonos bluetooh") == ["Audífonos Bluetooth"]

    def test_partially_written_and_scrambled_words(self, client, db, company, catalog):
        _make_product(db, company, catalog, "Mouse Inalámbrico")

        assert _search(client, "mause inalambrico") == ["Mouse Inalámbrico"]

    def test_short_fuzzy_token_matches_longer_name(self, client, db, company, catalog):
        _make_product(db, company, catalog, "Mouse Inalámbrico")

        assert _search(client, "mause") == ["Mouse Inalámbrico"]

    def test_extra_whitespace_is_ignored(self, client, db, company, catalog):
        _make_product(db, company, catalog, "Laptop Gamer")

        assert _search(client, "   laptop    gamer  ") == ["Laptop Gamer"]


class TestProductSearchRelevance:
    def test_best_match_ranks_first(self, client, db, company, catalog):
        _make_product(db, company, catalog, "Silla Gamer")
        _make_product(db, company, catalog, "Laptop")
        _make_product(db, company, catalog, "Laptop Gamer")

        names = _search(client, "laptp gamer")

        assert names[0] == "Laptop Gamer"

    def test_exact_ranks_above_fuzzy(self, client, db, company, catalog):
        _make_product(db, company, catalog, "Laptop Gamer Pro")
        _make_product(db, company, catalog, "Laptop")

        names = _search(client, "laptop")

        assert names[0] == "Laptop"


class TestProductSearchEdgeCases:
    def test_empty_query_returns_all(self, client, db, company, catalog):
        _make_product(db, company, catalog, "Laptop")
        _make_product(db, company, catalog, "Teclado")

        assert set(_search(client, "")) == {"Laptop", "Teclado"}
        assert set(_search(client, "    ")) == {"Laptop", "Teclado"}

    def test_no_match_returns_empty_without_error(self, client, db, company, catalog):
        _make_product(db, company, catalog, "Laptop")

        response = client.get(
            "/public/products", params={"search": "zzqqxxnomatch"}
        )

        assert response.status_code == 200
        assert response.json()["products"] == []

    def test_search_without_param_lists_products(self, client, db, company, catalog):
        _make_product(db, company, catalog, "Laptop")

        body = client.get("/public/products").json()

        assert [product["name"] for product in body["products"]] == ["Laptop"]

    def test_search_respects_other_filters(self, client, db, company, catalog):
        _make_product(db, company, catalog, "Laptop Gamer", price=100)
        _make_product(db, company, catalog, "Laptop Oficina", price=5000)

        body = client.get(
            "/public/products", params={"search": "laptop", "max_price": 1000}
        ).json()

        assert [product["name"] for product in body["products"]] == ["Laptop Gamer"]
