# Entregables SENA — RehniMarket

> Fecha de generacion: 2026-08-31. Rama: `feature/owner`.
> Autor: RehnieyAL (Yeinher Algarin) — desarrollador unico.
>
> Este archivo explica la estructura de los 11 documentos de entrega, el criterio
> SENA que cubre cada uno, que pruebas deben ejecutarse presencialmente, que
> evidencias hay que capturar, que queda pendiente y el orden recomendado para la
> sustentacion.
>
> **Regla de todos los documentos:** solo informacion verificable en el
> repositorio, el codigo y las evidencias reales. Lo no ejecutado se marca
> PENDIENTE / NO EJECUTADO / REQUIERE VALIDACION. No se inventan resultados,
> nombres, firmas ni fechas.

> **Nota de normalizacion de la configuracion Docker (posterior a estos documentos).**
> Estos documentos se elaboraron cuando la configuracion endurecida se distribuia
> como `docker-compose.prod.yml` y `RehniMarket-frontend/Dockerfile.prod`, junto a
> un `docker-compose.yml` de desarrollo. Despues se normalizaron los nombres: la
> configuracion endurecida es ahora la **por defecto** (`docker-compose.yml`,
> `RehniMarket-frontend/Dockerfile`, imagenes `rehni-market-backend` /
> `rehni-market-frontend`, contenedores `rehni-backend` / `rehni-frontend` /
> `rehni-postgres` / `rehni-minio`) y el modo desarrollo pasa a
> `docker-compose.dev.yml` / `RehniMarket-frontend/Dockerfile.dev`. Se usa
> `docker compose up -d` sin `-f`. Donde estos documentos digan
> `docker-compose.prod.yml` / `Dockerfile.prod` / `*-prod`, leer los nombres
> normalizados. La evidencia `evidencias/deployment/10_prod_compose_smoke.txt`
> conserva el nombre antiguo por ser un registro historico de esa prueba.

---

## 1. Estructura de carpetas

```
docs/
├── 01_MODULO_A_DESPLIEGUE/
│   ├── 01_Plataforma_e_Infraestructura.docx      (Criterio 1)
│   ├── 02_Plan_Migracion_y_Backups.docx          (Criterio 2)
│   ├── 03_Despliegue_y_Publicacion.docx          (Criterio 3)
│   ├── 04_Usuarios_Roles_y_Permisos.docx         (Criterio 4)
│   ├── 05_Documentacion_Tecnica_y_Manuales.docx  (Criterio 5)
│   └── 06_Pruebas_Aceptacion_y_Entrega.docx      (Criterio 6)
├── 02_MODULO_B_CALIDAD/
│   ├── 07_Calidad_ISO_PSP.docx                   (Criterio 7)
│   ├── 08_Requisitos_No_Funcionales.docx         (Criterio 8)
│   ├── 09_Informe_Evaluacion_Calidad.docx        (Criterio 9)
│   └── 10_Plan_Mejora_Continua.docx              (Criterio 10)
├── 03_AVANCE_PROYECTO/
│   └── 11_Informe_Avance_90.docx                 (Criterio 11 — INDEPENDIENTE)
├── evidencias/
│   ├── 01_infraestructura/ ... 11_avance/        (una carpeta por criterio, con LEEME.md)
├── _fuentes_entregables/                         (los .md editables que generan los .docx)
└── README_ENTREGABLES.md                         (este archivo)
```

Los documentos fuente originales del proyecto (`DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md`,
`MANUAL_TECNICO_REHNIMARKET.md`, `MANUAL_USUARIO_REHNIMARKET.md`,
`PLAN_MIGRACION_REHNIMARKET.md`, `PLAN_PRUEBAS_ACEPTACION_REHNIMARKET.md`,
`INFORME_CALIDAD_REHNIMARKET.md`, `BITACORA_PSP_REHNIMARKET.md`,
`CONSOLIDADO_AVANCE_REHNIMARKET.md`, `AUDITORIA_FINAL_REHNIMARKET.md`,
`ACTA_ENTREGA_REHNIMARKET.md`, `RehniMarket-HU.md`, `RehniMarket-Requisitos.docx`,
`REHNIMARKET_DOCUMENTO_FINAL.docx`) **se conservan intactos** en `docs/`.

La evidencia reproducible (salidas de comando) sigue en la carpeta `evidencias/` de
la **raiz** del repositorio; `docs/evidencias/` es solo el area de preparacion de
las capturas de la sustentacion.

---

## 2. Formato de los documentos

Todos los `.docx` comparten formato academico: tamano carta, margenes 2.54 cm,
Times New Roman, texto y encabezados en negro, interlineado 2.0, texto justificado,
numeracion de paginas, portada independiente sin numero, tabla de contenido
actualizable (campo TOC de Word), lista de tablas, y lista de figuras solo donde
hay figuras reales. Tablas reales de Word con fondo blanco y bordes negros, sin
sombreado. Sin colores, sin emojis, sin iconos.

**Al abrir cada documento en Word:** clic derecho sobre la linea de la tabla de
contenido → Actualizar campos → Actualizar toda la tabla.

---

## 3. Que contiene cada documento y que criterio cubre

| Documento | Criterio | Contenido |
|---|---|---|
| 01_Plataforma_e_Infraestructura | 1 — Preparacion de plataforma e infraestructura | Hardware medido, sistema operativo, Docker, Compose, Node/pnpm, Python/uv, PostgreSQL, MinIO, Nginx, arquitectura, servicios, puertos, dependencias, variables de entorno, requisitos de ejecucion, verificacion de infraestructura con comandos reales, evidencias |
| 02_Plan_Migracion_y_Backups | 2 — Plan de migracion y respaldos | Estrategia de migracion, Alembic, estado inicial y final, cadena de 10 migraciones, backup y restauracion de PostgreSQL y MinIO, integridad SHA-256, procedimiento manual reproducible, riesgos, RPO/RTO propuestos, prueba de restauracion ejecutada (APROBADA), automatizacion PROPUESTA (no implementada) |
| 03_Despliegue_y_Publicacion | 3 — Despliegue y publicacion | Arquitectura de la configuracion por defecto (`docker-compose.yml`, antes `docker-compose.prod.yml`), build del backend y del frontend, Nginx, healthchecks, puertos, seguridad, diferencias con `docker-compose.dev.yml`, verificacion con `docker compose ps` y logs, acceso por navegador, cloudflared (contenedor huerfano, no publica RehniMarket), que funciona hoy y que requiere infraestructura externa |
| 04_Usuarios_Roles_y_Permisos | 4 — Gestion de usuarios y permisos | 5 roles, autenticacion, JWT y refresh tokens, autorizacion por rol y por ruta, proteccion de endpoints, verificacion de pertenencia, recuperacion de contrasena, verificacion de cuenta, casos de acceso permitido y rechazado con evidencia, hallazgos de seguridad de acceso |
| 05_Documentacion_Tecnica_y_Manuales | 5 — Documentacion tecnica y manuales | Indice y resumen de los 3 manuales: A) instalacion, B) tecnico, C) usuario. Mapa de la documentacion, requisitos, instalacion, configuracion, ejecucion, Docker, base de datos, migraciones, MinIO, endpoints, uso de la plataforma, administracion, solucion de problemas, desviaciones documentadas |
| 06_Pruebas_Aceptacion_y_Entrega | 6 — Pruebas de aceptacion y entrega formal | Objetivo, alcance, preparacion, precondiciones, resumen de la matriz (~240 casos), pruebas YA EJECUTADAS con evidencia, pruebas PENDIENTES DE EJECUCION PRESENCIAL (matriz con formato completo), casos negativos, criterios de aceptacion, GUION DE DEMOSTRACION PRESENCIAL, capacitacion (NO REALIZADA), acta (SIN DILIGENCIAR), checklist de sustentacion |
| 07_Calidad_ISO_PSP | 7 — Marcos de calidad y PSP | Calidad del software, ISO/IEC 25010 (8 caracteristicas), ISO/IEC 25000, subcaracteristicas, evidencias, PSP (planificacion, seguimiento por hitos reales de Git, 20 defectos, esfuerzo estimado retrospectivo, retrospectiva), metricas (distingue MEDICION REAL de ESTIMACION RETROSPECTIVA), limitaciones, plan de mejora del proceso personal |
| 08_Requisitos_No_Funcionales | 8 — Requisitos no funcionales | Los 31 RNF reales (RNF-001 a RNF-031) tomados de docs/RehniMarket-Requisitos.docx, cada uno con ID, nombre, descripcion, categoria, criterio de aceptacion, evidencia, estado y metodo de verificacion. Categorizados. Notas de consistencia (RNF-019, RNF-028). Lo que falta para el criterio 8 |
| 09_Informe_Evaluacion_Calidad | 9 — Registro e informe de evaluacion de calidad | Metodologia, pruebas realizadas, inventario de pruebas automatizadas, 13 hallazgos positivos, 18 hallazgos negativos H-01..H-18 con estado (RESUELTO / PARCIAL / PENDIENTE / NO APLICA), evaluacion de seguridad y severidad, defectos y correcciones aplicadas, estado posterior, resultado ISO/IEC 25010, limitaciones, lecciones aprendidas |
| 10_Plan_Mejora_Continua | 10 — Plan de mejora continua | 27 acciones (11 correctivas AC, 9 preventivas AP, 8 mejoras MF), cada una con hallazgo relacionado, problema, accion correctiva, accion preventiva, responsable, prioridad, horizonte, estado y evidencia. Solo se marca HECHO lo efectivamente realizado y verificado. Acciones criticas priorizadas |
| 11_Informe_Avance_90 | 11 — Avance minimo del 90 % (INDEPENDIENTE) | Calculo transparente del avance funcional (RF 62/65, RNF 27/31, ponderado global ~86 %) y del entregable SENA (promedio de los 11 criterios: 940/11 = ~85 %). Matriz criterio/descripcion/estado/porcentaje/evidencia/observacion. NO alcanza el 90 % del entregable; se muestra exactamente que falta (sobre todo el criterio 6). No se inventa el 90 % |

---

## 4. Pruebas que deben ejecutarse PRESENCIALMENTE

Detalle completo en el documento **06_Pruebas_Aceptacion_y_Entrega.docx**, secciones 7 y 9.

**Ya ejecutadas (con evidencia versionada):**

- Suite `pytest` del backend: 113/113 (`evidencias/tests/pytest.txt`), cobertura 62 %.
- Muestra tecnica de aceptacion contra la API: 28/28 (`evidencias/acceptance/resultados.txt`).
- Verificacion estatica de frontend y app movil: 0 errores (`evidencias/tests/`).
- Autorizacion por rol: 401/403/200 (`evidencias/security/roles/roles_permisos.txt`).
- Respaldo y restauracion: APROBADA (`evidencias/backup/`).
- Rendimiento basico: 900 solicitudes, 0 errores (`evidencias/performance/resultado.txt`).
- Despliegue local y stack de produccion en aislado (`evidencias/deployment/`).

**Pendientes de ejecucion presencial (con un usuario final operando la interfaz):**

1. Nucleo funcional: autenticacion, catalogo, producto y variantes, carrito y stock,
   checkout con RehniCoin (IVA, saldo insuficiente, exito), pedidos y cancelacion,
   RehniCoin, resenas, panel de empresa (crear producto y variantes, avanzar estados,
   transportadora), panel de administracion (aprobar/suspender empresa, acreditar
   RehniCoin, liquidacion, restricciones de cuentas Owner).
2. Casos negativos de seguridad de acceso (N-01 a N-10 del documento 06).
3. Pruebas responsive en el navegador (varios anchos) y en el dispositivo movil.
4. Sesiones de capacitacion (comprador, empresa, administrador) con lista de
   asistencia y grabacion.
5. Diligenciar y firmar el acta de entrega.

**No ejecutado / no realizado (queda como trabajo futuro):**

- Campana de carga con la herramienta k6 (`scripts/load_test.k6.js` esta lista, NO ejecutada).
- Auditoria de accesibilidad (WCAG / axe / Lighthouse).
- Despliegue en un servidor de produccion real con dominio y certificado TLS.
- Automatizacion del respaldo (cron / systemd) y copia externa cifrada.

---

## 5. Evidencias que deben capturarse

Cada carpeta `docs/evidencias/NN_<criterio>/` tiene un `LEEME.md` con la lista de
capturas a conseguir. Resumen:

| Carpeta | Capturas principales |
|---|---|
| 01_infraestructura | `docker compose ps` (healthy), Swagger en el navegador, `docker stats` |
| 02_migracion_backup | Ejecucion de backup y de restore con la tabla de validacion |
| 03_despliegue | Compose de produccion, frontend por Nginx en el navegador; (dominio con HTTPS: PENDIENTE) |
| 04_usuarios_permisos | Acceso rechazado 403, login exitoso, app movil cerrando sesion de empresa |
| 05_documentacion | Swagger navegable; (diagrama ER grafico: PENDIENTE) |
| 06_pruebas_aceptacion | Video/captura de CADA caso de la matriz con usuario final; capacitaciones; acta firmada |
| 07_calidad_psp | Salida de `pytest`, informe de calidad y bitacora PSP |
| 08_rnf | Pruebas responsive; (k6: PENDIENTE; accesibilidad: NO REALIZADA) |
| 09_evaluacion | Registro de hallazgos; salida completa de `pytest` |
| 10_mejora | Plan de mejora y estado de las acciones cerradas |
| 11_avance | Matriz de los 11 criterios con porcentaje |

Ninguna captura se inventa. Lo no ejecutado se deja marcado como PENDIENTE.

---

## 6. Elementos que siguen PENDIENTES

| Pendiente | Criterio | Naturaleza |
|---|---|---|
| Pruebas de aceptacion con un usuario final + capturas | 6 | Requiere una persona |
| Sesiones de capacitacion (asistencia + grabacion) | 6 | Requiere una persona |
| Acta de entrega diligenciada y firmada | 6 | Requiere firmas |
| Despliegue real en servidor con dominio y reverse proxy TLS | 3 | Requiere infraestructura externa |
| Campana de carga con k6 + SLO acordados | 8 | Automatizable (plantilla lista) |
| Auditoria de accesibilidad (WCAG / axe / Lighthouse) | 8 | Automatizable |
| Automatizacion del respaldo (cron/systemd) + copia externa cifrada | 2 | Requiere servidor de operacion |
| Validacion funcional de las pantallas de comprador de la app movil | 6 / avance | En el arbol de trabajo |
| Diagrama entidad-relacion grafico | 5 | El ER textual existe |
| Correccion del texto de HU-004 y HU-025 (desviaciones documentadas) | 9 / 10 | Edicion menor |
| Requisito RF-065 (reembolso al cancelar un pedido individual) | avance | NO implementado |
| Integracion continua; linter de Python; pruebas de cliente; umbral de cobertura | 9 / 10 | En el plan de mejora con horizonte |

Estado global del entregable SENA: **aproximadamente 85 %** (promedio de los 11
criterios). El avance funcional del alcance principal (backend + web) supera el 95 %.
El detalle del calculo esta en el documento 11.

---

## 7. Orden recomendado para la sustentacion

1. **Presentacion del proyecto** (2 min): que es RehniMarket, los 3 componentes,
   el modelo de negocio (RehniCoin, IVA 19 %, comision 5 %).
2. **Criterio 1 — Infraestructura**: `docker compose ps`, Swagger, `/health/database`.
3. **Criterio 5 — Documentacion**: mostrar el manual tecnico y el de usuario; Swagger.
4. **Criterio 4 — Usuarios y permisos**: registro, verificacion, login; acceso
   rechazado 403; `evidencias/security/roles/roles_permisos.txt`.
5. **Criterio 6 — Demostracion funcional** (guion completo del documento 06 seccion 9):
   catalogo como visitante, panel de empresa (crear producto y variantes), panel de
   administracion (acreditar RehniCoin), compra completa como comprador (incluir
   saldo insuficiente y producto agotado), pedidos y envio.
6. **Criterio 7 y 9 — Calidad**: salida de `pytest` (113/113), informe de calidad
   (hallazgos), bitacora PSP.
7. **Criterio 8 — RNF**: pruebas responsive; explicar que k6 y la auditoria de
   accesibilidad estan preparados pero no ejecutados.
8. **Criterio 2 — Migracion y respaldos**: ejecutar `scripts/backup_rehnimarket.sh`
   y `scripts/restore_rehnimarket.sh` en vivo; mostrar la tabla de validacion.
9. **Criterio 3 — Despliegue**: `docker-compose.yml` (configuracion por defecto endurecida); explicar que la
   publicacion real con TLS requiere servidor y dominio.
10. **Criterio 10 — Plan de mejora**: 27 acciones, aprox. 10 cerradas.
11. **Criterio 11 — Avance**: matriz de los 11 criterios; calculo transparente
    (~85 % del entregable); que falta para el 90 %.
12. **Cierre**: pendientes honestos y trabajo futuro.

---

## 8. Como se regeneran los documentos

Las fuentes editables estan en `docs/_fuentes_entregables/*.md`. Se regeneran con
el script `build_entregables.py` (usa `python-docx`). El script no altera ningun
otro archivo del proyecto.
