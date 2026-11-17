# Registro del Simulacro Cruzado — RehniMarket

> Plantilla copiada de `bc-implantacion/bootcamp/week-09-aceptacion_y_entrega_formal/3-proyecto/starter/registro-del-simulacro.md`.
> Equipo de 1 persona: instala un tercero (compañero o instructor) y observa otra persona o el
> propio instructor (`.claude/referentes-sena.md`, regla 4). Guion para quien instala:
> `docs/aceptacion/guion-del-simulacro.md`.

<!-- 📝 Instrucción: lo completa el OBSERVADOR durante el simulacro. No se ayuda al equipo que
instala: cada pregunta respondida se registra como desviación. Sin datos personales: equipos
por nombre de proyecto o número. -->

| Campo | Valor |
|---|---|
| Proyecto | RehniMarket |
| Equipo que entrega | Responsable técnico de RehniMarket |
| Equipo que instala | [PENDIENTE] |
| Observador | [PENDIENTE] |
| Versión del plan | 1.0 (`docs/plan-implantacion.md`) |
| Versión del software | 1.0.0 (etiqueta `v1.0.0`) |
| Servidor usado (VM del laboratorio / equipo propio) | [PENDIENTE] |
| Tiempo máximo acordado | 90 min (sugerido por el referente) [PENDIENTE: confirmar con el instructor] |
| Hora de inicio | [PENDIENTE] |
| Hora de fin | [PENDIENTE] |

## Comprobación de servidor limpio

- [ ] Sin contenedores ni volúmenes previos del proyecto
- [ ] Carpeta de instalación nueva
- [ ] Contraseñas recibidas por un canal distinto al del paquete

## Criterios

| # | Criterio | Logrado | Evidencia (salida o captura) |
|---|---|:---:|---|
| 1 | Requisitos verificados con el script (`PORTS="80 443" bash scripts/verificar-requisitos.sh`, plan §5.2 paso 4) | [PENDIENTE] | |
| 2 | Instalación completa, servicios sanos (`docker compose ps`: 5 `healthy`) | [PENDIENTE] | |
| 3 | Datos restaurados, huellas idénticas (`sha256sum -c` + conteos de la §3.5) | [PENDIENTE] | |
| 4 | Prueba de humo en verde con la versión esperada (`scripts/smoke-test.sh`: `7 pasan, 0 fallan`) | [PENDIENTE] | |
| 5 | Dentro del tiempo máximo | [PENDIENTE] | |

## Desviaciones

| Hora | Sección y paso del plan | Tipo (faltante, ambiguo, erróneo, orden, supuesto, mejora) | Qué pasó | ¿Se preguntó? | ¿Invalida? |
|---|---|---|---|:---:|:---:|
| | | | | | |

## Resultado

| Campo | Valor |
|---|---|
| Duración total | |
| Tiempo de restauración (desde "levantar la base" hasta huellas idénticas) | |
| Comparación con el RTO del plan | [PENDIENTE] vs. RTO 4 h (plan §3.2) |
| Resultado | Superado / No superado |
| Motivo (si no se superó) | |

Firma del observador (rol): ____________________
