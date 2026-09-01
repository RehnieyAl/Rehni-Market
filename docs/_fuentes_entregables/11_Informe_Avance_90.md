<!-- Fuente del entregable 11 (Criterio SENA 11). Documento INDEPENDIENTE. Calculo transparente, sin inventar el 90 %. -->

# PORTADA

SERVICIO NACIONAL DE APRENDIZAJE — SENA

PROGRAMA: TECNOLOGO EN ANALISIS Y DESARROLLO DE SOFTWARE (ADSO)

TRIMESTRE: SEXTO

---

## INFORME DE AVANCE DEL PROYECTO

PROYECTO REHNIMARKET — PLATAFORMA DE COMERCIO ELECTRONICO TIPO MARKETPLACE

CRITERIO DE EVALUACION SENA: 11 — EL PROYECTO DEBE DEMOSTRAR UN AVANCE MINIMO DEL 90 %

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

# 1. INTRODUCCION Y REGLA DE CALCULO

Este documento es INDEPENDIENTE de los demas entregables. Su unico objetivo es calcular el avance real del proyecto RehniMarket y compararlo con el umbral del 90 % que exige el criterio 11.

Regla aplicada:

- Los porcentajes se calculan de forma transparente: se muestra el numerador y el denominador o el promedio explicito.
- NO se manipula la metodologia para llegar al 90 %.
- Se distinguen dos cosas distintas:
  - AVANCE FUNCIONAL: cuanto del producto de software esta implementado.
  - AVANCE DEL ENTREGABLE SENA: cuanto de lo que exigen los 11 criterios (implementado + documentado + evidenciado) esta listo.
- Si el proyecto NO alcanza el 90 %, se indica con claridad y se muestra que falta.

Fuente: `docs/CONSOLIDADO_AVANCE_REHNIMARKET.md`, `docs/AUDITORIA_FINAL_REHNIMARKET.md`, `docs/RehniMarket-Requisitos.docx` seccion 7, y la evidencia de la carpeta `evidencias/`.

# 2. AVANCE FUNCIONAL

## 2.1 Requisitos funcionales

[[TABLA]] Estado de los 65 requisitos funcionales.

| Estado | Cantidad | Detalle |
|---|---|---|
| Implementado completo (backend + todos los clientes aplicables) | 62 | RF-001 a RF-064 salvo los de abajo |
| Implementado solo en la web (no en la app movil) | 2 | RF-020 (Favoritos), RF-021 (Carrito); el arbol de trabajo actual anade pantallas en movil, pendientes de validar |
| No implementado | 1 | RF-065 (reembolso automatico al cancelar un pedido individual) |
| Total | 65 | |

Calculo: avance de RF completos = 62 / 65 = 95,4 %. Al menos en la web = 64 / 65 = 98,5 %.

## 2.2 Requisitos no funcionales

[[TABLA]] Estado de los 31 requisitos no funcionales.

| Estado | Cantidad |
|---|---|
| Implementado | 27 |
| Parcial | 2 |
| No implementado | 2 |
| Total | 31 |

Calculo: avance de RNF implementados = 27 / 31 = 87,1 %. Implementados mas parciales = 29 / 31 = 93,5 %.

## 2.3 Avance funcional por componente

[[TABLA]] Avance funcional por componente.

| Componente | Estado | Evidencia |
|---|---|---|
| Backend (API FastAPI) | Completo para el alcance. 24 routers, aprox. 36 tablas ORM, 10 migraciones, aprox. 130 rutas. 113/113 pruebas automatizadas; cobertura 62 %; muestra de aceptacion 28/28 | evidencias/tests/, evidencias/acceptance/, evidencias/deployment/ |
| Frontend web (React 19) | Completo para los 4 roles. tsc -b, eslint y vite build sin errores. Sin pruebas automatizadas | evidencias/tests/frontend-tsc-eslint.txt |
| App movil (Expo) | Alcance minimo garantizado (Home, detalle de producto, autenticacion) + expansion en curso (carrito, checkout, pedidos, billetera, direcciones en el arbol de trabajo). tsc --noEmit y eslint sin errores. Sin empaquetado nativo. Sin pruebas | evidencias/tests/mobile-lint.txt |
| Base de datos | PostgreSQL 17, esquema versionado con Alembic (cabeza a1b2c3d4e5f6), extensiones pg_trgm y unaccent | evidencias/deployment/08_alembic_current.txt |
| Infraestructura (Docker) | docker-compose.yml (dev) con comprobaciones de salud + docker-compose.prod.yml endurecido, construido y probado en aislado. Falta el despliegue real con reverse proxy TLS | evidencias/deployment/ |
| Documentacion | Despliegue, Manual Tecnico, Manual de Usuario, Plan de Migracion, Plan de Pruebas, Informe de Calidad, Bitacora PSP, Requisitos, Historias de Usuario, Consolidado, Auditoria Final | docs/ |
| Pruebas | Backend 113/113. Frontend y movil: solo verificacion estatica. Aceptacion con usuario: pendiente | evidencias/ |
| Despliegue | Local reproducible y evidenciado. Produccion real: no realizada | evidencias/deployment/ |

## 2.4 Calculo del avance funcional global

[[TABLA]] Calculo ponderado del avance funcional global.

| Dimension | Peso | Avance | Aportado |
|---|---|---|---|
| Requisitos funcionales (backend + web) | 45 % | 98,5 % | 44,3 % |
| Requisitos no funcionales | 15 % | 90,3 % (media de implementados y parciales) | 13,5 % |
| Frontend web | 15 % | 90 % (compila y funciona; sin pruebas) | 13,5 % |
| App movil | 10 % | 45 % (alcance minimo + expansion sin validar ni empaquetar) | 4,5 % |
| Infraestructura | 10 % | 80 % (dev + prod compose probado; falta el despliegue real con TLS) | 8,0 % |
| Pruebas automatizadas | 5 % | 60 % (backend si, clientes no) | 3,0 % |
| AVANCE FUNCIONAL GLOBAL | 100 % | | aprox. 86,8 % |

Lectura: si se pondera solo backend mas web (el alcance principal comprometido), el avance funcional SUPERA el 95 %. Contando la app movil (con menor alcance) y la ausencia del despliegue real y de pruebas de cliente, el avance funcional global se situa en aproximadamente 86 %.

# 3. AVANCE DEL ENTREGABLE SENA (11 CRITERIOS)

Para cada criterio: I = implementado, D = documentado, E = evidenciado. Estado: COMPLETO (o casi), PARCIAL, PENDIENTE.

[[TABLA]] Matriz de avance de los 11 criterios de evaluacion.

| Criterio | Descripcion | Estado | Porcentaje | Evidencia | Observacion |
|---|---|---|---|---|---|
| 1 | Preparacion de plataforma e infraestructura | COMPLETO | 90 % | evidencias/deployment/01..10, evidencias/hardware/entorno_medido.txt | I+D+E completos. Falta el dimensionamiento oficial de produccion (necesita campana de carga; documentado como "sin especificacion oficial") |
| 2 | Plan de migracion y respaldos | COMPLETO | 90 % | evidencias/backup/ (backup, checksums, contenido_dump, restore, manifest) | Backup y restauracion ejecutados y validados. Falta la automatizacion (cron/systemd) y la copia externa cifrada |
| 3 | Despliegue y publicacion | PARCIAL | 82 % | evidencias/deployment/ (stack dev healthy; 10_prod_compose_smoke.txt: stack de produccion probado en aislado) | Local + compose de produccion probado. FALTA: la publicacion real en un servidor con dominio y reverse proxy TLS; capturas de navegador |
| 4 | Gestion de usuarios y permisos | COMPLETO | 90 % | evidencias/acceptance/resultados.txt (401/403 por rol), evidencias/security/roles/ | 5 roles, middleware con revalidacion en cada peticion, JWT access+refresh, verificacion de correo. Falta el ambiente de produccion y un usuario de MinIO de minimo privilegio |
| 5 | Documentacion tecnica y manuales | COMPLETO | 95 % | los documentos mismos + evidencias/deployment/03 (Swagger) | Manual tecnico, de instalacion y de usuario. README y CHANGELOG del backend corregidos. Falta un diagrama ER grafico (el textual existe) |
| 6 | Pruebas de aceptacion y entrega formal | PARCIAL | 55 % | evidencias/acceptance/resultados.txt (28/28), evidencias/tests/pytest.txt (113/113) | Plan y matriz elaborados; muestra tecnica ejecutada. FALTA (requiere una persona): ejecutar la matriz con un usuario final, capturas de navegador, capacitacion, firmar el acta |
| 7 | Marcos de calidad y PSP | COMPLETO | 90 % | evidencias/security/pip-audit.txt, evidencias/tests/ | Informe ISO/IEC 25010 + bitacora PSP (retrospectiva, con aviso de honestidad). Falta llevar el registro de tiempo PSP en vivo en el proximo proyecto |
| 8 | Requisitos no funcionales | PARCIAL | 78 % | evidencias/performance/resultado.txt (rendimiento basico), evidencias/tests/, evidencias/security/ | 31 RNF evaluados; rendimiento basico medido. FALTA: ejecutar la plantilla k6 y acordar SLO; auditoria de accesibilidad (WCAG/axe) no realizada |
| 9 | Registro e informe de evaluacion de calidad | COMPLETO | 95 % | INFORME_CALIDAD seccion 11 (hallazgos) + evidencias/tests/pytest.txt | Registro de 13 hallazgos positivos y 18 negativos con estado explicito; salida de pytest completo adjunta |
| 10 | Plan de mejora continua | COMPLETO | 95 % | INFORME_CALIDAD seccion 13 (27 acciones, aprox. 10 cerradas en esta entrega) | Cada accion trazada a un hallazgo, con prioridad, horizonte y estado. Falta ejecutar el resto de acciones (pendientes con horizonte asignado) |
| 11 | Avance minimo del 90 % | PARCIAL | 80 % | este documento; docs/CONSOLIDADO_AVANCE_REHNIMARKET.md | Calculo transparente. El 90 % del entregable se alcanza cuando se cierre el criterio 6 |

# 4. CALCULO DEL PORCENTAJE GLOBAL DEL ENTREGABLE

Metodo: promedio simple de los porcentajes de los 11 criterios (cada criterio pesa igual).

Suma de porcentajes: 90 + 90 + 82 + 90 + 95 + 55 + 90 + 78 + 95 + 95 + 80 = 940.

Promedio: 940 / 11 = 85,45 %.

[[TABLA]] Resultado del calculo del avance del entregable.

| Metrica | Valor |
|---|---|
| Suma de los 11 porcentajes | 940 |
| Numero de criterios | 11 |
| Promedio (avance del entregable SENA) | aprox. 85 % |
| Criterios COMPLETOS o casi (7): 1, 2, 4, 5, 7, 9, 10 | 7 / 11 |
| Criterios PARCIALES (4): 3, 6, 8, 11 | 4 / 11 |
| Criterios PENDIENTES puros | 0 / 11 |

# 5. RESULTADO FRENTE AL UMBRAL DEL 90 %

[[TABLA]] Comparacion con el umbral del criterio 11.

| Indicador | Valor | Alcanza el 90 %? |
|---|---|---|
| Avance funcional del alcance principal (backend + web) | mayor que 95 % | SI |
| Avance funcional global (incluye app movil e infraestructura) | aprox. 86 % | NO |
| Avance del entregable SENA (promedio de los 11 criterios) | aprox. 85 % | NO |

Conclusion honesta del calculo: el proyecto SUPERA el 90 % en avance funcional del alcance principal (backend + web). El avance del entregable SENA global es de aproximadamente 85 % y NO alcanza el umbral del 90 %. No se ajusta la metodologia para aparentar el 90 %.

# 6. QUE FALTA PARA LLEGAR AL 90 % DEL ENTREGABLE

[[TABLA]] Acciones que faltan para alcanzar el 90 % del entregable.

| Accion | Criterio | Automatizable? |
|---|---|---|
| Ejecutar las pruebas de aceptacion con un usuario final y registrar los resultados en el plan de pruebas | 6 | NO — requiere una persona |
| Realizar las sesiones de capacitacion (lista de asistencia + grabacion) | 6 | NO — requiere una persona |
| Diligenciar y firmar el acta de entrega | 6 | NO — requiere firmas |
| Tomar las capturas de navegador del frontend y de la app movil | 6, 3 | NO — requiere operar la interfaz |
| Desplegar en un servidor real con dominio y reverse proxy TLS | 3 | Parcial — la plantilla ya esta probada; la publicacion real requiere servidor y dominio |
| Ejecutar la campana de carga con k6 y acordar los SLO | 8 | SI — la plantilla scripts/load_test.k6.js esta lista; falta instalar k6 y ejecutarla |
| Realizar una auditoria de accesibilidad (WCAG / axe / Lighthouse) | 8 | SI — con herramienta automatica |

El elemento que mas pesa es el criterio 6 (55 %): al pasarlo a COMPLETO (pruebas con usuario final + capacitacion + acta firmada), el promedio de los 11 criterios supera el 90 %.

Simulacion (no un dato real, solo para mostrar el efecto): si el criterio 6 pasara de 55 % a 90 %, la suma seria 940 + 35 = 975 y el promedio 975 / 11 = 88,6 %. Si ademas el criterio 3 pasara a 90 % (despliegue real) y el 8 a 90 % (k6 + accesibilidad), la suma seria 975 + 8 + 12 = 995 y el promedio 995 / 11 = 90,5 %. Estos son escenarios; a la fecha ninguno se ha cumplido.

# 7. RESUMEN DE METRICAS OBJETIVAS

[[TABLA]] Metricas objetivas del proyecto (medicion real).

| Metrica | Valor | Evidencia |
|---|---|---|
| Requisitos funcionales completos | 62 / 65 (95,4 %) | RehniMarket-Requisitos.docx seccion 7 |
| Requisitos no funcionales implementados | 27 / 31 (87,1 %) | RehniMarket-Requisitos.docx seccion 7 |
| Pruebas automatizadas del backend | 113 / 113 aprobadas | evidencias/tests/pytest.txt |
| Cobertura de sentencias del backend | 62 % | evidencias/tests/pytest-cov.txt |
| Muestra de aceptacion contra la API | 28 / 28 aprobadas | evidencias/acceptance/resultados.txt |
| Vulnerabilidades de dependencias del backend | 8 -> 1 (la restante no explotable) | evidencias/security/pip-audit.txt |
| Prueba de rendimiento | 900 solicitudes, 0 errores | evidencias/performance/resultado.txt |
| Prueba de carga con k6 | plantilla lista, NO ejecutada | scripts/load_test.k6.js |
| Backup y restauracion | ejecutados y validados (37 tablas, conteos = origen, 166 objetos) | evidencias/backup/ |
| Stack de produccion | construido y probado en aislado; NO desplegado a un servidor real | evidencias/deployment/10_prod_compose_smoke.txt |
| Verificacion estatica de los clientes | 0 errores | evidencias/tests/frontend-tsc-eslint.txt, mobile-lint.txt |

# 8. EVIDENCIAS

[[TABLA]] Evidencias del criterio 11.

| Evidencia | Tipo | Ubicacion | Que demuestra | Estado |
|---|---|---|---|---|
| CONSOLIDADO_AVANCE_REHNIMARKET.md | Documento | docs/ | Calculo transparente del avance funcional y del entregable | EJECUTADO |
| AUDITORIA_FINAL_REHNIMARKET.md | Documento | docs/ | Matriz de los 11 criterios con estado, evidencia y pendiente | EJECUTADO |
| RehniMarket-Requisitos.docx seccion 7 | Documento | docs/ | Conteo de RF y RNF por estado | EJECUTADO |
| evidencias/ (todas las subcarpetas) | Salidas de comando | evidencias/ | Respaldo objetivo de los porcentajes de cada criterio | EJECUTADO |
| Tablero de tareas con el porcentaje de avance | Herramienta de gestion | docs/evidencias/11_avance/ | Estado de las tareas del proyecto | OPCIONAL — este documento y el consolidado lo sustituyen en gran parte |

# 9. CONCLUSION

El avance funcional del alcance principal de RehniMarket (backend y frontend web) SUPERA el 90 %: 62 de 65 requisitos funcionales estan completamente implementados y la suite de pruebas del backend pasa 113 de 113. El avance del entregable SENA, calculado como el promedio simple de los 11 criterios (940 / 11), es de aproximadamente 85 % y NO alcanza el umbral del 90 %. Lo que lo separa del 90 % son, sobre todo, actividades del criterio 6 que requieren la participacion de personas: las pruebas de aceptacion con un usuario final, la capacitacion y la firma del acta. El calculo se presenta de forma transparente y no se manipula la metodologia para aparentar el cumplimiento del umbral.
