# Generación de los manuales

Genera, con el diseño de los manuales 2.0 (portada, encabezado con logo, tablas No. / Descripción /
Detalle) definido como estilos reales en `diseno_sena.py`:

- `docs/Manuales/Manual de usuario.docx`
- `docs/Manuales/Manual Tecnico.docx`
- `docs/Manuales/Diccionario de datos.docx`
- `docs/Manuales/capturas/LISTA-CAPTURAS.md`: capturas de pantalla pendientes, por perfil, con los datos de prueba
- `docs/Manuales/lista-imagenes.md`: figuras de cada documento y datos por verificar

Los originales `Manual de usuario -ORIGINAL.dotx` y `Manual Tecnico -original.docx` (PDF 2.0 convertidos a
Word) son solo respaldo: el script no los lee ni los modifica.

> **Importante:** el script vuelve a crear los `.docx` desde cero. No ejecutarlo después de editar los
> documentos en OnlyOffice (se perderían esos cambios): en ese caso, editar a mano o copiar antes los cambios
> al contenido de los scripts.

Todos los comandos, desde la raíz del repositorio. Usa su propio entorno de `uv`
(`docs/Manuales/scripts/.venv`), sin tocar las dependencias del backend.

```bash
# 1. (Opcional) Actualizar los datos desde el sistema: requiere el stack levantado
#    (contenedores rehni-postgres y rehni-backend). Escribe datos/esquema.json,
#    datos/endpoints.json y datos/errores.json.
uv run --project docs/Manuales/scripts python docs/Manuales/scripts/extraer_datos.py

# 2. (Opcional) Regenerar los diagramas del modelo (clases y entidad-relación por módulo)
uv run --project docs/Manuales/scripts python docs/Manuales/scripts/diagramas_modelo.py

# 3. (Opcional) Exportar los diagramas Mermaid a PNG (npx, -s 3, fondo blanco).
#    La primera vez: npx -y puppeteer browsers install chrome-headless-shell
bash docs/Manuales/scripts/exportar_diagramas.sh            # todos
bash docs/Manuales/scripts/exportar_diagramas.sh arquitectura

# 4. Generar los documentos (requiere OnlyOffice Desktop para medir las páginas de la tabla de contenido)
uv run --project docs/Manuales/scripts python docs/Manuales/scripts/generar_manuales.py
```

Después, en OnlyOffice: reemplazar cada recuadro amarillo por su captura (en línea con el texto),
actualizar la tabla de contenido (Referencias → Actualizar tabla) y exportar a PDF. Los PDF de
`docs/Manuales/` son copias de revisión y no se versionan.

| Archivo | Contenido |
|---|---|
| `contenido_usuario.py` / `contenido_tecnico.py` / `contenido_diccionario.py` | Texto de cada documento por secciones |
| `datos_comunes.py` | Portada, contacto de soporte, versión y control de cambios |
| `diseno_sena.py` | Estilos, encabezado, pie, tablas, recuadros de captura, figuras y páginas horizontales |
| `generar_manuales.py` | Arma los tres documentos, la tabla de contenido y las listas |
| `convertir_pdf.py` | Conversión a PDF con OnlyOffice (x2t), para revisar y medir páginas |
| `diagramas_modelo.py` | Diagramas de clases y entidad-relación por módulo desde `datos/esquema.json` |
| `extraer_datos.py` | Extrae esquema, endpoints y errores del sistema |
| `datos/` | JSON extraídos y descripciones en español de tablas y endpoints |
| `exportar_diagramas.sh`, `mermaid-config.json` | Exportación de `docs/Manuales/diagramas/*.mmd` a PNG |

Las imágenes se insertan incrustadas y en línea, sin cambiar la resolución: el PNG se recomprime sin pérdida
y se comprueba que los píxeles sean idénticos. Un diagrama va dentro de la celda Detalle si su letra queda
de 1,85 mm o más; si no, en una fila a todo el ancho o, si así se lee mejor, en una página horizontal.
