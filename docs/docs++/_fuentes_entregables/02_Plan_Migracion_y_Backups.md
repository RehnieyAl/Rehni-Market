<!-- Fuente del entregable 02 (Criterio SENA 2). Solo informacion verificable. -->

# PORTADA

SERVICIO NACIONAL DE APRENDIZAJE — SENA

PROGRAMA: TECNOLOGO EN ANALISIS Y DESARROLLO DE SOFTWARE (ADSO)

TRIMESTRE: SEXTO

---

## PLAN DE MIGRACION DE DATOS Y COPIAS DE SEGURIDAD

PROYECTO REHNIMARKET — PLATAFORMA DE COMERCIO ELECTRONICO TIPO MARKETPLACE

CRITERIO DE EVALUACION SENA: 2 — PLAN DE MIGRACION Y RESPALDOS

---

Autor: RehnieyAL (Yeinher Algarin) — desarrollador unico del proyecto

Instructor: ____________________________ (dato no disponible en la documentacion del proyecto)

Ficha / grupo: ____________________________ (dato no disponible)

Ciudad: ____________________________ (dato no disponible)

Anio: 2026

Repositorio: https://github.com/RehnieyAl/Rehni-Market.git

Rama analizada: feature/owner — ultimo commit publicado: 917a647 ("ver 2.4")

Fecha de elaboracion de este documento: 2026-08-31

<!-- PAGEBREAK -->

# TABLA DE CONTENIDO

<!-- TOC -->

<!-- PAGEBREAK -->

# LISTA DE TABLAS

<!-- LISTA-TABLAS -->

<!-- PAGEBREAK -->

# LISTA DE FIGURAS

<!-- LISTA-FIGURAS -->

<!-- PAGEBREAK -->

# NOTA SOBRE LA CONFIGURACION DOCKER

Este documento se elaboro cuando la configuracion endurecida se distribuia como `docker-compose.prod.yml`, `RehniMarket-frontend/Dockerfile.prod`, `RehniMarket-backend/.env.prod` y `.env.prod.example`, junto a un `docker-compose.yml` de desarrollo. Los nombres se normalizaron despues. Donde este documento diga los nombres antiguos, leanse los normalizados:

| Antes | Ahora |
|---|---|
| docker-compose.prod.yml | docker-compose.yml (configuracion por defecto) |
| docker-compose.yml (desarrollo) | docker-compose.dev.yml |
| RehniMarket-frontend/Dockerfile.prod | RehniMarket-frontend/Dockerfile |
| RehniMarket-frontend/Dockerfile (dev) | RehniMarket-frontend/Dockerfile.dev |
| RehniMarket-backend/.env.prod | RehniMarket-backend/.env |
| RehniMarket-backend/.env (dev) | RehniMarket-backend/.env.dev |
| RehniMarket-backend/.env.prod.example | RehniMarket-backend/.env.public.example |
| imagenes rehni-market-backend:prod / rehni-market-frontend:prod | rehni-market-backend / rehni-market-frontend |
| contenedores rehni-backend-prod / rehni-frontend-prod | rehni-backend / rehni-frontend |
| volumen minio_prod_data | minio_data |

Se levanta con `docker compose up -d` (sin `-f`). La evidencia `evidencias/deployment/10_prod_compose_smoke.txt` conserva el nombre antiguo por ser un registro historico de esa prueba.

<!-- PAGEBREAK -->

# 1. INTRODUCCION

Este documento define la estrategia de migracion de datos y de copias de seguridad de RehniMarket. Cubre el estado del esquema de base de datos y su evolucion versionada con Alembic, el procedimiento de respaldo y restauracion coordinado de PostgreSQL y de MinIO, la verificacion de integridad, la prueba de restauracion realmente ejecutada, los riesgos y las medidas preventivas, y el procedimiento manual reproducible.

Toda la informacion proviene de `RehniMarket-backend/alembic/`, los scripts `scripts/backup_rehnimarket.sh` y `scripts/restore_rehnimarket.sh`, el documento fuente `docs/PLAN_MIGRACION_REHNIMARKET.md` y la evidencia de la carpeta `evidencias/backup/`.

Aclaracion importante: a la fecha de este documento existe un unico backup y una unica prueba de restauracion ejecutada. NO existe un backup automatico agendado (cron o systemd) ni una copia externa cifrada automatizada; ambos se documentan como PROPUESTOS.

# 2. IMPORTANCIA DE RESPALDAR DATOS RELACIONALES Y ARCHIVOS

RehniMarket guarda su informacion en dos sistemas que deben respaldarse de forma coordinada:

- PostgreSQL: datos relacionales (usuarios, empresas, productos, variantes, pedidos, billeteras, movimientos, direcciones, resenas, reportes, transportadoras).
- MinIO: binarios (imagenes de producto y de variante, logos, banners, anuncios, certificados de empresa en PDF, evidencias de reportes).

La base de datos guarda la RUTA del objeto (por ejemplo `uploads/products/<id>/<uuid>.webp`) y MinIO guarda el binario. Si se respalda solo uno de los dos, o si se respaldan en momentos distintos, la restauracion queda inconsistente: filas que apuntan a objetos inexistentes u objetos huerfanos. Por eso todo respaldo usa un unico identificador de fecha y hora (`TS`) para el par PostgreSQL + MinIO.

# 3. ARQUITECTURA DE DATOS

## 3.1 PostgreSQL

Motor PostgreSQL 17 (`postgres:17-alpine`). Base de datos `rehnimarket`, esquema `public`. Volumen Docker `postgres_rehni_data` montado en `/var/lib/postgresql/data`. El modelo comprende aproximadamente 36 tablas (37 contando la tabla de control `alembic_version`). Usa extensiones nativas: `pg_trgm` y `unaccent`, mas la funcion inmutable `rehni_search_norm(text)` y un indice GIN, empleados por la busqueda difusa de productos.

## 3.2 MinIO

Almacenamiento de objetos compatible con S3 (`minio/minio:latest`). Bucket unico llamado `uploads`, con el nombre fijo en el codigo (`app/services/NasService.py`). Volumen Docker `minio_rehni_data` montado en `/data`. El bucket se crea automaticamente en el arranque del backend.

## 3.3 Configuracion

Los archivos `.env` (backend, frontend, movil) contienen credenciales y URLs y estan fuera del control de versiones. La restauracion en un servidor nuevo exige recrearlos desde los `.env.example` y una copia cifrada de los valores reales.

# 4. ESTRATEGIA DE MIGRACION: ALEMBIC

## 4.1 Estado del esquema

El esquema de base de datos evoluciona mediante migraciones versionadas de Alembic 1.18.4, en una cadena LINEAL sin ramas. La configuracion (`alembic/env.py`) toma la URL de la base desde `app.Config` y no desde `alembic.ini`. Las migraciones se aplican automaticamente en el arranque del contenedor `backend` con `uv run alembic upgrade head`.

## 4.2 Cadena de migraciones real

Estado inicial: base de datos vacia (revision `base`, sin ninguna migracion aplicada). Estado final: revision de cabeza `a1b2c3d4e5f6`, verificada con `alembic current` el 2026-08-31 (evidencia `evidencias/deployment/08_alembic_current.txt`).

[[FIGURA]] Cadena de migraciones de Alembic (10 revisiones, lineal).

```
29fe206320ce  (base del esquema versionado)
  -> d72ef7fa597e   actualizacion de la tabla de producto
  -> 048871b47f63   atributos de catalogo
  -> a90540bebea    combinaciones de variante y descuentos
  -> b6f8fd31fbe     backfill del modelo anterior a la arquitectura de atributos
  -> cb6d38ee0bd     snapshot de atributos en el item de pedido
  -> d4e5f6a7b8c9    anuncios: eliminacion de los campos de texto
  -> e7a1c9d24b30    transportadoras y campos de envio del pedido
  -> f2b7c4e91a05    IVA por producto
  -> a1b2c3d4e5f6    busqueda difusa (pg_trgm + unaccent + rehni_search_norm)   (HEAD)
```

Fuente: `RehniMarket-backend/alembic/versions/`.

Nota de consistencia: el documento `docs/RehniMarket-Requisitos.docx` (RNF-019) menciona "23 migraciones" y una cabeza distinta; ese dato es anterior a la reestructuracion de la version 2.0. El estado verificado del codigo actual es de 10 migraciones lineales con cabeza `a1b2c3d4e5f6`.

## 4.3 Reversibilidad

Cada migracion define `upgrade()` y `downgrade()`. El esquema puede reconstruirse desde cero encadenando las migraciones y revertirse migracion por migracion. Para una migracion de datos entre servidores se usa un volcado logico (`pg_dump`), no la copia fisica del volumen, para no depender de la version binaria del motor.

# 5. ESTRATEGIA DE BACKUP

## 5.1 PostgreSQL

Herramienta: `pg_dump` en formato personalizado y comprimido (`-F c -Z 6`), ejecutado dentro del contenedor `postgres`. Justificacion: es un volcado logico portable (PostgreSQL 17 a version igual o superior), permite restauracion selectiva y su indice (`pg_restore -l`) sirve para validar el contenido antes de restaurar.

## 5.2 MinIO

Herramienta: el cliente `mc` incluido en la imagen de MinIO, con la operacion de espejo (`mc mirror`) del bucket `uploads`, que preserva la ruta completa de cada objeto. El resultado se empaqueta en un `.tar.gz`.

## 5.3 Integridad mediante SHA-256

Cada artefacto de respaldo lleva su archivo de resumen SHA-256. La verificacion con `sha256sum -c` se ejecuta antes de restaurar, tanto en el origen como en el destino.

## 5.4 Backup conjunto y coordinado

El script `scripts/backup_rehnimarket.sh` genera el par PostgreSQL + MinIO con el mismo `TS`, calcula los resumenes, escribe un manifiesto y aplica una rotacion (conserva las ultimas N copias). Con la opcion por defecto detiene brevemente el backend para obtener un par consistente; con `--no-stop` no lo detiene (util en demostracion).

## 5.5 Backup de la configuracion

Los `.env` reales no se versionan. Se recomienda mantener una copia cifrada (GPG) de los valores reales fuera del servidor, junto con los `.env.example` del repositorio.

[[TABLA]] Resumen de la estrategia de respaldo.

| Que se respalda | Herramienta | Frecuencia propuesta | Verificacion | Estado |
|---|---|---|---|---|
| Base de datos PostgreSQL | pg_dump -F c dentro del contenedor | Diaria (propuesta) | sha256sum -c + pg_restore -l | Script creado y ejecutado una vez |
| Objetos de MinIO (bucket uploads) | mc mirror + tar.gz | Diaria (propuesta), mismo TS que la BD | sha256sum -c + conteo de objetos | Script creado y ejecutado una vez |
| Archivos de configuracion (.env) | Copia manual cifrada con GPG | Ante cada cambio | Descifrado de prueba | PROPUESTO (no implementado) |
| Automatizacion (cron / systemd) | Temporizador de sistema | — | — | PROPUESTO (no implementado) |
| Copia externa fuera del host | Transferencia cifrada a otro almacenamiento | Diaria | — | PROPUESTO (no implementado) |

# 6. PROCEDIMIENTO MANUAL REPRODUCIBLE

## 6.1 Respaldo manual minimo (sin los scripts)

```
mkdir -p backups

# 1) PostgreSQL (formato custom)
docker compose exec -T postgres \
  pg_dump -U <POSTGRES_USER> -d <POSTGRES_DB> -F c -Z 6 \
  > backups/rehnimarket_$(date +%F_%H-%M).dump

# 2) MinIO (objetos del bucket "uploads")
docker compose exec -T minio sh -c '
  mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" &&
  mc mirror --overwrite local/uploads /tmp/uploads_backup &&
  tar -czf - -C /tmp uploads_backup' > backups/rehnimarket_minio_$(date +%F_%H-%M).tar.gz

# 3) Resumenes de integridad
sha256sum backups/rehnimarket_*.dump  > backups/checksums.sha256
sha256sum backups/rehnimarket_minio_*.tar.gz >> backups/checksums.sha256
```

## 6.2 Respaldo con los scripts del proyecto

```
scripts/backup_rehnimarket.sh                 # respaldo coordinado + SHA-256 + manifiesto + rotacion
scripts/backup_rehnimarket.sh --no-stop       # sin detener el backend (demostracion)
```

# 7. PROCEDIMIENTO DE RESTAURACION

## 7.1 Orden general

1. Verificar los resumenes SHA-256 de ambos artefactos (`sha256sum -c`).
2. Restaurar PostgreSQL con `pg_restore` sobre una base vacia.
3. Restaurar los objetos de MinIO con `mc mirror` desde el `.tar.gz` descomprimido.
4. Ejecutar las validaciones (seccion 8).

## 7.2 Restauracion manual

```
# Verificacion previa
sha256sum -c backups/checksums.sha256

# PostgreSQL: la imagen crea la base <POSTGRES_DB> vacia la primera vez
cat backups/rehnimarket_<TS>.dump | docker compose exec -T postgres \
  pg_restore -U <POSTGRES_USER> -d <POSTGRES_DB> --clean --if-exists --no-owner

# MinIO
tar -xzf backups/rehnimarket_minio_<TS>.tar.gz -C /tmp
docker compose exec -T minio sh -c '
  mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" &&
  mc mirror --overwrite /tmp/uploads_backup local/uploads'
```

## 7.3 Restauracion con el script (entorno aislado)

```
scripts/restore_rehnimarket.sh <TS>
```

El script levanta un PostgreSQL y un MinIO temporales y desechables (contenedores independientes, red propia), verifica los resumenes, restaura, ejecuta las validaciones y destruye el entorno de prueba al terminar. Es la forma recomendada de probar que un backup es restaurable sin tocar el entorno principal.

## 7.4 Que hacer si la restauracion falla

- Si falla la verificacion SHA-256: el artefacto esta corrupto; usar la copia anterior de la retencion.
- Si falla `pg_restore`: revisar que la base este vacia; usar `--clean --if-exists`; revisar la version del motor destino (debe ser 17 o superior).
- Si falla `mc mirror`: revisar credenciales del destino y que el `.tar.gz` este completo.
- Regla de oro: no destruir el origen hasta haber validado el destino (seccion 9).

# 8. VALIDACION POSTERIOR A LA MIGRACION O RESTAURACION

Se comprueba, contra el origen anotado antes de migrar:

- Numero de tablas restauradas.
- Conteos de filas de tablas clave (roles, users, company, products, product_variants, orders, order_items, wallets, wallet_transactions).
- Extensiones `pg_trgm` y `unaccent` presentes y funcion `rehni_search_norm('Audifonos')` devuelve `audifonos`.
- Revision de Alembic embebida en el volcado (`SELECT version_num FROM alembic_version`).
- Numero de objetos de MinIO frente al respaldo.
- Comprobacion de referencias: cada ruta de imagen en la base tiene su objeto en MinIO.

# 9. PLAN DE CONTINGENCIA Y ROLLBACK

- Principio: el origen se mantiene intacto y en solo lectura hasta validar el destino.
- Si la migracion falla: se aborta, se conserva el origen operativo y se investiga con los logs.
- Rollback en el mismo servidor: restaurar el ultimo backup valido de la retencion (se conservan 7).
- Conservacion: los backups se guardan fuera del host principal y no se suben a Git (`.gitignore` incluye `/backups/`, `*.dump`, `*.tar.gz`, `*.sha256`).

# 10. PRUEBA DE RESTAURACION EJECUTADA

Ejecutada el 2026-08-31 con `scripts/backup_rehnimarket.sh --no-stop` seguido de `scripts/restore_rehnimarket.sh 2026-08-31_16-59`. Identificador del backup (`TS`): `2026-08-31_16-59`. Entorno aislado: contenedores `rehni-restore-pg` y `rehni-restore-minio`, destruidos al terminar. Evidencia: `evidencias/backup/backup.txt`, `restore.txt`, `checksums.txt`, `contenido_dump.txt`, `manifest.txt`.

[[TABLA]] Resultado de la prueba de restauracion (2026-08-31).

| Prueba | Resultado obtenido | Estado |
|---|---|---|
| Backup PostgreSQL creado y validado | .dump de 220 KB; sha256sum -c: "La suma coincide"; pg_restore -l: 37 tablas en el TOC | APROBADO |
| Backup MinIO creado y validado | .tar.gz de 8,9 MB; 166 objetos; sha256sum -c: "La suma coincide" | APROBADO |
| Ambiente de prueba levantado | Contenedores aislados en red propia | APROBADO |
| Restauracion de PostgreSQL sin errores | pg_restore completo; todas las claves foraneas creadas | APROBADO |
| Revision de Alembic embebida | SELECT version_num FROM alembic_version -> a1b2c3d4e5f6 | APROBADO |
| Restauracion de MinIO sin errores | mc mirror transfirio 8,76 MiB, sin errores | APROBADO |
| Numero de tablas restauradas | 37 (igual al origen) | APROBADO |
| Conteos de filas frente al origen | roles 4=4; users 11=11; company 6=6; products 33=33; product_variants 112=112; orders 22=22; order_items 30=30; wallets 4=4; wallet_transactions 26=26 | APROBADO |
| Conteo de objetos MinIO frente al origen | 166 = 166 | APROBADO |
| Extensiones y funcion de busqueda | pg_trgm, unaccent, plpgsql presentes; rehni_search_norm('Audifonos') -> audifonos | APROBADO |
| Ambiente de prueba destruido | docker rm -f de ambos contenedores + docker network rm | APROBADO |
| Imagenes del catalogo cargan por el proxy en la app restaurada | Requiere montar un backend sobre el entorno aislado | PENDIENTE (no critico; los 166 objetos estan integros) |
| Login y flujo de compra sobre el ambiente restaurado | Cubierto por acceptance_smoke.sh sobre el entorno principal | PENDIENTE sobre el entorno aislado |
| Suite pytest sobre el ambiente restaurado | pytest usa su propia base rehnimarket_test; la suite (113/113) corrio sobre el entorno principal | NO APLICA |

Resultado global de la prueba de restauracion: APROBADA. Los datos y los objetos se restauran integros y coincidiendo con el origen. Los tres items marcados PENDIENTE requieren montar la aplicacion completa sobre el entorno aislado (paso adicional, no critico para demostrar que el backup es restaurable).

# 11. RIESGOS Y MEDIDAS PREVENTIVAS

Evaluacion cualitativa. Los valores de probabilidad e impacto son estimados.

[[TABLA]] Riesgos de migracion y respaldo, con mitigacion.

| ID | Riesgo | Probabilidad | Impacto | Mitigacion |
|---|---|---|---|---|
| R-1 | Perdida de datos durante la migracion | Media | Alto | Origen intacto y en solo lectura hasta validar el destino; backend detenido durante el backup; par PostgreSQL + MinIO con el mismo TS. |
| R-2 | Corrupcion del backup (transferencia truncada, disco defectuoso) | Media | Alto | sha256sum en origen y verificacion en destino; pg_restore -l; retencion de 7 copias. |
| R-3 | Falta de espacio en origen o destino | Media | Medio | Verificacion previa de espacio; compresion; limpiar copias fuera de retencion antes de empezar. |
| R-4 | Incompatibilidad de versiones de PostgreSQL | Baja | Alto | Volcado logico (portable 17 a version igual o superior); misma imagen postgres:17-alpine en el destino. |
| R-6 | Perdida de objetos de MinIO (se respalda solo PostgreSQL) | Media | Alto | El plan trata MinIO al mismo nivel que PostgreSQL; comprobacion de referencias. |
| R-7 | Credenciales incorrectas en el destino (.env mal recreado) | Media | Medio | Recrear el .env desde .env.example mas copia cifrada; probar pg_isready y mc ls antes de restaurar. |
| R-9 | URLs de imagenes rotas tras migrar (build_media_url) | Baja (ya corregido) | Alto | build_media_url() usa URL_BACKEND (correccion ya aplicada); definir URL_BACKEND en el destino. |
| R-11 | Backup incompleto (se respaldo con escrituras en curso) | Media | Alto | docker compose stop backend antes de respaldar; validar conteos contra el origen. |
| R-12 | Desincronizacion PostgreSQL/MinIO (backups de fechas distintas) | Media | Alto | Un solo TS para el par; restaurar siempre el par emparejado. |
| R-13 | SECRET_KEY reutilizada o de ejemplo | Media | Medio | Generar SECRET_KEY nueva y aleatoria en el destino. |
| R-14 | Exposicion de datos personales en los backups | Media | Alto | Cifrado GPG de las copias externas; permisos restrictivos; no subir a Git. |

# 12. OBJETIVOS DE RECUPERACION (RPO Y RTO)

Objetivos definidos para el proyecto, NO metricas medidas. RehniMarket no tiene mediciones reales de indisponibilidad ni de tiempo de recuperacion.

[[TABLA]] Objetivos de recuperacion propuestos.

| Indicador | Definicion | Valor objetivo propuesto | Justificacion |
|---|---|---|---|
| RPO | Maxima perdida de datos aceptable (en tiempo) | 24 horas | Backup diario de PostgreSQL y de MinIO. En el peor caso se pierde el trabajo del dia en curso. |
| RTO — servidor nuevo | Maximo tiempo aceptable para restaurar el servicio | 4 horas | Provisionar servidor y Docker (aprox. 1 h) + restaurar PostgreSQL (minutos) + restaurar MinIO (minutos) + levantar y validar (aprox. 1 h) + margen. |
| RTO — mismo servidor | — | Menor o igual a 1 hora | Solo los pasos de restauracion, sin provisionar servidor. |

Tiempos medidos reales del ciclo del 2026-08-31 sobre el volumen actual (aprox. 10 MB de base de datos y 8,9 MB de objetos): menos de 1 minuto el respaldo y aproximadamente 30 segundos la restauracion de datos en el entorno aislado. Estos tiempos NO incluyen provisionar un servidor nuevo ni el transporte de la copia.

# 13. AUTOMATIZACION (PROPUESTA, NO IMPLEMENTADA)

No existe un backup automatico agendado. La propuesta documentada es:

1. Agendar `scripts/backup_rehnimarket.sh` con `cron` (por ejemplo diario a las 02:00 UTC) o con un temporizador de `systemd`.
2. Cifrar cada copia con GPG (la passphrase se lee de un archivo con permisos 600, nunca embebida en el script).
3. Enviar la copia cifrada a un almacenamiento externo al servidor.
4. Repetir la prueba de restauracion de forma periodica (por ejemplo mensual y tras cada cambio de esquema), dejando su evidencia.

Estas acciones requieren un servidor de operacion real; no se pueden completar en el entorno de demostracion actual.

# 14. EVIDENCIAS

[[TABLA]] Evidencias del criterio 2.

| Evidencia | Tipo | Ubicacion | Que demuestra | Estado |
|---|---|---|---|---|
| backup.txt | Salida de comando | evidencias/backup/ | Ejecucion real de backup_rehnimarket.sh (pg_dump + mc mirror) | EJECUTADO |
| checksums.txt | Salida de comando | evidencias/backup/ | SHA-256 de los artefactos y verificacion con sha256sum -c | EJECUTADO |
| contenido_dump.txt | Salida de comando | evidencias/backup/ | pg_restore -l: 37 tablas en el TOC del volcado | EJECUTADO |
| manifest.txt | Archivo generado | evidencias/backup/ | Manifiesto del backup TS 2026-08-31_16-59 | EJECUTADO |
| restore.txt | Salida de comando | evidencias/backup/ | Restauracion en entorno aislado: 37 tablas, conteos = origen, 166 objetos, entorno destruido | EJECUTADO |
| 08_alembic_current.txt | Salida de comando | evidencias/deployment/ | Revision de esquema en la cabeza (a1b2c3d4e5f6) | EJECUTADO |
| scripts/backup_rehnimarket.sh, scripts/restore_rehnimarket.sh | Codigo fuente | scripts/ | Procedimiento reproducible de respaldo y restauracion | EJECUTADO |
| Captura del backup y la restauracion durante la sustentacion | Captura de pantalla | docs/evidencias/02_migracion_backup/ | Ejecucion en vivo ante el instructor | PENDIENTE (capturar en la sustentacion) |

# 15. CONCLUSION

RehniMarket cuenta con un esquema de base de datos completamente versionado (10 migraciones lineales de Alembic, cabeza `a1b2c3d4e5f6`) y con un procedimiento de respaldo y restauracion coordinado de PostgreSQL y MinIO implementado en scripts y ejecutado una vez de extremo a extremo. La prueba de restauracion del 2026-08-31 fue APROBADA: 37 tablas y 166 objetos restaurados integros, con conteos identicos al origen. Lo que queda PENDIENTE es la automatizacion del respaldo (cron o systemd), la copia externa cifrada y la repeticion periodica de la prueba: estas actividades requieren un servidor de operacion real y estan documentadas como PROPUESTAS, sin afirmar en ningun punto que ya existan.
