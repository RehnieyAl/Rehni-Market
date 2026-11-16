# Guion del simulacro cruzado — RehniMarket

> Basado en `bc-implantacion/bootcamp/week-09-aceptacion_y_entrega_formal/1-teoria/02-simulacro-cruzado.md`
> y `3-proyecto/README.md` (pasos 1 a 5). Lo prepara quien entrega; los tiempos, desviaciones y
> el resultado los anota el observador en `registro-del-simulacro.md`.

## Roles

| Rol | Quién | Hace | No hace |
|---|---|---|---|
| Entrega | Responsable técnico | Entrega el plan, el paquete y, por otro canal, las contraseñas | Hablar durante el simulacro |
| Instala | [PENDIENTE: compañero o instructor] | Sigue el plan en orden, en un servidor limpio | Completar con conocimiento propio |
| Observa | [PENDIENTE: instructor u otra persona] | Cronometra y registra cada desviación | Ayudar |

## Paquete que se entrega

| Elemento | Cómo se entrega |
|---|---|
| Plan de implantación v1.0 | `docs/plan-implantacion.md` en la etiqueta `v1.0.0` del repositorio |
| Respaldo `rehni_market_postgres_<TS>.dump` + `.sha256` | [PENDIENTE: memoria USB o enlace temporal; cifrado con `age` cuando esté implementado (plan §3.3)] |
| Respaldo `rehni_market_minio_<TS>.tar.gz` + `.sha256` | Igual |
| Valores del `.env` que no salen de `.env.example` (contraseñas de PostgreSQL y MinIO, `SECRET_KEY`, correo) | **Otro canal** (gestor de contraseñas o en persona), nunca junto al paquete |
| Cuenta de comprador de prueba verificada (para `smoke-test.sh`) | Otro canal, junto con las contraseñas |

Antes del simulacro, quien entrega anota la huella y los conteos del respaldo (misma consulta de
la sección 3.5 del plan) para compararlos al final: [PENDIENTE: huella y conteos].

## Secuencia que sigue quien instala

Todo sale del plan; esta tabla solo dice qué sección usar. La guía de producción
[`deploy/README.md`](../../deploy/README.md) resume los mismos pasos, pero el simulacro valida el plan
(`bc-implantacion/bootcamp/week-09-aceptacion_y_entrega_formal/1-teoria/02-simulacro-cruzado.md`):
quien instala sigue el plan y anota como desviación cualquier diferencia entre los dos.

| # | Qué | Sección del plan |
|---|---|---|
| 1 | Comprobar servidor limpio (sin contenedores ni volúmenes del proyecto) | `registro-del-simulacro.md`, «Comprobación de servidor limpio» |
| 2 | Instalación inicial, pasos 1 a 4 | §5.2 «Instalación inicial» |
| 3 | Configuración en un solo paso: `cp deploy/env.prod.example .env && chmod 600 .env` y reemplazar cada `CAMBIAR_*` (o copiar por `scp` el `.env` de producción entregado por otro canal) | §5.2 paso 5 |
| 4 | Instalación inicial, pasos 6 a 8 | §5.2 «Instalación inicial» |
| 5 | Copiar los respaldos a `backups/postgres/` y `backups/minio/` | §3.4 paso 3 |
| 6 | Restaurar: `--verify-only` y luego restauración | §3.4 pasos 5 y 6 |
| 7 | Comparar huellas y conteos con los entregados | §3.5 |
| 8 | Prueba de humo | §5.2 paso 9 |
| 9 | Lista posterior al despliegue | §6.5 |

Tiempo máximo: 90 min [PENDIENTE: confirmar con el instructor]. Desde «levantar la base» hasta
«huellas idénticas» se cronometra aparte para compararlo con el RTO de 4 h.

## Después

1. Quien entrega corrige el plan con cada desviación y publica la versión 1.1 (registro de
   cambios en §10.1).
2. Si el intento se invalidó, se repite sobre la versión corregida.
3. Se actualizan §10.3 del plan y el acta (`acta-de-entrega.md` §5).
