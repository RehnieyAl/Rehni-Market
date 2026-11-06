# Generación de los manuales

Genera `docs/Manuales/Manual de usuario.docx`, `docs/Manuales/Manual Tecnico.docx` y
`docs/Manuales/lista-imagenes.md` (capturas pendientes, diagramas y datos por verificar).
El PDF se exporta desde OnlyOffice y no se versiona.

Todos los comandos, desde la raíz del repositorio. Usa su propio entorno de `uv`
(`docs/Manuales/scripts/.venv`), sin tocar las dependencias del backend.

```bash
# 1. (Opcional) Actualizar los datos desde el sistema: requiere el stack levantado
#    (contenedores rehni-postgres y rehni-backend). Escribe datos/esquema.json,
#    datos/endpoints.json y datos/errores.json.
uv run --project docs/Manuales/scripts python docs/Manuales/scripts/extraer_datos.py

# 2. (Opcional) Exportar los diagramas Mermaid a PNG (npx, sin instalación global).
#    La primera vez: npx -y puppeteer browsers install chrome-headless-shell
bash docs/Manuales/scripts/exportar_diagramas.sh            # todos
bash docs/Manuales/scripts/exportar_diagramas.sh arquitectura

# 3. Generar los .docx
uv run --project docs/Manuales/scripts python docs/Manuales/scripts/generar_manuales.py
```

Después, en OnlyOffice: abrir cada `.docx`, actualizar la tabla de contenido
(Referencias → Actualizar tabla), reemplazar los marcadores amarillos y exportar a PDF.

| Archivo | Contenido |
|---|---|
| `contenido_usuario.py` / `contenido_tecnico.py` | Texto de cada manual por secciones |
| `datos_comunes.py` | Portada, contacto de soporte, versión y control de cambios |
| `docx_base.py` | Formato: portada, encabezado con logo, pie con número de página, tablas No. / Descripción / Detalle, figuras y marcadores |
| `generar_manuales.py` | Arma los dos manuales y la lista de imágenes |
| `extraer_datos.py` | Extrae esquema, endpoints y errores del sistema |
| `datos/` | JSON extraídos y descripciones en español de tablas y endpoints |
| `exportar_diagramas.sh`, `mermaid-config.json` | Exportación de `docs/Manuales/diagramas/*.mmd` a PNG |
