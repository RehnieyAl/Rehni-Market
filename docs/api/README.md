# Documentación de la API

| Recurso | Dónde |
|---|---|
| Swagger UI interactivo | `https://api.<dominio>/docs` (o `https://api.localhost/docs` en local) con `DOCS_ENABLED=true` en el `.env`. En producción está apagado por defecto |
| Especificación OpenAPI 3 (135 rutas, API 2.6.0) | [`openapi.json`](openapi.json), exportada el 2026-11-16 desde `app.main:app` |
| Colección para Postman o Insomnia | Importar `openapi.json` (Postman: *Import → File*; genera una carpeta por etiqueta) |
| Descripción de cada endpoint y errores | Manual técnico (`docs/Manuales/Manual Tecnico.pdf`) |

Regenerar después de cambiar rutas (desde `RehniMarket-backend/`, con las variables mínimas de
`app/Config.py` definidas):

```bash
uv run python -c "import json; from app.main import app; json.dump(app.openapi(), open('../docs/api/openapi.json','w'), ensure_ascii=False, indent=2)"
```

La versión de la API (`2.6.0`, `app/main.py`) es independiente de la versión del producto
(`1.0.0`, `CHANGELOG.md`).
