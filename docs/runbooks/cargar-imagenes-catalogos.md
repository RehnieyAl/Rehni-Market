# Runbook — Imágenes de los catálogos de Inicio

> Procedimiento para el rol **admin**. No se usan imágenes ajenas al proyecto ni generadas: cada
> imagen debe ser propia de RehniMarket o de una tienda con permiso de uso. [PENDIENTE: origen y
> autorización de cada imagen].

## Situación

Inicio (web y móvil) muestra los catálogos en el orden `display_order` que fija el admin; el móvil
toma los **cuatro primeros**. Consulta pública de producción (solo lectura, 23/11/2026):

| Orden | Catálogo | Imagen en producción |
|---|---|---|
| 1 | Computadoras | Sí — PNG 2400×2400, fondo transparente, **4,15 MB** (1 MB son metadatos XMP) |
| 2 | Laptops | **Falta** |
| 3 | Celulares | **Falta** |
| 4 | Tablets | **Falta** |

Los otros 116 catálogos tampoco tienen imagen. No es un error de código: `base_data` y el seed no
asignan `image_url` (la columna es opcional) y la imagen solo se carga desde el panel de admin.

## Cómo se ve cada imagen

| Superficie | Marco | Fondo | Ajuste |
|---|---|---|---|
| Web, Inicio (`HomeCategoryCard`) | 4:3 con 10 px de margen | Oscuro `#12151A` | `object-contain` |
| Móvil, Inicio (`CategorySection` → `ProductPlate`) | 4:3 | Placa clara `#ECEAE6` | `contain` |
| Móvil, Explorar | Miniatura cuadrada | Placa clara `#ECEAE6` | `contain` |

Consecuencias medidas con la imagen de Computadoras: en el lienzo cuadrado el objeto ocupa poco del
marco 4:3, y un equipo oscuro sobre transparencia se pierde contra el fondo oscuro de la web (sobre
la placa del móvil se ve bien).

## Especificación recomendada

| Atributo | Valor | Por qué |
|---|---|---|
| Proporción y tamaño | **4:3, 1200×900 px** | Llena el marco de ambas apps; 2× para pantallas densas |
| Formato | **WebP** (o PNG) con transparencia | Lo aceptan web y móvil; WebP pesa una fracción |
| Peso | **≤ 150 KB** | Inicio carga 4 a la vez, a menudo con datos móviles |
| Metadatos | **Ninguno** (`-strip`) | En Computadoras eran 1 MB de 4,15 MB |
| Encuadre | Objeto centrado, ~10 % de margen, sin texto | El nombre del catálogo ya va debajo |
| Contraste | Objeto legible sobre `#12151A` y sobre `#ECEAE6` | Si no lo es, usar fondo opaco `#ECEAE6` (decisión de la etapa de diseño) |

Ejemplo con ImageMagick, probado con la imagen actual de Computadoras: **4,15 MB → 45 KB**.

```bash
magick original.png -strip -trim +repage -resize 1080x810 \
  -background none -gravity center -extent 1200x900 \
  -define webp:method=6 -quality 80 computadoras.webp
```

## Acciones (admin)

1. Preparar las imágenes con la especificación anterior.
2. Panel de administración → **Catálogos** → editar el catálogo → **Subir imagen** → Guardar. Por
   API: `PUT /admin/dashboard/update-catalogs/{catalog_id}`, multipart con el campo `image`.
3. Repetir con Laptops, Celulares y Tablets; reemplazar la de Computadoras por la versión optimizada.
4. **Verificar**:

   ```bash
   curl -s https://<dominio-api>/public/catalogs | python3 -c \
     "import json,sys; [print(c['name'], bool(c['image_url'])) for c in json.load(sys.stdin)[:4]]"
   ```

   Las cuatro deben decir `True`. Revisar Inicio en la web y en el móvil.

**Resultado esperado:** los cuatro accesos de Inicio con imagen, sin franjas grandes alrededor.

## Hallazgo para el backend

`create_catalog_service` y `update_catalog_service` suben el archivo tal cual: no validan tipo ni
tamaño (el `content_type` lo declara el cliente) ni quitan metadatos. Recomendado: aplicar los
límites que ya usan las evidencias de denuncia (JPEG/PNG/WEBP, ≤ 5 MB) y, si se quiere, normalizar a
1200×900 al subir. No se cambió: es una mejora del panel de admin.

## Cierre

Registrar qué imágenes se cargaron, su origen y quién las autorizó: [PENDIENTE: registro].
