<!--
FUENTE MAESTRA EDITABLE del documento académico final de RehniMarket.
El archivo prioritario para entrega es REHNIMARKET_DOCUMENTO_FINAL.docx (generado desde este .md).
Regla aplicada en todo el documento: solo información sustentada en el repositorio real, el código,
la documentación existente y los resultados de pruebas realmente ejecutados. Lo no ejecutado o no
disponible se marca PENDIENTE / NO EJECUTADO / TRABAJO FUTURO / REQUIERE VALIDACIÓN HUMANA.
Formato objetivo: académico, blanco y negro, sin colores ni elementos decorativos.
-->

# PORTADA

SERVICIO NACIONAL DE APRENDIZAJE — SENA

PROGRAMA: TECNÓLOGO EN ANÁLISIS Y DESARROLLO DE SOFTWARE (ADSO)

TRIMESTRE: SEXTO

---

REHNIMARKET

PLATAFORMA DE COMERCIO ELECTRÓNICO TIPO MARKETPLACE

DOCUMENTO FINAL DEL PROYECTO

---

Autor: RehnieyAL (Yeinher Algarin) — desarrollador único del proyecto

Instructor: _______________________________ (dato no disponible en la documentación; pendiente de completar)

Ficha / grupo: _______________________________ (dato no disponible; pendiente de completar)

Ciudad: _______________________________ (dato no disponible; pendiente de completar)

Año: 2026

Repositorio: https://github.com/RehnieyAl/Rehni-Market.git

Rama analizada: feature/owner — último commit publicado: 917a647 ("ver 2.4"), con trabajo adicional en el árbol de trabajo.

Fecha de consolidación de este documento: 2026-08-31.

<!-- PAGEBREAK -->

# TABLA DE CONTENIDO

<!-- TOC -->

<!-- PAGEBREAK -->

# LISTA DE FIGURAS

Figura 1. Esquema de comunicación entre componentes (representación textual). Fuente: elaboración propia a partir del código y de `docker-compose.yml`.

Figura 2. Modelo entidad–relación (representación textual). Fuente: elaboración propia a partir de `RehniMarket-backend/app/models/`.

Nota: el repositorio no contiene diagramas gráficos (UML, ER en imagen, arquitectura en imagen). Las figuras de este documento son representaciones textuales verificables contra el código. La elaboración de diagramas gráficos formales queda como TRABAJO FUTURO.

<!-- PAGEBREAK -->

# LISTA DE TABLAS

Tabla 1. Stack tecnológico y versiones reales.
Tabla 2. Actores del sistema.
Tabla 3. Estado de los requisitos funcionales.
Tabla 4. Estado de los requisitos no funcionales.
Tabla 5. Lista blanca de rutas por rol.
Tabla 6. Máquina de estados del pedido.
Tabla 7. Servicios de la orquestación Docker (desarrollo).
Tabla 8. Diferencias entre el Compose de desarrollo y el de producción.
Tabla 9. Prueba de restauración: resultado por comprobación.
Tabla 10. Prueba de rendimiento: latencia por endpoint.
Tabla 11. Resultados de las pruebas ejecutadas.
Tabla 12. Evaluación según ISO/IEC 25010.
Tabla 13. Estado final de la calidad del software.
Tabla 14. Esfuerzo estimado por fase (estimación retrospectiva).
Tabla 15. Registro de defectos (resumen).
Tabla 16. Estado del avance del proyecto.
Tabla 17. Consolidado de los criterios de entrega SENA.
Tabla 18. Historias de usuario (HU-001 a HU-029).
Tabla 19. Requisitos funcionales (RF-001 a RF-065).
Tabla 20. Requisitos no funcionales (RNF-001 a RNF-031).
Tabla 21. Hallazgos negativos de la auditoría de calidad.
Tabla 22. Evidencias reproducibles del repositorio.
Tabla 23. Endpoints principales por router.

Nota: en el archivo .docx la lista de tablas y la lista de figuras se generan automáticamente a partir de las tablas y figuras efectivamente insertadas, en el orden en que aparecen.

<!-- PAGEBREAK -->

# RESUMEN

RehniMarket es una plataforma de comercio electrónico de tipo marketplace desarrollada como proyecto formativo del programa Tecnólogo en Análisis y Desarrollo de Software del SENA. El sistema permite que empresas vendedoras publiquen productos con variantes, descuentos e imágenes, y que compradores registrados armen un carrito y paguen con un saldo interno denominado RehniCoin (equivalencia 1 RehniCoin = 1 peso colombiano). Incluye un panel de administración para gobernar la plataforma (aprobación de empresas, catálogo global, anuncios, reportes, transportadoras, liquidaciones y recargas de saldo).

El sistema se compone de tres aplicaciones: un backend de API REST construido con FastAPI (Python 3.13) que concentra toda la lógica de negocio y la autoridad sobre precios, stock, saldos, estados de pedido y permisos; un frontend web de tipo Single Page Application (React 19 + Vite) que cubre los cuatro roles; y una aplicación móvil (Expo / React Native) orientada al comprador. La persistencia relacional usa PostgreSQL 17 con migraciones versionadas mediante Alembic, y el almacenamiento de imágenes y documentos usa MinIO. Toda la plataforma de servidor está contenerizada con Docker Compose.

A la fecha de consolidación de este documento, el proyecto presenta 62 de 65 requisitos funcionales implementados de forma completa (backend y todos los clientes aplicables), 2 implementados solo en la web y 1 no implementado. La suite de pruebas automatizadas del backend contiene 113 funciones de prueba, con resultado 113/113 aprobadas en tres ejecuciones completas y una cobertura de sentencias del 62 % sobre el paquete de aplicación. Se ejecutó una muestra técnica de 28 comprobaciones de aceptación contra la API real (28/28 aprobadas) y una prueba de rendimiento básica de 900 solicitudes (0 errores). Se implementó y validó un mecanismo de respaldo y restauración de PostgreSQL y MinIO. La auditoría de dependencias del backend redujo las vulnerabilidades conocidas de 8 a 1 (la restante no explotable con la configuración actual del proyecto). Se elaboró y probó una configuración de despliegue de producción endurecida.

El avance funcional del alcance principal (backend y web) supera el 95 %. El avance global del entregable frente a los once criterios de evaluación del SENA se estima en aproximadamente 85 %. Lo que impide alcanzar el 90 % del entregable son actividades que requieren intervención humana: la ejecución de las pruebas de aceptación con un usuario final, la capacitación y la firma del acta de entrega (criterio 6), el despliegue real en un servidor con TLS (criterio 3) y la campaña de carga con la herramienta k6 más la auditoría de accesibilidad (criterio 8).

Palabras clave: comercio electrónico, marketplace, API REST, FastAPI, PostgreSQL, Docker, JWT, ISO/IEC 25010, PSP, pruebas de software.

# ABSTRACT

RehniMarket is a marketplace-type e-commerce platform developed as a training project for the SENA Software Analysis and Development technologist program. The system lets seller companies publish products with variants, discounts and images, and lets registered buyers build a cart and pay with an internal balance called RehniCoin (1 RehniCoin = 1 Colombian peso). It includes an administration panel to govern the platform (company approval, global catalog, advertisements, reports, carriers, payouts and balance top-ups).

The system consists of three applications: a REST API backend built with FastAPI (Python 3.13) that holds all business logic and the authority over prices, stock, balances, order states and permissions; a Single Page Application web frontend (React 19 + Vite) covering the four roles; and a mobile application (Expo / React Native) aimed at the buyer. Relational persistence uses PostgreSQL 17 with schema migrations managed by Alembic, and image and document storage uses MinIO. The whole server platform is containerized with Docker Compose.

As of the consolidation date of this document, the project has 62 of 65 functional requirements fully implemented, 2 implemented on the web only and 1 not implemented. The backend automated test suite contains 113 test functions, with a 113/113 pass result over three full runs and 62 % statement coverage of the application package. A technical sample of 28 acceptance checks was run against the real API (28/28 passed) and a basic 900-request performance test (0 errors). A PostgreSQL and MinIO backup and restore mechanism was implemented and validated. The backend dependency audit reduced known vulnerabilities from 8 to 1 (the remaining one not exploitable under the project's current configuration). A hardened production deployment configuration was built and tested.

Functional progress of the main scope (backend and web) exceeds 95 %. Overall delivery progress against the eleven SENA evaluation criteria is estimated at approximately 85 %. What prevents reaching 90 % of the deliverable are activities that require human intervention: running acceptance tests with an end user, training, and signing the delivery record (criterion 6), the real deployment on a server with TLS (criterion 3), and the load campaign with the k6 tool plus the accessibility audit (criterion 8).

Keywords: e-commerce, marketplace, REST API, FastAPI, PostgreSQL, Docker, JWT, ISO/IEC 25010, PSP, software testing.

<!-- PAGEBREAK -->

# NOTA SOBRE LA CONFIGURACIÓN DOCKER

Este documento se elaboró cuando la configuración endurecida se distribuía como `docker-compose.prod.yml`, `RehniMarket-frontend/Dockerfile.prod`, `RehniMarket-backend/.env.prod` y `.env.prod.example`, junto a un `docker-compose.yml` de desarrollo. Posteriormente se normalizaron los nombres. Donde este documento use los nombres antiguos, léanse los normalizados: `docker-compose.prod.yml` es ahora `docker-compose.yml` (configuración por defecto); el compose de desarrollo pasa a `docker-compose.dev.yml`; `Dockerfile.prod` es `RehniMarket-frontend/Dockerfile` y el de desarrollo es `Dockerfile.dev`; `.env.prod` es `RehniMarket-backend/.env` y el de desarrollo es `.env.dev`; `.env.prod.example` es `.env.public.example`; las imágenes `rehni-market-backend:prod` / `rehni-market-frontend:prod` son `rehni-market-backend` / `rehni-market-frontend`; los contenedores `rehni-backend-prod` / `rehni-frontend-prod` son `rehni-backend` / `rehni-frontend`; el volumen `minio_prod_data` es `minio_data`. Se levanta con `docker compose up -d` sin `-f`. La evidencia `evidencias/deployment/10_prod_compose_smoke.txt` conserva el nombre antiguo por ser un registro histórico de esa prueba.

<!-- PAGEBREAK -->

# 1. INTRODUCCIÓN

El comercio electrónico ha modificado la forma en que las pequeñas y medianas empresas ofrecen sus productos, al permitir que un vendedor sin infraestructura propia alcance a compradores mediante una plataforma compartida. Un modelo habitual para lograrlo es el marketplace: un intermediario tecnológico que agrupa la oferta de múltiples vendedores, ordena el catálogo, gestiona los pedidos y aplica reglas comunes de negocio como impuestos y comisiones.

Este documento consolida el trabajo realizado sobre RehniMarket, una plataforma de comercio electrónico tipo marketplace construida como proyecto formativo. El objetivo del documento es reunir en un único texto académico la información que hasta ahora se encontraba distribuida en varios archivos de documentación técnica del repositorio: el manual técnico, el informe de aseguramiento y calidad, la bitácora de proceso personal (PSP), el consolidado de avance, la auditoría final, el plan de migración y respaldos, el plan de pruebas de aceptación, la documentación de despliegue, las historias de usuario y el documento de requisitos.

El texto está organizado de forma académica: parte del planteamiento del problema y los objetivos, describe el marco teórico y metodológico que sustenta el trabajo, presenta el análisis y el diseño del sistema, detalla la implementación por módulos, y cierra con la evaluación de seguridad, despliegue, respaldo, pruebas y calidad. La parte final consolida el estado real del proyecto frente a los once criterios de evaluación, identifica de forma explícita lo que queda pendiente, y separa lo que se puede resolver de forma automatizada de lo que necesariamente requiere la participación de una persona.

Todo el contenido está sustentado en el repositorio real, el código fuente y los resultados de pruebas efectivamente ejecutadas. Cuando una actividad no se realizó o un dato no está disponible, el documento lo indica de forma expresa en lugar de completarlo con información inventada.

<!-- PAGEBREAK -->

# 2. PLANTEAMIENTO DEL PROBLEMA

## 2.1 Descripción del problema

Una empresa pequeña que quiere vender por internet enfrenta varias barreras: no cuenta con una tienda en línea propia, no tiene un sistema para administrar su catálogo con variantes de producto ni para llevar el control de stock, y no dispone de un flujo confiable para recibir pedidos y coordinar su envío. Del lado del comprador, la dificultad es encontrar productos de distintos vendedores en un solo lugar, comparar precios con descuento y realizar una compra con una experiencia consistente en distintos dispositivos.

Adicionalmente, quien administra una plataforma que agrupa a varios vendedores necesita herramientas para verificar la legitimidad de cada empresa, controlar el catálogo global, moderar reportes de contenido y liquidar los pagos correspondientes a cada vendedor descontando la comisión de la plataforma.

## 2.2 Formulación del problema

¿Cómo construir una plataforma de comercio electrónico tipo marketplace que permita a empresas vendedoras publicar y administrar su catálogo con variantes, a compradores realizar pedidos con una experiencia consistente en web y móvil, y a una administración central gobernar la operación (aprobación de empresas, catálogo, reportes y liquidaciones), garantizando que las operaciones sobre stock y saldo sean correctas y consistentes ante concurrencia?

## 2.3 Antecedentes

El proyecto tuvo una etapa inicial bajo el nombre interno "Lubix" (versiones 1.1.x, entre junio y agosto de 2026), en la que se implementaron la autenticación con JWT, los primeros modelos ORM, la integración con MinIO y la contenerización con Docker. En agosto de 2026 el proyecto se renombró a RehniMarket y se realizó una reestructuración mayor hacia una arquitectura por capas (versión "2.0"), seguida de la incorporación del carrito, el checkout, los pedidos, la billetera RehniCoin, las reseñas, los reportes, las liquidaciones y el módulo de transportadoras (versiones "2.1" a "2.4"). En la versión "2.3" se añadió la suite de pruebas automatizadas del backend.

El nombre "Lubix" solo se conserva en este documento como referencia histórica; el nombre vigente del proyecto es RehniMarket.

## 2.4 Justificación

Un marketplace resuelve simultáneamente el problema de tres actores: da a la empresa vendedora una vitrina y herramientas de gestión que no tendría por sí sola, da al comprador un catálogo unificado con validación real de stock y precio, y da a la administración el control necesario para operar la plataforma. El proyecto también permite aplicar de forma integrada conceptos del programa formativo: análisis de requisitos, diseño de arquitectura y de bases de datos, desarrollo de una API REST, seguridad de aplicaciones, contenerización, pruebas de software y evaluación de calidad bajo un marco normativo (ISO/IEC 25010) y una disciplina de proceso personal (PSP).

<!-- PAGEBREAK -->

# 3. OBJETIVOS

## 3.1 Objetivo general

Desarrollar una plataforma de comercio electrónico tipo marketplace, denominada RehniMarket, compuesta por un backend de API REST, un frontend web y una aplicación móvil, que permita la publicación y gestión de productos con variantes por parte de empresas vendedoras, la compra por parte de usuarios registrados mediante un saldo interno, y la administración de la plataforma, garantizando la corrección de las operaciones sobre stock y saldo.

## 3.2 Objetivos específicos

1. Analizar y documentar los requisitos funcionales y no funcionales del sistema a partir del comportamiento verificable del código.
2. Diseñar una arquitectura por capas para el backend, un modelo de datos relacional y un esquema de autenticación y autorización por roles.
3. Implementar el backend de API REST con FastAPI, incluyendo autenticación con JWT y refresh tokens, gestión de usuarios, empresas, productos, variantes, carrito, checkout, pedidos y billetera RehniCoin.
4. Implementar el frontend web para los cuatro roles y la aplicación móvil para el rol comprador.
5. Contenerizar la plataforma de servidor con Docker Compose y versionar el esquema de base de datos con Alembic.
6. Definir e implementar un plan de migración de datos y de copias de seguridad de PostgreSQL y MinIO, con verificación de integridad y prueba de restauración.
7. Diseñar y ejecutar pruebas automatizadas del backend y una muestra de pruebas de aceptación, y preparar el plan de pruebas de aceptación con usuario final.
8. Evaluar la calidad del producto aplicando ISO/IEC 25010 como marco de referencia y registrar los hallazgos, las lecciones aprendidas y un plan de mejora continua.
9. Aplicar prácticas de proceso personal (PSP) para el trabajo individual, con registro de defectos y análisis de estimación frente a lo real.

<!-- PAGEBREAK -->

# 4. ALCANCE

## 4.1 Alcance funcional

El sistema cubre, a nivel de backend y frontend web, las siguientes capacidades verificadas en el código:

- Catálogo público con búsqueda difusa (tolerante a tildes y a errores de escritura), filtros por categoría, precio, descuento y disponibilidad, ordenamiento, y secciones de "Ofertas" y "Novedades".
- Registro de comprador y de empresa, verificación de correo por código, inicio de sesión, recuperación y cambio de contraseña, y renovación de sesión mediante refresh token.
- Carrito de compras con validación de stock por producto o por variante, y checkout con pago en RehniCoin, cálculo de subtotal, IVA del 19 % (aplicado por producto) y total.
- Pedidos con máquina de estados, cancelación por el comprador cuando corresponde, y seguimiento por transportadora con enlace externo de rastreo.
- Favoritos, reseñas condicionadas a compra entregada, reportes de producto o empresa, y direcciones de envío.
- Billetera RehniCoin: consulta de saldo y movimientos, solicitud de recarga por WhatsApp y acreditación manual por un administrador.
- Panel de empresa (solo web): perfil, productos y variantes con descuentos, pedidos recibidos, cuentas bancarias, balance y liquidaciones.
- Panel de administración y Owner (solo web): estadísticas, empresas (aprobación y suspensión con reembolso), usuarios, catálogo global, anuncios, reportes, transportadoras, liquidaciones y recargas de RehniCoin.

La aplicación móvil está orientada a los roles Visitante y comprador. El alcance móvil mínimo garantizado es el Home, el detalle de producto y el flujo de autenticación; el resto de pantallas de comprador (carrito, checkout, pedidos, billetera y direcciones) se encuentra en el árbol de trabajo y su validación completa queda PENDIENTE.

## 4.2 Alcance técnico

- Backend de API REST con FastAPI (Python 3.13), SQLAlchemy 2.0 como ORM, Alembic para migraciones, PostgreSQL 17 como base de datos, MinIO como almacenamiento de objetos y SMTP de Gmail para correo transaccional.
- Frontend web con React 19, Vite 8, TypeScript y TailwindCSS.
- Aplicación móvil con Expo SDK 54, Expo Router y React Native.
- Contenerización con Docker y orquestación con Docker Compose (una configuración de desarrollo y una de producción).
- Documentación técnica, plan de migración y respaldos, informe de calidad bajo ISO/IEC 25010, bitácora PSP y plan de pruebas de aceptación.

El detalle de componentes y versiones se presenta en la Tabla 1.

TABLE:stack

## 4.3 Limitaciones

- RehniMarket no realiza pagos con dinero real: el único medio de pago es el saldo interno RehniCoin, acreditado manualmente por un administrador.
- El proyecto no se ha desplegado en un servidor de producción con dominio ni certificado TLS. Lo entregado es una demostración local reproducible y una plantilla de producción probada en un entorno aislado.
- La aplicación móvil no tiene empaquetado nativo configurado (no hay `eas.json` ni carpetas `android/` o `ios/`); su uso soportado es mediante Expo Go.
- No hay pruebas automatizadas en el frontend web ni en la aplicación móvil (solo verificación estática de tipos y de estilo).
- No existe integración continua (CI).
- No se ha ejecutado una campaña de pruebas de carga con herramientas especializadas ni una auditoría formal de accesibilidad (ambas quedan como TRABAJO FUTURO, con plantilla y procedimiento preparados).
- Las pruebas de aceptación con un usuario final, la capacitación y la firma del acta de entrega están PENDIENTES por requerir la participación de personas.
- El requisito RF-065 (reembolso automático al cancelar un pedido individual) NO está implementado.

<!-- PAGEBREAK -->

# 5. MARCO TEÓRICO

## 5.1 Comercio electrónico

El comercio electrónico es el intercambio de bienes o servicios mediante sistemas de información conectados a redes. Un marketplace es una modalidad en la que un tercero opera la plataforma que agrupa la oferta de varios vendedores, y normalmente cobra una comisión sobre las ventas. En RehniMarket la comisión de la plataforma es del 5 % sobre las ventas válidas.

## 5.2 Sistemas web y aplicaciones de página única

Una aplicación de página única (Single Page Application, SPA) carga una sola vez el documento HTML y actualiza la interfaz en el cliente, comunicándose con el servidor mediante llamadas asíncronas a una API. El frontend web de RehniMarket es una SPA construida con React que consume la misma API que la aplicación móvil.

## 5.3 Arquitectura de software por capas

La arquitectura por capas separa responsabilidades en niveles con dependencias unidireccionales. En el backend de RehniMarket las capas son: enrutado (define endpoints y valida la entrada), servicios (lógica de negocio), repositorio (acceso a datos), y modelos (entidades ORM). Esta separación facilita la prueba y el mantenimiento.

## 5.4 APIs REST

REST (Representational State Transfer) es un estilo de arquitectura para servicios web que usa los métodos y códigos de estado de HTTP y representa los recursos, habitualmente, en formato JSON. La API de RehniMarket expone alrededor de 130 rutas y un contrato de error uniforme con la forma `{ detail: { code, message } }`.

## 5.5 Bases de datos relacionales

Un sistema de gestión de bases de datos relacional organiza la información en tablas relacionadas mediante claves. RehniMarket usa este modelo para representar usuarios, empresas, productos, variantes, pedidos, billeteras y el resto del dominio, con integridad referencial declarada mediante claves foráneas.

## 5.6 PostgreSQL

PostgreSQL es un sistema de gestión de bases de datos relacional de código abierto. RehniMarket usa PostgreSQL 17 y aprovecha extensiones propias del motor: `pg_trgm` y `unaccent` para la búsqueda difusa de productos, junto con una función inmutable y un índice GIN.

## 5.7 Mapeo objeto-relacional (ORM)

Un ORM traduce entre las tablas de la base de datos y los objetos del lenguaje de programación. RehniMarket usa SQLAlchemy 2.0 con la sintaxis declarativa `Mapped[...]`, lo que permite trabajar con entidades tipadas y consultas encapsuladas en la capa de repositorio.

## 5.8 Autenticación con JSON Web Tokens (JWT)

Un JWT es una cadena firmada que transporta afirmaciones sobre una identidad. RehniMarket emite dos tokens: un token de acceso de vida corta y un token de refresco de vida más larga, ambos firmados con el algoritmo HS256 y una clave simétrica. El token de refresco se persiste en base de datos para poder invalidarlo.

## 5.9 Control de acceso basado en roles (RBAC)

El control de acceso basado en roles asigna permisos a roles y roles a usuarios. RehniMarket define cinco roles: Visitante (sin sesión), usuario (comprador), empresa (vendedor), administrador y owner (propietario). La autorización se aplica en un middleware con una lista blanca de prefijos de ruta por rol.

## 5.10 Docker y contenerización

Un contenedor empaqueta una aplicación con sus dependencias en una unidad aislada y reproducible. Docker Compose orquesta varios contenedores como un sistema. RehniMarket define cuatro servicios: base de datos, almacenamiento de objetos, backend y frontend.

## 5.11 Almacenamiento de objetos con MinIO

MinIO es un servidor de almacenamiento de objetos compatible con la API S3. RehniMarket lo usa para guardar imágenes de productos, logos, banners, anuncios, certificados y evidencias de reportes. La base de datos guarda la ruta del objeto y el backend sirve el binario mediante un proxy propio.

## 5.12 Migraciones de bases de datos

Una migración es un cambio versionado del esquema de la base de datos. RehniMarket usa Alembic; el esquema evoluciona en una cadena lineal de 10 revisiones que se aplican automáticamente al arrancar el contenedor del backend.

## 5.13 Pruebas de software

Las pruebas verifican que el software cumple lo esperado. Este proyecto usa pruebas de servicio e integración ligera en el backend (con una base de datos PostgreSQL real), verificación estática de tipos y de estilo en el frontend y en la aplicación móvil, y una muestra de pruebas de aceptación ejecutada contra la API real.

## 5.14 Calidad de software

La calidad de software se refiere al grado en que el producto satisface necesidades declaradas e implícitas. Se evalúa mediante modelos de calidad, medición y registro de hallazgos.

## 5.15 ISO/IEC 25010

La norma ISO/IEC 25010 define un modelo de calidad de producto de software con ocho características: adecuación funcional, eficiencia de desempeño, compatibilidad, usabilidad, fiabilidad, seguridad, mantenibilidad y portabilidad. La familia ISO/IEC 25000 (SQuaRE) agrupa el modelo de calidad, la medición y la evaluación. En este proyecto ambos marcos se usan como referencia conceptual; el producto no está certificado en ninguna norma.

## 5.16 Proceso Personal de Software (PSP)

El PSP es una disciplina para el trabajo individual que promueve la planificación, la estimación de tamaño y tiempo, el seguimiento del esfuerzo y el registro de defectos por fase, con el objetivo de mejorar el proceso a partir de datos propios. En este proyecto el PSP se adopta de forma retrospectiva, con las salvedades que se detallan en la sección 15.

<!-- PAGEBREAK -->

# 6. MARCO METODOLÓGICO

## 6.1 Metodología utilizada

El desarrollo se realizó de forma individual y evolutiva: incrementos sucesivos identificables en el historial de control de versiones, cada uno agregando un conjunto de funcionalidades. La documentación de requisitos y de historias de usuario se elaboró mediante auditoría directa del código, tomando el comportamiento real como fuente de verdad.

## 6.2 Proceso de desarrollo

El proceso siguió las fases clásicas de planificación, análisis, diseño, implementación y pruebas, con una fase final de post-mortem que produjo el informe de calidad, la bitácora PSP y este documento. La gestión de configuración se apoyó en Git y en el bloqueo reproducible de dependencias (`uv.lock`, `pnpm-lock.yaml`).

## 6.3 Planificación

El alcance se planificó inicialmente como un backlog de historias de usuario y se consolidó en 29 historias de usuario y 65 requisitos funcionales. La estimación inicial de duración fue de aproximadamente seis semanas; la duración real fue de aproximadamente trece semanas (junio a agosto de 2026), con pausas.

## 6.4 Análisis

El análisis identificó cinco roles (Visitante, usuario, empresa, administrador, owner), las reglas de negocio (IVA del 19 % por producto, comisión del 5 %, equivalencia RehniCoin, reserva atómica de stock) y los criterios de aceptación funcionales.

## 6.5 Diseño

El diseño definió una arquitectura por capas para el backend, un modelo de datos relacional de aproximadamente 36 tablas, un esquema de autenticación con JWT de acceso y de refresco, y una arquitectura de variantes basada en atributos genéricos por categoría.

## 6.6 Implementación

La implementación produjo el backend (24 routers, cerca de 130 rutas), el frontend web para los cuatro roles, y la aplicación móvil para el comprador, todo contenerizado.

## 6.7 Pruebas

Se implementó una suite de 113 pruebas de servicio e integración ligera en el backend, verificación estática en el frontend y en la aplicación móvil, y se preparó el plan de pruebas de aceptación. Se ejecutó además una muestra técnica de aceptación contra la API real y una prueba de rendimiento básica.

## 6.8 Gestión de defectos

Los defectos se reconstruyeron a posteriori a partir de los hallazgos del informe de calidad, los cambios "Fixed" del historial y los comentarios de pendiente en el código. El registro clasifica cada defecto por fase de inyección, de detección y de corrección.

## 6.9 Seguimiento y control

El seguimiento se realizó sobre los hitos reales del control de versiones. Se observó una compresión de trabajo en las últimas semanas y una subestimación en las tareas de rediseño arquitectónico.

## 6.10 PSP

La disciplina PSP se documenta en la bitácora correspondiente. Debe leerse con la salvedad expresa de que el registro de tiempo no se llevó en vivo; los tiempos por fase son estimaciones retrospectivas.

<!-- PAGEBREAK -->

# 7. ANÁLISIS DEL SISTEMA

## 7.1 Identificación de actores

TABLE:actores

## 7.2 Historias de usuario

El proyecto define 29 historias de usuario (HU-001 a HU-029), consolidadas en `docs/RehniMarket-HU.md`. El listado completo con su descripción se incluye en el ANEXO A. Se identificaron dos desviaciones entre las historias de usuario y el código, tomando el código como fuente:

- HU-025: las historias describen anuncios "con imagen, texto y enlace"; el código los define como banners solo visuales (imagen más enlace o destino de segmentación, sin título, descripción ni texto de botón), tras la migración `d4e5f6a7b8c9`.
- HU-004: las historias indican que una empresa con certificación pendiente puede iniciar sesión; el código lo bloquea con el código de error `COMPANY_PENDING`.

## 7.3 Requisitos funcionales

El proyecto define 65 requisitos funcionales (RF-001 a RF-065), consolidados en el documento de requisitos. El listado completo se incluye en el ANEXO B. El estado global es el siguiente:

TABLE:rf_estado

Nota: los enunciados de RF-046, RF-055 y RF-056 mencionan "variantes de color" y "especificaciones"/"colores", que corresponden al modelo anterior. El código actual usa una arquitectura de atributos genéricos por categoría (ejes de variante y especificaciones). Esta desviación está documentada.

## 7.4 Requisitos no funcionales

El proyecto define 31 requisitos no funcionales (RNF-001 a RNF-031), consolidados en el documento de requisitos. El listado completo se incluye en el ANEXO C. El estado global es el siguiente:

TABLE:rnf_estado

## 7.5 Reglas de negocio

- El impuesto al valor agregado (IVA) es del 19 % y se aplica únicamente sobre los productos marcados con IVA por la empresa vendedora (`Product.applies_tax`), sobre la base ya con descuentos aplicados.
- La comisión de la plataforma es del 5 % sobre las ventas válidas; se descuenta al generar la liquidación a la empresa.
- RehniCoin equivale a 1 peso colombiano. El saldo solo lo acredita un administrador de forma manual.
- La compra genera un pedido por cada empresa vendedora presente en el carrito.
- El pedido nace en estado "pendiente". El comprador solo puede cancelar mientras el pedido esté en "pendiente" o "pagado".
- La cancelación individual de un pedido por el comprador NO reembolsa RehniCoin ni repone stock (RF-065 no implementado). El reembolso automático solo ocurre cuando la administración suspende a una empresa.
- Una empresa solo puede iniciar sesión si su certificación fue aprobada por la administración.
- Solo el rol usuario puede comprar. Acreditar saldo es exclusivo de administrador y owner.
- Solo un owner puede asignar o modificar el rol owner; ninguna cuenta owner puede ser eliminada.
- Una liquidación requiere que la empresa tenga configurada una cuenta bancaria predeterminada.

## 7.6 Casos de uso

Los casos de uso del sistema se corresponden con las historias de usuario del ANEXO A y con los requisitos funcionales del ANEXO B. Cada requisito funcional del documento de requisitos incluye descripción, actores, precondiciones, entrada, proceso, resultado esperado, prioridad, módulo, historia de usuario relacionada, estado y endpoint relacionado. El repositorio no contiene diagramas de casos de uso en formato gráfico; su elaboración queda como TRABAJO FUTURO.

## 7.7 Criterios de aceptación

Una funcionalidad se considera aceptada cuando, con datos representativos: cumple el flujo esperado; no produce errores críticos (pantallas en blanco, cierres inesperados, respuestas HTTP 5xx no controladas); respeta la autenticación y los permisos (401/403 cuando corresponde); los datos mostrados provienen del backend y no se calculan en el cliente; los errores de operaciones críticas se muestran sin ocultarse; el sistema impide operaciones inválidas (comprar sin stock, sin dirección o sin saldo; acceder a datos de otro usuario); hay consistencia entre web y móvil cuando la funcionalidad existe en ambos; y el carrito, los favoritos, las direcciones y la sesión persisten en el servidor.

<!-- PAGEBREAK -->

# 8. DISEÑO DEL SISTEMA

## 8.1 Arquitectura general

RehniMarket sigue una arquitectura cliente–servidor de tres capas, contenerizada con Docker Compose. Los clientes (frontend web y aplicación móvil) se comunican por HTTP/JSON con el backend. El backend se comunica con PostgreSQL para los datos relacionales, con MinIO para los binarios y con un servidor SMTP para el correo transaccional. La autoridad sobre precios, stock, saldos, estados de pedido y permisos reside siempre en el backend.

## 8.2 Arquitectura del backend

El backend aplica una arquitectura por capas de forma consistente:

- Enrutado (`app/routers/`): define la ruta y el método, valida el cuerpo y los parámetros con Pydantic, extrae el usuario del estado de la petición y delega en un servicio.
- Servicios (`app/services/`): reglas de negocio (precios, IVA, comisión, validación de stock, transiciones de estado de pedido, correos, liquidaciones). Abre la transacción y realiza confirmación o reversión.
- Repositorio (`app/repository/`): consultas SQLAlchemy encapsuladas y reutilizables entre servicios.
- Modelos (`app/models/`): entidades ORM con SQLAlchemy 2.0, relaciones, enumerados nativos de PostgreSQL e índices.
- Esquemas (`app/schemas/`): contratos de entrada y salida con Pydantic.
- Configuración transversal (`app/core/`): catálogo de códigos de error, helper de error, tasa de IVA, porcentaje de comisión y tasa de conversión de RehniCoin.
- Middleware (`app/middleware/`): autenticación, autorización por rol, CORS y limitación de tasa (activable por variable de entorno).

El punto de entrada es `app/main.py`, que crea la aplicación FastAPI, ejecuta en el arranque la preparación del bucket de MinIO y, opcionalmente, la carga de datos iniciales, y registra 24 routers.

## 8.3 Arquitectura del frontend web

El frontend web se organiza por funcionalidad (feature). Cada funcionalidad tiene su cliente de API, sus componentes, su contexto y sus tipos. Existe un único cliente HTTP (axios) con interceptores para la autenticación y el manejo de errores. La autorización real la impone el backend; el frontend solo refleja lo autorizado (deshabilita botones, oculta secciones, redirige a inicio de sesión conservando el destino).

## 8.4 Arquitectura móvil

La aplicación móvil usa Expo Router con rutas basadas en archivos. La sesión (tokens de acceso y de refresco) se guarda en `expo-secure-store`, el almacén cifrado del dispositivo. Si una cuenta de empresa, administrador u owner inicia sesión, la aplicación cierra la sesión automáticamente, ya que esos paneles no existen en el canal móvil.

## 8.5 Comunicación entre componentes

FIGURE:comunicacion

- Frontend y móvil al backend: mediante las variables `VITE_API_URL` y `EXPO_PUBLIC_API_URL`.
- Backend a PostgreSQL: cadena `URL_DATABASE`, motor SQLAlchemy con verificación de conexión previa (`pool_pre_ping=True`).
- Backend a MinIO: SDK de MinIO, endpoint interno, sin TLS en la red interna. Las imágenes se sirven al cliente mediante el proxy `GET /media/proxy?path=...` del propio backend; el navegador nunca contacta directamente con MinIO.
- Backend a SMTP: biblioteca estándar sobre `smtp.gmail.com:587` con STARTTLS.

## 8.6 Modelo de datos

El modelo de datos comprende aproximadamente 36 tablas (37 contando la tabla de control de migraciones de Alembic), agrupadas por dominio: roles y usuarios; empresas y finanzas; catálogo y atributos; productos e imágenes; variantes, opciones y atributos de variante; carrito; pedidos; billetera y movimientos; direcciones, favoritos y reseñas; reportes; anuncios; y transportadoras.

Enumerados nativos de PostgreSQL: estado de pedido (pendiente, pagado, en preparación, enviado, entregado, cancelado), estado de certificación de empresa (pendiente, aprobada, rechazada), estado de liquidación (pendiente, pagada), tipo de cuenta bancaria, tipo de movimiento de billetera (recarga, compra, reembolso, ajuste), tipo y estado de reporte, tipo de segmentación de anuncio, acción de actividad administrativa y tipo de código de evento (verificación de correo, restablecimiento de contraseña).

## 8.7 Modelo entidad–relación

FIGURE:er

Relaciones principales (claves foráneas verificadas en el código):

- `users.role_id` -> `roles.id`. Un usuario tiene un rol.
- `company.user_id` -> `users.id`. Relación uno a uno entre usuario y empresa.
- `company_bank_accounts.company_id` -> `company.id`. `company_payouts.company_id` -> `company.id`, y `company_payouts.bank_account_id` -> `company_bank_accounts.id`.
- `catalog_attributes.catalog_id` -> `catalog.id`. `catalog_attribute_options.attribute_id` -> `catalog_attributes.id`.
- `products.company_id` -> `company.id`, `products.catalog_id` -> `catalog.id`. `product_images.product_id` -> `products.id`. `product_attribute_values.product_id` -> `products.id` y `.attribute_id` -> `catalog_attributes.id`.
- `product_variants.product_id` -> `products.id`. `variant_options.variant_id` -> `product_variants.id`, `.attribute_id` -> `catalog_attributes.id`, `.option_id` -> `catalog_attribute_options.id`. `product_variant_images.variant_id` -> `product_variants.id`.
- `carts.user_id` -> `users.id` (uno a uno). `cart_items.cart_id` -> `carts.id`, `.product_id` -> `products.id`, `.variant_id` -> `product_variants.id`.
- `orders.user_id` -> `users.id`, `.company_id` -> `company.id`, `.address_id` -> `addresses.id`, `.shipping_carrier_id` -> `shipping_carriers.id`. `order_items.order_id` -> `orders.id`, `.product_id` -> `products.id`, `.variant_id` -> `product_variants.id` (sin borrado en cascada). `order_items.attributes_snapshot` guarda en formato JSONB la combinación de la variante comprada.
- `wallets.user_id` -> `users.id` (uno a uno). `wallet_transactions.wallet_id` -> `wallets.id`, `.user_id` -> `users.id`, `.order_id` -> `orders.id`.
- `addresses.user_id`, `favorites.user_id`, `reviews.user_id` -> `users.id`; `favorites` y `reviews` referencian además `products.id`.
- `reports.reporter_id` -> `users.id`, `.product_id` -> `products.id`, `.company_id` -> `company.id`. `report_evidences.report_id` -> `reports.id`.

## 8.8 Estructura de la base de datos

Además del contenido de las tablas, el volcado lógico de la base incluye las secuencias, los índices (entre ellos el índice GIN de la búsqueda difusa), las restricciones de clave primaria, foránea, unicidad y verificación, los tipos enumerados nativos, las extensiones `pg_trgm` y `unaccent`, y la función `rehni_search_norm`.

El diseño de variantes usa una clave de combinación (`ProductVariant.combo_key`) que es un resumen SHA-256 determinista de los identificadores de opción ordenados, con un índice único parcial que impide que dos variantes vivas del mismo producto compartan combinación, sin bloquear la recreación de una combinación previamente dada de baja.

## 8.9 Roles y permisos

TABLE:roles_prefijos

Los roles administrador y owner tienen acceso total (bypass) en el middleware; las capacidades exclusivas del owner (asignar el rol owner, gestionar cuentas owner) se protegen a nivel de servicio. Los roles usuario y empresa se restringen mediante una lista blanca de prefijos de ruta.

## 8.10 Diseño de seguridad

El diseño de seguridad se apoya en: autenticación con JWT de acceso y de refresco firmados con HS256; un middleware que valida el token en cada petición no pública, revalida el estado de la cuenta (`Users.isActive`) y de la empresa (`Company.CompanyStatus`) aunque el token siga vigente, y aplica la autorización por rol; hash de contraseñas con bcrypt; verificación de correo obligatoria con códigos de un solo uso; validación de entrada con Pydantic en todos los endpoints; y gestión de secretos fuera del control de versiones.

<!-- PAGEBREAK -->

# 9. IMPLEMENTACIÓN

## 9.1 Backend

El backend concentra toda la lógica de negocio. Expone alrededor de 130 rutas agrupadas en 24 routers, con un catálogo de 102 códigos de error y un contrato de error uniforme. La documentación interactiva de la API se publica automáticamente en `/docs` (Swagger UI) y el esquema en `/openapi.json`; ambas rutas son públicas.

## 9.2 FastAPI

La aplicación se define con `FastAPI(lifespan=...)`, con título "RehniMarket API" y versión "2.4.0". En el ciclo de vida se prepara el bucket de MinIO y, si la variable `RUN_SEED` está activa, se ejecuta la carga de datos iniciales. Hay un manejador global para los errores de validación de Pydantic, que responde con código HTTP 422 y el código de error `VALIDATION_ERROR`.

## 9.3 PostgreSQL

El motor SQLAlchemy se crea con verificación de conexión previa (`pool_pre_ping=True`) y sin registro de consultas. La sesión por petición se obtiene mediante una dependencia con patrón de cesión y cierre. La salud de la base se comprueba con `GET /health/database`, que ejecuta `SELECT 1`.

## 9.4 ORM

El ORM usa SQLAlchemy 2.0 con la sintaxis declarativa `Mapped[...]`. Los modelos están registrados mediante la importación de `app.models` en el punto de entrada, lo que permite que Alembic detecte el metadato completo. Los modelos son específicos del dialecto PostgreSQL (extensiones y tipos enumerados nativos).

## 9.5 Alembic

El esquema evoluciona en una cadena lineal de 10 revisiones, desde `29fe206320ce` hasta `a1b2c3d4e5f6` (revisión de cabeza confirmada). Las migraciones se aplican automáticamente al arrancar el contenedor del backend, mediante el comando `uv run alembic upgrade head`. La configuración toma la URL de la base desde `app.Config` y no desde `alembic.ini`.

Migraciones destacadas: `a90540bebea` (arquitectura de variantes y atributos con descuentos), `b6f8fd31fbe` (backfill de datos del modelo anterior a la nueva arquitectura), `cb6d38ee0bd` (snapshot de atributos en el ítem de pedido), `d4e5f6a7b8c9` (eliminación de los campos de texto de los anuncios), `e7a1c9d24b30` (transportadoras y campos de envío), `f2b7c4e91a05` (IVA por producto) y `a1b2c3d4e5f6` (búsqueda difusa con `pg_trgm` y `unaccent`).

## 9.6 JWT y refresh tokens

El servicio de JWT emite un token de acceso con la carga `{ sub, role, type: "access", exp }` y expiración corta (por ejemplo 30 minutos), y un token de refresco con la carga `{ sub, type: "refresh", exp }` y expiración en días (por ejemplo 15). Ambos se firman con HS256 y la clave `SECRET_KEY`. El middleware rechaza un token de refresco usado como token de acceso. El token de refresco se persiste en la tabla `refreshToken`; el endpoint `POST /auth/refresh` valida que exista, no esté expirado y que la cuenta y la empresa sigan activas antes de emitir un nuevo token de acceso.

## 9.7 Recuperación y verificación de cuentas

Los códigos de verificación y de recuperación viven en la tabla `event_codes`, con un único código activo por usuario y tipo. El código de verificación de correo expira en 5 minutos y el de restablecimiento de contraseña en 15. Hay un tiempo mínimo de espera de 60 segundos para volver a solicitar un código; una solicitud dentro de ese tiempo responde con código HTTP 429 y el código de error `RESEND_COOLDOWN_ACTIVE`. Se puede corregir el correo antes de completar la verificación.

## 9.8 Gestión de usuarios

El administrador puede consultar el listado de usuarios y su detalle, actualizar la información, bloquear o desbloquear una cuenta y eliminarla. Un administrador que no sea owner no puede modificar, bloquear ni asignar el rol owner. Ninguna cuenta owner puede eliminarse.

## 9.9 Gestión de empresas

El registro de empresa crea el usuario con rol empresa y la empresa asociada (con NIT, dígito de verificación y certificado en PDF subido a MinIO), con la certificación en estado pendiente. El administrador aprueba o rechaza la certificación; solo una empresa aprobada aparece como verificada y puede iniciar sesión. Al suspender una empresa, sus pedidos en estado pendiente, pagado o en preparación se cancelan y se reembolsan en RehniCoin al comprador.

## 9.10 Gestión de productos

Un producto es la identidad (nombre, descripción, categoría, empresa); la unidad comprable es la variante. Los campos `Product.price` y `Product.stock` reflejan la variante viva más barata. La empresa crea productos, define descuentos por porcentaje o valor fijo con ventana temporal, edita, activa o desactiva la visibilidad pública y da de baja lógicamente. Un producto y sus variantes solo los gestiona la empresa que los creó.

## 9.11 Variantes

Los atributos se definen por categoría, con un rol: eje de variante (genera inventario, por ejemplo Color, Talla, Almacenamiento) o atributo de producto (descriptivo o de filtro, por ejemplo Marca, Modelo). Una variante debe portar exactamente una opción por cada eje de variante del catálogo del producto. El asistente de generación crea el producto cartesiano de las combinaciones, marcando las que ya existen. El precio efectivo se resuelve en el backend (descuento de variente vigente, luego descuento de producto vigente, luego precio base); el frontend nunca lo recalcula.

## 9.12 Carrito

Cada línea del carrito se identifica por la terna carrito, producto y variante. El stock disponible de una línea es el de la variante si tiene, o el del producto si no. La operación de agregar rechaza si el stock disponible es cero (`PRODUCT_OUT_OF_STOCK`) o si la cantidad acumulada supera el stock (`INSUFFICIENT_STOCK`). En la web, el carrito marca cada línea como "Agotado" o "Sin stock suficiente" y deshabilita el botón de pago si hay al menos una línea no disponible; siempre se puede eliminar cualquier línea.

## 9.13 Checkout

El endpoint `POST /checkout` recibe el identificador de la dirección y ejecuta: revalidación de cada línea (producto activo, empresa no suspendida, variante viva); recálculo de precios e IVA en el servidor; verificación de la dirección; reserva de stock atómica por línea mediante una actualización condicional (`stock = stock - qty WHERE stock >= qty`), con orden determinista para evitar bloqueos mutuos; bloqueo de la billetera con `SELECT ... FOR UPDATE` y verificación del saldo (si no alcanza, código HTTP 402 y `INSUFFICIENT_BALANCE`, con reversión total); creación de un pedido por empresa con el snapshot de atributos congelado; descuento del saldo con un movimiento de tipo compra; vaciado del carrito; y envío de un correo por pedido. Los pedidos nacen en estado pendiente.

Existe una prueba de concurrencia que verifica que, ante dos compras simultáneas de la última unidad, solo una gana, sin stock negativo ni pedido duplicado.

## 9.14 Pedidos

TABLE:pedido_estados

El comprador cancela solo en los estados pendiente o pagado. La empresa avanza el estado siguiendo el flujo permitido y registra la transportadora y el número de guía al marcar el pedido como enviado. El detalle del pedido conserva un snapshot (nombre de producto y de variante, atributos, precio unitario y dirección) tal como estaban al comprar.

## 9.15 Billetera / RehniCoin

Cada cuenta de usuario tiene una billetera. El usuario consulta el saldo y el historial paginado de movimientos (recarga, compra, reembolso, ajuste). La solicitud de recarga abre una conversación de WhatsApp con el número oficial, incluyendo la cantidad solicitada y el correo de la cuenta; el saldo no se acredita automáticamente. Un administrador acredita el saldo identificando al usuario por su correo (`POST /admin/wallet/recharge`).

## 9.16 MinIO

El bucket es único y se llama `uploads`; su nombre está fijo en el código. El bucket se crea automáticamente al arrancar el backend; si MinIO no responde, se registra una advertencia y el proceso continúa. La convención de rutas de objeto distingue por dominio (productos, variantes, logos, banners, certificados, anuncios, categorías, fotos de perfil y evidencias de reportes). La URL de la imagen la construye la función `build_media_url`, que a partir de la corrección de esta entrega toma la base de la variable `URL_BACKEND`.

## 9.17 Frontend

El frontend web usa React 19, Vite 8 y TypeScript, con TailwindCSS para los estilos. La compilación de producción es `tsc -b && vite build`. El frontend implementa un sistema de diseño propio (primitivas de interfaz, estados de carga y vacíos, alertas globales), navegación por rol con enlaces profundos, y mensajes de error en español provenientes del backend. El README del frontend es la plantilla por defecto de Vite y no describe el proyecto; su actualización queda como TRABAJO FUTURO.

## 9.18 Aplicación móvil

La aplicación móvil usa Expo SDK 54, Expo Router y React Native 0.81.5, con TypeScript en modo estricto. El alcance mínimo garantizado es Home, detalle de producto y autenticación; la expansión (carrito, checkout, pedidos, billetera, direcciones) está en el árbol de trabajo y compila sin errores en modo estricto, pero su validación funcional completa queda PENDIENTE. No hay empaquetado nativo configurado.

## 9.19 Docker

Cada servicio corre en su contenedor. El Dockerfile del backend parte de `python:3.13-slim`, instala las dependencias con `uv sync --frozen --no-dev` y expone el puerto 8000. El Dockerfile de desarrollo del frontend arranca el servidor de desarrollo de Vite. Para producción se añadió `RehniMarket-frontend/Dockerfile.prod`, un build multi-etapa que compila el SPA y lo sirve con Nginx.

## 9.20 Docker Compose

El archivo `docker-compose.yml` de desarrollo define cuatro servicios: `minio`, `postgres`, `backend` y `frontend`.

TABLE:docker_servicios

En esta entrega se añadieron comprobaciones de salud (healthcheck) para `postgres` (`pg_isready`), `minio` (endpoint de salud) y `backend` (petición a `/health/database`). El backend arranca con el comando `sh -c "uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"`.

## 9.21 Configuración de producción

Se entrega `docker-compose.prod.yml`, una configuración endurecida. Las diferencias respecto a la de desarrollo se resumen en la Tabla 17. La configuración de producción se construyó y se levantó en un proyecto Compose aislado (`rehni-prod-test`, con puertos alternos), verificando que los cuatro servicios arrancan respetando las comprobaciones de salud, que la API y el SPA responden, que PostgreSQL y MinIO no publican puertos en el host y que el backend queda solo en la interfaz de bucle local. El entorno de prueba se desmontó. El proyecto NO se ha desplegado en un servidor de producción real.

<!-- PAGEBREAK -->

# 10. SEGURIDAD

## 10.1 Autenticación

Autenticación con JWT firmado con HS256. Se emiten un token de acceso de vida corta y un token de refresco de vida más larga. El token de refresco se persiste en base de datos para permitir su invalidación. La verificación de correo es obligatoria antes del inicio de sesión.

## 10.2 Autorización

La autorización se aplica en un único middleware. Para cada petición no pública se valida el token, se carga el usuario desde la base, se revalida que la cuenta esté activa y que la empresa no esté suspendida, y se comprueba el rol. Los roles administrador y owner tienen acceso total; los roles usuario y empresa se restringen por lista blanca de prefijos de ruta. Las capacidades exclusivas del owner se protegen a nivel de servicio.

## 10.3 Roles

Cinco roles: Visitante, usuario, empresa, administrador y owner. El detalle de lo que puede hacer cada rol está en el manual de usuario y en la Tabla 8.

## 10.4 CORS

Corrección de esta entrega: la política de CORS ya no permite cualquier origen. La lista de orígenes permitidos se construye a partir de la variable `URL_FRONTEND` más los orígenes locales de desarrollo, y el permiso de credenciales es coherente con esa lista. Si `URL_FRONTEND` no está definido, se cae a una política abierta con credenciales deshabilitadas, lo cual no es recomendable en producción.

## 10.5 Limitación de tasa (rate limiting)

Corrección de esta entrega: el middleware de limitación de tasa ya no está comentado. Se activa con la variable `RATE_LIMIT_ENABLED` y la configuración de producción lo fuerza a activo. El conteo se mantiene en memoria del proceso; para varias réplicas se necesitaría un almacén compartido, lo cual queda como TRABAJO FUTURO.

## 10.6 Gestión de secretos

Los archivos de entorno reales están fuera del control de versiones y fuera de la imagen. Solo se versionan las plantillas. Corrección de esta entrega: la plantilla de entorno ya no sugiere una clave trivial; trae un marcador explícito y la instrucción de generar la clave con `openssl rand -hex 32`. Generar el valor real por entorno sigue siendo una acción del despliegue.

## 10.7 Seguridad de contenedores

En la configuración de producción, PostgreSQL y MinIO no publican puertos en el host (solo son accesibles por la red interna), el backend se publica únicamente en la interfaz de bucle local (asumiendo un reverse proxy con TLS por delante), el frontend se sirve como estáticos por Nginx, y la imagen de MinIO se fija por digest.

## 10.8 Auditoría de dependencias

Se ejecutó `pip-audit` sobre el backend y `pnpm audit` sobre el frontend y la aplicación móvil. La evidencia está en `evidencias/security/`.

## 10.9 Vulnerabilidades encontradas

- Backend: 8 vulnerabilidades en 5 paquetes (`click`, `pip`, `pyasn1` en tres avisos, `pydantic-settings` y `ecdsa`).
- Frontend: 7 vulnerabilidades, todas transitivas (una en `react-router`, el resto en herramientas de compilación como `postcss`, `nanoid` y `brace-expansion`).
- Aplicación móvil: 7 vulnerabilidades transitivas del conjunto de herramientas de Expo.

## 10.10 Vulnerabilidades corregidas

- Backend: se actualizaron `click` a 8.3.3, `pip` a 26.2, `pyasn1` a 0.6.4 y `pydantic-settings` a 2.14.2. Ninguno de estos paquetes está en rutas de código ejercitadas por las pruebas. Tras la actualización quedan 8 -> 1.
- Frontend: se actualizó `react-router-dom` a 7.18.3, que corrige un aviso de falsificación de petición en modo de componentes de servidor (modo que el proyecto no usa). Tras la actualización quedan 7 -> 6.

## 10.11 Vulnerabilidades restantes

- Backend: 1 vulnerabilidad en `ecdsa` 0.19.2 (aviso PYSEC-2026-1325, un ataque de temporización sobre la curva P-256), SIN PARCHE disponible. No es explotable en RehniMarket: el proyecto firma los JWT con HS256 (HMAC simétrico), no usa ECDSA, y el camino de código vulnerable no se ejercita. `ecdsa` es dependencia transitiva de `python-jose`.
- Frontend y móvil: 6 y 7 vulnerabilidades transitivas de herramientas de compilación y de línea de comandos, que no se empaquetan en el artefacto servido al navegador ni a la aplicación.

## 10.12 Recomendaciones de seguridad

- Definir siempre la variable `URL_FRONTEND` y generar una clave secreta real por entorno.
- Desplegar tras un reverse proxy con TLS.
- Crear un usuario y una política de MinIO de mínimo privilegio, limitados al bucket `uploads`, en lugar de usar las credenciales root.
- Evaluar la migración de `python-jose` a `pyjwt` para eliminar la dependencia transitiva de `ecdsa`.
- Añadir `overrides` de paquetes para las vulnerabilidades transitivas de compilación del frontend, con pruebas de regresión.
- Integrar `pip-audit` y `pnpm audit` en un flujo de integración continua.
- Inicializar un registro estructurado y un monitor de errores.

<!-- PAGEBREAK -->

# 11. DESPLIEGUE E INFRAESTRUCTURA

## 11.1 Entorno de desarrollo

El flujo soportado es el despliegue de toda la plataforma de servidor con Docker Compose. El equipo de validación en el que se ejecutaron todas las pruebas tiene 12 hilos de CPU, 7,0 GiB de RAM, disco NVMe de 128 GB, sistema operativo CachyOS (kernel 7.1.4), Docker Engine 29.6.2 y Docker Compose 5.3.1. Los cuatro contenedores en reposo consumen aproximadamente 613 MiB de RAM en total; las imágenes ocupan aproximadamente 10,4 GB.

## 11.2 Docker Compose (desarrollo)

Cuatro servicios (`minio`, `postgres`, `backend`, `frontend`). El backend arranca con recarga en caliente y monta el código por bind mount. PostgreSQL y MinIO publican sus puertos en el host (5434 y 9000). Las migraciones se aplican solas al arrancar.

## 11.3 Docker Compose de producción

TABLE:compose_diferencias

Esta configuración se construyó y se probó en un proyecto aislado. NO se ha desplegado a un servidor de producción real. La configuración no incluye el reverse proxy con TLS, cuya definición depende del dominio y del certificado.

## 11.4 Nginx

El frontend de producción se sirve con Nginx 1.27. La configuración incluye redirección de rutas desconocidas a `index.html` (necesario para el enrutado del cliente), compresión, caché de assets con hash y cabeceras de seguridad (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).

## 11.5 Comprobaciones de salud (healthchecks)

En esta entrega se añadieron comprobaciones de salud para PostgreSQL (`pg_isready`), MinIO (endpoint de salud) y el backend (petición a `/health/database`). En la configuración de producción, el arranque del backend depende de que PostgreSQL y MinIO estén sanos, y el del frontend depende de que el backend esté sano.

## 11.6 Variables de entorno

El backend lee sus variables de un único archivo de entorno, compartido por los servicios `postgres`, `minio` y `backend`. Las variables cubren la conexión a la base, las credenciales de MinIO, las claves y expiraciones de JWT, las URLs pública del backend y del frontend, las credenciales de correo, la bandera de limitación de tasa, y las cuentas iniciales para la carga de datos. Se detectó una desalineación entre el archivo de entorno real y su plantilla (nombres de variables de carga inicial y una variable `IP` no usada por el código), documentada en el manual técnico.

## 11.7 Persistencia

Los datos persisten en volúmenes de Docker nombrados: `postgres_rehni_data` para la base de datos y `minio_rehni_data` para los objetos. Sobreviven a `docker compose down` sin la opción de borrado de volúmenes.

## 11.8 MinIO

Almacenamiento de objetos compatible con S3. En desarrollo se usa la etiqueta `latest`; en producción se fija por digest. La consola web de MinIO no está expuesta.

## 11.9 PostgreSQL

PostgreSQL 17. Base `rehnimarket`. En el equipo de validación la base ocupa aproximadamente 10 MB con 37 tablas. Extensiones `pg_trgm` y `unaccent`, más la función `rehni_search_norm` y el índice GIN de búsqueda.

## 11.10 Consideraciones para producción

Para una publicación real se requiere: un servidor con Docker; un dominio y sus registros DNS; un reverse proxy con TLS (por ejemplo Caddy, Traefik o Nginx) que termine HTTPS y enrute el dominio al frontend y el subdominio de API al backend; una clave secreta generada por entorno; un usuario de MinIO de mínimo privilegio; y la automatización de las copias de seguridad.

## 11.11 Estado real del despliegue

DEMO LOCAL: verificada. El stack de desarrollo se levanta con `docker compose up -d`; los cuatro servicios responden y las comprobaciones de salud marcan a PostgreSQL, MinIO y backend como sanos. Evidencia en `evidencias/deployment/`.

PRODUCCIÓN REAL: NO REALIZADA. No existe servidor, dominio ni certificado TLS. La configuración de producción está PREPARADA y PROBADA en aislado, pero el despliegue real REQUIERE VALIDACIÓN HUMANA (servidor e infraestructura).

<!-- PAGEBREAK -->

# 12. RESPALDO Y RESTAURACIÓN

## 12.1 Estrategia de backup

El respaldo cubre los dos sistemas que contienen información crítica: PostgreSQL (datos relacionales) y MinIO (binarios). Ambos deben respaldarse de forma coordinada, con el mismo identificador de fecha y hora, porque la base de datos guarda la ruta del objeto y MinIO guarda el binario. Se implementaron dos scripts: `scripts/backup_rehnimarket.sh` y `scripts/restore_rehnimarket.sh`.

## 12.2 PostgreSQL

El respaldo de PostgreSQL usa `pg_dump` en formato personalizado y comprimido, ejecutado dentro del contenedor. El script valida el volcado con `pg_restore -l` y calcula su resumen SHA-256.

## 12.3 MinIO

El respaldo de MinIO usa el cliente `mc` incluido en la imagen, con la operación de espejo (`mc mirror`) del bucket `uploads`, que preserva la ruta completa de cada objeto. El resultado se empaqueta y se calcula su resumen SHA-256.

## 12.4 Integridad mediante SHA-256

Cada artefacto de respaldo lleva su archivo de resumen SHA-256. La verificación con `sha256sum -c` se ejecuta antes de restaurar.

## 12.5 Restauración

El script de restauración levanta un PostgreSQL y un MinIO temporales y desechables (contenedores independientes, red propia), verifica los resúmenes, restaura la base con `pg_restore` y los objetos con `mc mirror`, ejecuta las validaciones y destruye el entorno de prueba.

## 12.6 Validación

La validación comprueba el número de tablas restauradas, los conteos de filas de tablas clave frente al origen, las extensiones y la función de búsqueda, la revisión de Alembic embebida en el volcado, y el número de objetos de MinIO frente al respaldo.

## 12.7 Resultados

Se ejecutó un ciclo completo el 2026-08-31 con el identificador `2026-08-31_16-59`.

TABLE:restore_resultado

Los conteos de filas restaurados coincidieron exactamente con el origen (roles 4, usuarios 11, empresas 6, productos 33, variantes 112, pedidos 22, ítems de pedido 30, billeteras 4, movimientos de billetera 26). El entorno de prueba se destruyó al terminar.

## 12.8 Limitaciones

Tres comprobaciones de la tabla de prueba de restauración quedaron marcadas como PENDIENTE por requerir montar la aplicación completa sobre el entorno aislado: la carga de imágenes del catálogo por el proxy, el flujo de compra sobre el entorno restaurado y la ejecución de la suite de pruebas sobre él. Los objetos están íntegros (166 = 166); estas tres comprobaciones son un paso adicional, no crítico para demostrar que el respaldo es restaurable.

## 12.9 Automatización futura

TRABAJO FUTURO: agendar el script con `cron` o un temporizador de `systemd`, cifrar las copias con GPG y enviarlas a un almacenamiento externo al servidor, y repetir la prueba de restauración de forma periódica dejando su evidencia. Estas tres acciones no se pueden completar sin un servidor de operación real.

<!-- PAGEBREAK -->

# 13. PRUEBAS

## 13.1 Estrategia de pruebas

La estrategia combina: pruebas de servicio e integración ligera en el backend contra una base PostgreSQL real; verificación estática de tipos y de estilo en el frontend y en la aplicación móvil; una muestra de pruebas de aceptación ejecutada contra la API real; y una prueba de rendimiento básica. El plan completo de pruebas de aceptación con usuario final está preparado y documentado, con una matriz de aproximadamente 240 casos.

## 13.2 Pruebas unitarias y de servicio

El backend tiene 7 archivos de prueba con 113 funciones de prueba, usando `pytest`. El archivo de configuración de pruebas crea automáticamente una base `rehnimarket_test` en el mismo servidor PostgreSQL, construye el esquema con `Base.metadata.create_all`, replica las extensiones y la función de búsqueda, y usa el cliente de pruebas de FastAPI. Cubren catálogo público, carrito y checkout (incluido el descuento atómico de stock y la concurrencia), atributos de catálogo, variantes, búsqueda difusa, secciones de ofertas y novedades, anuncios y resolución de precios.

## 13.3 Pruebas de integración

Las pruebas del backend son de integración ligera: ejercitan la lógica de negocio contra una base de datos real mediante el cliente de pruebas de FastAPI, sin levantar la aplicación completa ni MinIO ni SMTP. El recorrido completo cliente a base de datos para la web y el móvil se cubre con la ejecución del flujo real; su parte de cliente queda dentro de las pruebas de aceptación.

## 13.4 Pruebas de autorización

Se ejecutó una verificación de la autorización por rol contra la API real. Resultados registrados en `evidencias/security/roles/roles_permisos.txt`: sin token, las rutas protegidas responden 401; un token de rol usuario tiene acceso 200 a sus cinco grupos de rutas permitidas y recibe 403 en las rutas de empresa, de administración y en la de acreditación de saldo; un token inválido responde 401. La cobertura de los roles administrador, empresa y owner está dada por la suite de `pytest`, cuyo archivo de configuración crea tokens para los cuatro roles.

## 13.5 Pruebas de aceptación

Se ejecutó `scripts/acceptance_smoke.sh` contra la API real. Resultado: 28 de 28 comprobaciones aprobadas. Cubre: registro; inicio de sesión antes de verificar (código de error `EMAIL_NOT_VERIFIED`); tiempo mínimo de reenvío (código HTTP 429); verificación con el código real leído de la base; inicio de sesión; credenciales inválidas (`INVALID_CREDENTIALS`); renovación de token; ruta protegida sin token (401); comprador hacia rutas de administración y de empresa (403); comprador hacia la acreditación de saldo (403); catálogo; búsqueda difusa; ofertas; novedades; producto con variante obligatoria (`VALIDATION_ERROR`); agregar al carrito; persistencia del carrito; creación de dirección; checkout sin saldo (código HTTP 402, `INSUFFICIENT_BALANCE`, sin crear pedido); checkout con saldo (pedido creado, saldo descontado en 119 correspondiente a 100 más el 19 % de IVA, carrito vaciado); listado de pedidos; salud de la base; y esquema de la API.

Esta muestra NO reemplaza la prueba de aceptación con usuario final, que requiere una persona operando la interfaz y la firma del acta. El plan completo (matriz de casos, casos negativos, pruebas responsive, trazabilidad con historias de usuario, plan de capacitación y formato de acta) está en `docs/PLAN_PRUEBAS_ACEPTACION_REHNIMARKET.md`.

## 13.6 Pruebas de rendimiento

Se ejecutó `scripts/perf_test.sh`: 900 solicitudes en total (150 secuenciales y 150 concurrentes con diez hilos, para tres endpoints), con 0 errores.

TABLE:perf_resultado

Interpretación: RehniMarket no define objetivos de nivel de servicio cuantitativos. Estos números son una línea base del entorno de desarrollo, no un compromiso. El listado de catálogo es aproximadamente 2,5 veces más lento que el detalle o la búsqueda (cálculo de precio y descuento por producto). Existe una plantilla de prueba de carga para la herramienta k6 (`scripts/load_test.k6.js`), NO EJECUTADA; no hay resultados de k6.

## 13.7 Pruebas del frontend

Verificación estática, con resultado en `evidencias/tests/frontend-tsc-eslint.txt`: `tsc -b` código de salida 0; `eslint .` código de salida 0; `vite build` compila correctamente, con el bundle principal de aproximadamente 730 kB (aviso de fragmento mayor a 500 kB). NO hay archivos de prueba automatizada en el frontend.

## 13.8 Pruebas de la aplicación móvil

Verificación estática, con resultado en `evidencias/tests/mobile-lint.txt`: `tsc --noEmit` código de salida 0 (con modo estricto activado); `eslint .` código de salida 0, con 3 advertencias cosméticas. NO hay archivos de prueba automatizada en la aplicación móvil.

## 13.9 Pruebas de Docker

Ambos archivos Compose (desarrollo y producción) validan con `docker compose config`. El stack de desarrollo se levanta con los cuatro servicios y comprobaciones de salud correctas. La configuración de producción se levantó en un proyecto aislado con arranque ordenado por salud. Evidencia en `evidencias/deployment/`.

## 13.10 Resultados

TABLE:pruebas

<!-- PAGEBREAK -->

# 14. CALIDAD DEL SOFTWARE

## 14.1 ISO/IEC 25010

Se evaluaron las ocho características del modelo de calidad de producto. El resultado consolidado, actualizado con las correcciones de esta entrega, es el siguiente:

TABLE:iso25010

## 14.2 Seguridad

EVALUADO. La autenticación y la autorización son sólidas y están probadas. En esta entrega se corrigieron CORS, la clave de ejemplo y la URL de imágenes con IP fija, se hizo activable la limitación de tasa, se añadieron comprobaciones de salud y se endureció la configuración de producción. Las vulnerabilidades de dependencias del backend bajaron de 8 a 1 (no explotable). Queda como pendiente el reverse proxy con TLS para una publicación real y el usuario de MinIO de mínimo privilegio.

## 14.3 Rendimiento

MEDIDO (línea base básica). 900 solicitudes con 0 errores; latencias en la Tabla 16. NO EVALUADO con herramienta de carga especializada; sin objetivos de nivel de servicio acordados. Plantilla k6 preparada, NO EJECUTADA.

## 14.4 Fiabilidad

EVALUADO. El núcleo transaccional (reserva de stock y cobro de RehniCoin) es atómico y consistente ante concurrencia, con prueba automatizada. Debilidades: observabilidad mínima (registro escaso, monitor de errores declarado pero no inicializado).

## 14.5 Mantenibilidad

EVALUADO. Arquitectura por capas consistente, tipado fuerte de extremo a extremo, migraciones lineales. Brechas: sin verificador de tipos ni linter para el backend Python, sin integración continua, sin pruebas de cliente, modo estricto de TypeScript no activado en el frontend web.

## 14.6 Portabilidad

EVALUADO. Toda la plataforma de servidor está contenerizada, con dependencias fijadas. En esta entrega se añadió la configuración de producción, construida y probada. Limitaciones: modelos atados al dialecto PostgreSQL, aplicación móvil sin empaquetado.

## 14.7 Usabilidad

PARCIAL. Sistema de diseño propio con estados de carga y vacíos y mensajes en español. NO EVALUADO con usuarios (sin métricas SUS ni tasas de éxito de tareas).

## 14.8 Accesibilidad

PARCIAL / NO EVALUADO. Se observa atención a la semántica accesible (52 componentes con atributos `aria-*` o `role`). NO se realizó una auditoría formal (WCAG, axe, Lighthouse).

## 14.9 Resultados de calidad

El estado general de calidad es PARCIAL con mejora respecto de la evaluación previa. Las bases (arquitectura, seguridad de la lógica, transaccionalidad, contenerización, pruebas del backend) están bien establecidas. El trabajo restante se concentra en: ejecución de la campaña de carga y auditoría de accesibilidad, ampliación de las pruebas a los clientes, integración continua, y el despliegue real con TLS.

## 14.10 Defectos

Se registran 20 defectos (ver ANEXO F y Tabla 11): 5 de proceso, 4 de código detectados y corregidos durante el desarrollo, y 11 de deuda técnica o de auditoría.

## 14.11 Correcciones

En esta entrega se corrigieron o mitigaron: CORS abierto (H-01), clave secreta de ejemplo (H-04), README y CHANGELOG obsoletos (H-08), URL de imágenes con IP fija (H-16), la falta de limitación de tasa activa (H-02, ahora activable), 4 de las 8 vulnerabilidades de dependencias del backend y 1 del frontend, y la falta de configuración de producción (H-17, ahora existe y está probada).

## 14.12 Estado final

TABLE:calidad_estado_final

# 15. PSP Y GESTIÓN DEL PROCESO

## 15.1 Planificación

El alcance se planificó como un backlog de historias de usuario y se consolidó en 29 historias y 65 requisitos funcionales. La estimación inicial de duración fue de aproximadamente seis semanas.

## 15.2 Estimación

La estimación de esfuerzo por fase es una ESTIMACIÓN RETROSPECTIVA, no una medición. Durante el desarrollo NO se llevó un registro de tiempo en vivo. Las fechas y los hitos sí son reales (provienen del historial de control de versiones).

TABLE:psp_esfuerzo

## 15.3 Seguimiento

El seguimiento se realizó sobre los hitos reales del control de versiones. Se observó una compresión de trabajo en las últimas semanas (versiones "2.1" a "2.4" en dos días) y una subestimación en el rediseño arquitectónico y en la arquitectura de variantes.

## 15.4 Registro de defectos

El registro de defectos se reconstruyó a posteriori. Distingue tres categorías: proceso, código durante el desarrollo, y deuda o auditoría.

TABLE:psp_defectos

## 15.5 Inyección

La fase de inyección más frecuente de los defectos de código fue la codificación (integración de MinIO, autenticación, diseño del checkout). Los defectos de proceso se inyectaron en la planificación (no aplicar PSP desde el inicio, no fijar una convención de commits, no montar integración continua).

## 15.6 Detección

La mayoría de los defectos de código se detectaron en la fase de pruebas o en pruebas manuales. Los defectos de deuda se detectaron en la auditoría de calidad.

## 15.7 Corrección

De los 20 defectos registrados, 11 están corregidos y 9 permanecen abiertos, la mayoría de estos últimos de proceso o de configuración de producción.

## 15.8 Análisis

El análisis identifica que la revisión de código propia estuvo sub-invertida (aproximadamente 3 % del esfuerzo, frente a un 10-15 % recomendado por PSP) y que el diseño de datos merecía más tiempo por adelantado, lo que habría reducido el rediseño de la versión "2.0" y la migración del modelo de variantes.

## 15.9 Lecciones aprendidas

- Aplicar PSP desde el primer día; no se puede reconstruir un registro de tiempo fiable a posteriori.
- El diseño de datos merece más tiempo por adelantado.
- La revisión de código propia debe apoyarse en una lista de comprobación (entrada y salida en imports, confirmación antes de responder un error, condiciones de carrera, verificación de pertenencia, secretos).
- Centralizar la lógica crítica (precios, IVA, disponibilidad) evita duplicación y bugs de inconsistencia.
- La documentación de comportamiento envejece rápido; debe revisarse contra el código en cada entrega.
- Una convención de commits y una matriz de trazabilidad historia-commit-prueba habrían acelerado la auditoría.
- Una integración continua mínima habría dado una red de seguridad automática.

## 15.10 Plan de mejora del proceso personal

Para el próximo proyecto: hoja de registro de tiempo por fase desde el día 1; lista de comprobación de revisión de código; convención de commits y rama por funcionalidad; integración continua mínima; matriz de trazabilidad viva; registro de defectos en vivo; y presupuesto explícito de tiempo para el diseño de datos.

<!-- PAGEBREAK -->

# 16. RESULTADOS DEL PROYECTO

## 16.1 Funcionalidades implementadas

Catálogo público con búsqueda difusa, filtros y ordenamiento; secciones de ofertas y novedades; perfil público de empresa. Registro de comprador y de empresa; verificación de correo; inicio y cierre de sesión; recuperación y cambio de contraseña; renovación de sesión. Carrito con validación de stock por variante; checkout con pago en RehniCoin, IVA y total; reserva atómica de stock. Pedidos con máquina de estados; cancelación por el comprador cuando corresponde; envío con transportadora y guía. Favoritos; reseñas condicionadas a compra entregada; reportes; direcciones. Billetera RehniCoin. Panel de empresa completo (solo web). Panel de administración y owner completo (solo web).

## 16.2 Requisitos cumplidos

TABLE:rf_estado

De los 31 requisitos no funcionales: 27 implementados, 2 parciales, 2 no implementados.

## 16.3 Requisitos parcialmente cumplidos

- RF-020 (favoritos) y RF-021 (carrito): implementados en la web; la implementación en la aplicación móvil está en el árbol de trabajo y su validación queda PENDIENTE.
- RNF parciales: escalabilidad (posible por diseño, no preparada ni probada) y accesibilidad móvil (uso puntual de etiquetas de accesibilidad).

## 16.4 Resultados de pruebas

- Backend: 113 de 113 pruebas aprobadas (tres ejecuciones completas). Cobertura de sentencias del 62 % sobre el paquete de aplicación.
- Aceptación (muestra técnica contra la API): 28 de 28 aprobadas.
- Rendimiento: 900 solicitudes, 0 errores.
- Frontend: verificación estática y compilación de producción sin errores.
- Aplicación móvil: verificación estática (modo estricto) sin errores.
- Docker: ambos archivos Compose válidos; stack de desarrollo y stack de producción (en aislado) levantan correctamente.

## 16.5 Seguridad

Vulnerabilidades de dependencias del backend: 8 -> 1 (la restante no explotable). Frontend: 7 -> 6 (transitivas de compilación). Correcciones de configuración: CORS, clave de ejemplo, limitación de tasa activable, comprobaciones de salud, URL de imágenes, configuración de producción endurecida.

## 16.6 Rendimiento

Línea base básica establecida (Tabla 16). Sin objetivos de nivel de servicio acordados. Campaña de carga con herramienta especializada: NO EJECUTADA (plantilla preparada).

## 16.7 Infraestructura

Demo local verificada. Configuración de producción preparada y probada en aislado. Despliegue en un servidor de producción real: NO REALIZADO.

## 16.8 Documentación

Once documentos de proyecto en la carpeta de documentación, más los README y el CHANGELOG del backend corregidos y la documentación de arquitectura de variantes actualizada. Este documento consolida esa información en un texto académico único.

## 16.9 Estado de avance

TABLE:avance_estado

<!-- PAGEBREAK -->

# 17. CRITERIOS DE ENTREGA SENA

Se evaluaron los once criterios de entrega. El estado se expresa como CUMPLIDO, PARCIAL o NO CUMPLIDO (equivalentes a verde, amarillo y rojo, sin depender del color).

TABLE:criterios_sena

Resumen: 7 criterios CUMPLIDOS (1, 2, 4, 5, 7, 9, 10) y 4 PARCIALES (3, 6, 8, 11). Ningún criterio NO CUMPLIDO. El avance del entregable frente a los once criterios se estima en aproximadamente 85 % (promedio de los porcentajes de la tabla).

<!-- PAGEBREAK -->

# 18. PENDIENTES Y TRABAJO FUTURO

## 18.1 Pendientes técnicos

- Reverse proxy con TLS para el despliegue de producción (configuración dependiente del dominio).
- Almacén compartido para la limitación de tasa en escenarios de varias réplicas.
- Usuario y política de MinIO de mínimo privilegio.
- Inicialización de un registro estructurado y un monitor de errores.
- Corrección del texto de HU-004 y HU-025 en el documento de historias de usuario (la desviación ya está documentada).
- Actualización del README del frontend (hoy es la plantilla de Vite).

## 18.2 Pendientes de validación

- Validación funcional completa de las pantallas de comprador de la aplicación móvil (carrito, checkout, pedidos, billetera, direcciones), hoy en el árbol de trabajo.
- Tres comprobaciones de la prueba de restauración que requieren montar la aplicación completa sobre el entorno aislado.

## 18.3 Pendientes de aceptación

- Ejecución de la matriz de pruebas de aceptación con un usuario final operando la interfaz (REQUIERE VALIDACIÓN HUMANA).
- Captura de las evidencias de navegador (REQUIERE VALIDACIÓN HUMANA).

## 18.4 Pendientes de capacitación

- Realización de las sesiones de capacitación (comprador, empresa, administrador) con lista de asistencia y grabación (REQUIERE VALIDACIÓN HUMANA). El plan de capacitación está preparado.

## 18.5 Pendientes de despliegue

- Despliegue en un servidor de producción real con dominio y certificado (REQUIERE VALIDACIÓN HUMANA e infraestructura).
- Automatización de las copias de seguridad con `cron` o `systemd` y copia externa cifrada (REQUIERE el servidor de operación).

## 18.6 Mejoras futuras

- Integración continua que ejecute las pruebas y las verificaciones estáticas en cada cambio.
- Pruebas automatizadas en el frontend y en la aplicación móvil.
- Campaña de pruebas de carga con la herramienta k6 y definición de objetivos de nivel de servicio (plantilla preparada, NO EJECUTADA).
- Auditoría de accesibilidad con WCAG, axe o Lighthouse (NO REALIZADA).
- Verificador de tipos y linter para el backend Python.
- Fuente única para los códigos de error (hoy triplicados entre backend, web y móvil).
- Fragmentación del bundle del frontend por ruta.
- Empaquetado nativo de la aplicación móvil con EAS Build.
- Diagramas gráficos formales (entidad-relación, arquitectura, casos de uso).

Clasificación de los pendientes:

- Automatizables sin persona: integración continua, umbral de cobertura, `overrides` de vulnerabilidades transitivas del frontend, corrección del texto de historias de usuario, actualización del README del frontend, ejecución de k6, auditoría de accesibilidad con herramienta automática.
- Requieren intervención humana: pruebas de aceptación con usuario final, capturas de navegador, capacitación, firma del acta, despliegue real con TLS.
- Fuera del alcance comprometido: pago con dinero real, notificaciones push, chat comprador-empresa, módulo de devoluciones, cupones.

<!-- PAGEBREAK -->

# 19. ENTREGA Y ACEPTACIÓN

## 19.1 Pruebas con usuario final

Estado: PENDIENTE. NO se ha ejecutado una campaña formal de pruebas de aceptación con un usuario final. Lo ejecutado es una muestra técnica contra la API (28 de 28 comprobaciones) y la suite automatizada del backend (113 de 113). El plan completo con la matriz de casos está preparado en el plan de pruebas de aceptación.

## 19.2 Capacitación

Estado: NO REALIZADA. No existe evidencia de ninguna sesión de capacitación ejecutada. El plan de capacitación (temas, duración estimada, evidencia requerida) está preparado para las tres audiencias: comprador, empresa y administrador.

## 19.3 Evidencias

Las evidencias reproducibles generadas se encuentran en la carpeta `evidencias/` del repositorio, organizadas en: despliegue, pruebas, respaldo, seguridad, aceptación, rendimiento y hardware. Cada carpeta tiene un archivo que describe qué demuestra y cómo regenerarla. Las evidencias de navegador (capturas de la interfaz) están PENDIENTES de generación por requerir interacción manual.

## 19.4 Acta de entrega

El formato del acta está preparado en `docs/ACTA_ENTREGA_REHNIMARKET.md` e incluido en el ANEXO L. Está SIN DILIGENCIAR. Se completa y se firma el día de la entrega formal, después de ejecutar las pruebas de aceptación con el usuario final y realizar la capacitación.

## 19.5 Firmas

Estado: Pendiente de diligenciamiento y firma. NO se incluyen firmas, ni nombres de asistentes, ni fechas de sesiones, por no existir.

<!-- PAGEBREAK -->

# 20. CONCLUSIONES

Se construyó RehniMarket, una plataforma de comercio electrónico tipo marketplace compuesta por un backend de API REST con FastAPI, un frontend web con React y una aplicación móvil con Expo, con persistencia en PostgreSQL, almacenamiento de objetos en MinIO y contenerización con Docker Compose. El backend concentra toda la lógica de negocio y la autoridad sobre precios, stock, saldos, estados de pedido y permisos.

Se validó que el núcleo transaccional es correcto: la reserva de stock y el cobro de RehniCoin en el checkout se resuelven de forma atómica y consistente ante concurrencia, con una prueba automatizada que lo confirma. La suite de pruebas del backend, con 113 funciones, se ejecutó completa tres veces con resultado 113 de 113 y una cobertura de sentencias del 62 %. Una muestra técnica de 28 comprobaciones de aceptación contra la API real resultó 28 de 28. Se implementó y validó un mecanismo de respaldo y restauración coordinado de PostgreSQL y MinIO. La auditoría de dependencias del backend redujo las vulnerabilidades de 8 a 1, y la restante no es explotable con la configuración del proyecto. Se elaboró y probó una configuración de despliegue de producción endurecida.

El avance funcional del alcance principal (backend y web) supera el 95 %: 62 de 65 requisitos funcionales están completamente implementados. El avance del entregable frente a los once criterios de evaluación del SENA se estima en aproximadamente 85 %, con siete criterios cumplidos y cuatro parciales.

El proyecto tiene limitaciones que se documentan de forma explícita: no realiza pagos con dinero real; no se ha desplegado en un servidor de producción; la aplicación móvil no tiene empaquetado nativo; no hay pruebas automatizadas de cliente ni integración continua; y no se han ejecutado la campaña de pruebas de carga ni la auditoría de accesibilidad. Estas limitaciones no invalidan lo construido: corresponden a trabajo futuro con plantillas y procedimientos preparados.

Lo que impide declarar el entregable por encima del 90 % son actividades que requieren la participación de personas: la ejecución de las pruebas de aceptación con un usuario final, la capacitación y la firma del acta de entrega. El sistema NO está terminado al 100 %; su estado real es el de una plataforma funcionalmente completa en su alcance principal, con un núcleo transaccional probado, documentación consolidada y evidencia reproducible, a la que le faltan las actividades formales de entrega y algunas tareas de endurecimiento y validación identificadas y acotadas.

<!-- PAGEBREAK -->

# 21. RECOMENDACIONES

## 21.1 Recomendaciones técnicas

1. Definir siempre las variables `URL_FRONTEND` y `URL_BACKEND`, y generar una clave secreta real por entorno.
2. Para una publicación real, usar la configuración de producción entregada y añadir un reverse proxy con TLS; no publicar los puertos de PostgreSQL ni de MinIO.
3. Crear un usuario y una política de MinIO de mínimo privilegio limitados al bucket `uploads`.
4. Activar la limitación de tasa al menos para las rutas de autenticación en cualquier despliegue expuesto.
5. Evaluar la sustitución de `python-jose` por `pyjwt` para eliminar la dependencia transitiva vulnerable de `ecdsa`.

## 21.2 Recomendaciones de proceso y calidad

1. Montar una integración continua que ejecute la suite de pruebas del backend, la verificación estática del frontend y de la aplicación móvil, y las auditorías de dependencias en cada cambio.
2. Añadir pruebas automatizadas al frontend y a la aplicación móvil, empezando por carrito, checkout y autenticación.
3. Fijar un umbral mínimo de cobertura tras una segunda medición.
4. Ejecutar la campaña de pruebas de carga con la herramienta k6 y acordar los objetivos de nivel de servicio.
5. Realizar una auditoría de accesibilidad del frontend y un plan de correcciones.
6. Adoptar una convención de mensajes de commit y mantener una matriz de trazabilidad entre historias de usuario, endpoints y pruebas.

## 21.3 Recomendaciones de mantenimiento

1. Ejecutar el respaldo coordinado de PostgreSQL y MinIO de forma diaria y automatizada, con copia externa cifrada.
2. Ejecutar la prueba de restauración en un entorno aislado de forma mensual y tras cada cambio de esquema, dejando su evidencia.
3. Ejecutar la auditoría de dependencias antes de cada entrega.
4. Ejecutar la suite de pruebas del backend antes de cada cambio relevante.
5. Verificar la revisión de Alembic tras cada despliegue.
6. Consolidar la fuente de los códigos de error para evitar la desincronización entre backend, web y móvil.

<!-- PAGEBREAK -->

# 22. REFERENCIAS

Nota: la documentación del proyecto no contiene una sección de referencias bibliográficas formales. A continuación se listan las normas, marcos y documentación técnica efectivamente citados en el proyecto. Las referencias bibliográficas académicas con formato APA 7 completo quedan PENDIENTES de completar.

Normas y marcos de referencia citados:

- ISO/IEC 25010. Modelo de calidad de producto de software (usado como marco de evaluación en el informe de calidad).
- ISO/IEC 25000 (SQuaRE). Familia de normas de calidad de software (usada como marco de proceso de evaluación).
- CMMI (Capability Maturity Model Integration). Usado únicamente como referencia conceptual de madurez de prácticas.
- PSP (Personal Software Process). Disciplina de proceso individual, aplicada de forma retrospectiva.
- APA 7. Estilo de formato académico de referencia para este documento.

Documentación técnica de las tecnologías empleadas (referencia de uso, sin cita bibliográfica formal):

- FastAPI, Uvicorn, SQLAlchemy, Alembic, Pydantic, python-jose, passlib, MinIO SDK, uv (gestor de dependencias).
- React, Vite, TypeScript, TailwindCSS, react-router-dom, axios.
- Expo, Expo Router, React Native.
- PostgreSQL 17, MinIO, Docker, Docker Compose, Nginx.
- pip-audit, pytest, ESLint, k6.

Documentos internos del proyecto consolidados en este texto:

- Manual Técnico (`docs/MANUAL_TECNICO_REHNIMARKET.md`).
- Informe de Aseguramiento y Calidad (`docs/INFORME_CALIDAD_REHNIMARKET.md`).
- Bitácora PSP (`docs/BITACORA_PSP_REHNIMARKET.md`).
- Consolidado de Avance (`docs/CONSOLIDADO_AVANCE_REHNIMARKET.md`).
- Auditoría Final (`docs/AUDITORIA_FINAL_REHNIMARKET.md`).
- Documentación de Despliegue e Implantación (`docs/DOCUMENTACION_DESPLIEGUE_REHNIMARKET.md`).
- Plan de Migración de Datos y Respaldos (`docs/PLAN_MIGRACION_REHNIMARKET.md`).
- Plan de Pruebas de Aceptación (`docs/PLAN_PRUEBAS_ACEPTACION_REHNIMARKET.md`).
- Manual de Usuario Final (`docs/MANUAL_USUARIO_REHNIMARKET.md`).
- Historias de Usuario (`docs/RehniMarket-HU.md`).
- Requisitos Funcionales y No Funcionales (`docs/RehniMarket-Requisitos.docx`).
- Acta de Entrega (`docs/ACTA_ENTREGA_REHNIMARKET.md`).
- Arquitectura de Variantes y Atributos (`RehniMarket-backend/app/docs/ARQUITECTURA-VARIANTES.md`).
- Procedimiento de Auditoría de Dependencias (`RehniMarket-backend/app/docs/AUDITORIA.md`).
- README y CHANGELOG del backend (`RehniMarket-backend/README.md`, `RehniMarket-backend/CHANGELOG.md`).

<!-- PAGEBREAK -->

# ANEXO A — HISTORIAS DE USUARIO

Fuente: `docs/RehniMarket-HU.md`. Se listan las 29 historias con su enunciado resumido. El detalle completo con criterios de aceptación está en el archivo fuente.

TABLE:anexo_hu

<!-- PAGEBREAK -->

# ANEXO B — REQUISITOS FUNCIONALES

Fuente: `docs/RehniMarket-Requisitos.docx`. 65 requisitos funcionales.

TABLE:anexo_rf

<!-- PAGEBREAK -->

# ANEXO C — REQUISITOS NO FUNCIONALES

Fuente: `docs/RehniMarket-Requisitos.docx`. 31 requisitos no funcionales.

TABLE:anexo_rnf

<!-- PAGEBREAK -->

# ANEXO D — MATRIZ DE PRUEBAS

Fuente: `docs/PLAN_PRUEBAS_ACEPTACION_REHNIMARKET.md`. La matriz completa contiene aproximadamente 240 casos, organizados en: autenticación (20), catálogo (11), producto (9), carrito (16), checkout (15), pedidos (6), favoritos (6), reseñas (7), direcciones (5), RehniCoin (6), panel de empresa (16), panel de administración (22), infraestructura y API (11), casos negativos (42), pruebas responsive (16) y pruebas de integración (14).

Estado de ejecución: la matriz está elaborada. Se ejecutó una muestra técnica de 28 comprobaciones contra la API real (28 de 28 aprobadas) y la suite automatizada del backend (113 de 113). La ejecución de la matriz completa con un usuario final está PENDIENTE.

El detalle de cada caso (identificador, módulo, rol, canal, precondiciones, pasos, resultado esperado y evidencia sugerida) está en el archivo fuente.

<!-- PAGEBREAK -->

# ANEXO E — RESULTADOS DE PRUEBAS

## E.1 Suite del backend

Comando: ejecución de `pytest` en un contenedor efímero. Resultado (tres ejecuciones completas): `113 passed`. Tiempo de la última ejecución: 622,94 segundos. Cobertura de sentencias: 62 % (7516 sentencias, 2850 sin cubrir). Los avisos (783) son todos de la deprecación de `datetime.utcnow()`, sin efecto funcional. Evidencia: `evidencias/tests/pytest.txt`, `evidencias/tests/pytest-cov.txt`.

## E.2 Verificación estática del frontend

`tsc -b`: código de salida 0. `eslint .`: código de salida 0. `vite build`: compila correctamente; bundle principal de aproximadamente 730 kB, con aviso de fragmento mayor a 500 kB. Evidencia: `evidencias/tests/frontend-tsc-eslint.txt`.

## E.3 Verificación estática de la aplicación móvil

`tsc --noEmit` (modo estricto): código de salida 0. `eslint .`: código de salida 0, con 3 advertencias cosméticas. Evidencia: `evidencias/tests/mobile-lint.txt`.

## E.4 Muestra de aceptación

`scripts/acceptance_smoke.sh`: 28 comprobaciones, 28 aprobadas, 0 fallidas. Evidencia: `evidencias/acceptance/resultados.txt`. Comprobaciones aprobadas: registro (200); inicio de sesión sin verificar (400, `EMAIL_NOT_VERIFIED`); reenvío inmediato (429, `RESEND_COOLDOWN_ACTIVE`); verificación con código real (200); inicio de sesión (200 con token); credenciales inválidas (400, `INVALID_CREDENTIALS`); renovación (200 con nuevo token); `/cart` sin token (401); usuario hacia `/admin/dashboard/get-users` (403, `FORBIDDEN`); usuario hacia `/company/dashboard/me` (403); usuario hacia `/wallet/recharge` (403); catálogo (200, total 26); búsqueda 'audifono' (3 resultados, tolerante a tildes); ofertas (200); novedades (200); agregar sin variante (400, `VALIDATION_ERROR`); agregar al carrito (200); persistencia del carrito (1 línea); creación de dirección; checkout sin saldo (402, `INSUFFICIENT_BALANCE`, sin crear pedido); checkout con saldo (200, pedido creado, saldo descontado en 119, carrito vaciado); listado de pedidos (200); salud de la base (correcta); esquema de la API (200).

## E.5 Rendimiento

`scripts/perf_test.sh`: 900 solicitudes, 0 errores, 100 % de éxito. Detalle en la Tabla 16. Evidencia: `evidencias/performance/resultado.txt`.

## E.6 Autorización por rol

`evidencias/security/roles/roles_permisos.txt`: sin token, 401 en rutas protegidas; token de rol usuario, 200 en sus grupos permitidos y 403 en rutas de empresa, de administración y de acreditación de saldo; token inválido, 401.

<!-- PAGEBREAK -->

# ANEXO F — BITÁCORA PSP

Fuente: `docs/BITACORA_PSP_REHNIMARKET.md`. Se reproduce el registro de defectos. Recordatorio: el registro de tiempo no se llevó en vivo; los esfuerzos son estimación retrospectiva.

## F.1 Defectos de proceso

- D-01: `node_modules` versionado en Git (commit gigante); detectado en revisión de repositorio; corregido retroactivamente con `.gitignore`. CORREGIDO.
- D-02: mensajes de commit sin convención, imposible trazar historia a commit; detectado en la auditoría de calidad. ABIERTO (proceso).
- D-03: sin control de tiempo por fase (PSP no aplicado desde el inicio); detectado al elaborar la bitácora; mitigado con bitácora retrospectiva. ABIERTO (para el próximo proyecto).
- D-04: sin integración continua; detectado en la auditoría de calidad (H-10). ABIERTO.
- D-05: documentación de entrega comprimida en los últimos días; detectado en el post-mortem. MITIGADO.

## F.2 Defectos de código detectados y corregidos durante el desarrollo

- D-06: `NasService` hacía entrada y salida de red en la importación del módulo, lo que rompía la colección de `pytest`; detectado en pruebas; corregido moviéndolo al ciclo de vida. CORREGIDO.
- D-07: el código de verificación se creaba pero no se confirmaba en el inicio de sesión, por lo que la sesión de base lo revertía y el código enviado nunca coincidía; detectado en pruebas manuales; corregido confirmando antes de responder. CORREGIDO.
- D-08: reintentar el inicio de sesión de una cuenta no verificada regeneraba el código y reiniciaba el temporizador; detectado en pruebas manuales; corregido para regenerar solo si no hay código activo. CORREGIDO.
- D-09: reserva de stock no atómica en el checkout (condición de carrera en la última unidad); detectado en el diseño de las pruebas de concurrencia; corregido con actualización condicional, orden determinista, bloqueo de billetera y reversión total. CORREGIDO.

## F.3 Defectos de deuda y de auditoría

Corresponden a los hallazgos H-01 a H-18 del informe de calidad (Tabla 10). En esta entrega se corrigieron H-01, H-04, H-08, H-16, se hizo activable H-02, y se atendió parcialmente H-03 y H-17 (configuración de producción creada y probada).

## F.4 Resumen del registro

TABLE:psp_defectos

## F.5 Esfuerzo estimado por fase

TABLE:psp_esfuerzo

<!-- PAGEBREAK -->

# ANEXO G — AUDITORÍA DE CALIDAD

Fuente: `docs/INFORME_CALIDAD_REHNIMARKET.md`.

## G.1 Evaluación ISO/IEC 25010

TABLE:iso25010

## G.2 Hallazgos negativos

TABLE:hallazgos

## G.3 Plan de mejora continua

El informe de calidad define 27 acciones clasificadas en correctivas (10), preventivas (9) y mejoras futuras (8), cada una con identificador, acción, hallazgo que resuelve, prioridad, horizonte y estado. En esta entrega se cerraron aproximadamente 10 de ellas (CORS, URL de imágenes, clave de ejemplo, README y CHANGELOG, plantilla de entorno, comprobaciones de salud, respaldo y restauración, bitácora PSP, auditoría de dependencias, rendimiento básico, y configuración de producción). El resto permanece PENDIENTE con horizonte asignado. El detalle está en el archivo fuente, sección 13.

<!-- PAGEBREAK -->

# ANEXO H — EVIDENCIAS

Fuente: carpeta `evidencias/` del repositorio. Todas las evidencias son reproducibles con los comandos descritos en `evidencias/README.md`. No hay capturas de navegador (PENDIENTES de generación por requerir interacción manual).

TABLE:anexo_evidencias

<!-- PAGEBREAK -->

# ANEXO I — ARQUITECTURA

## I.1 Comunicación entre componentes (representación textual)

FIGURE:comunicacion

## I.2 Modelo entidad–relación (representación textual)

FIGURE:er

## I.3 Estructura del backend

```
app/
  main.py                Punto de entrada FastAPI. 24 routers.
  Config.py              Carga de variables de entorno.
  core/                  ErrorCodes (102 codigos), Exceptions, TaxConfig (IVA 19%), PayoutConfig (comision 5%).
  database/Connection.py Motor SQLAlchemy, SessionLocal, Base.
  middleware/            AuthMiddleware, CorsMiddleware, RateLimitMiddleware, RolePermissions, PublicRoutes.
  models/                28 modulos de modelo ORM (~36 tablas).
  repository/            Acceso a datos.
  routers/               24 routers REST.
  schemas/               Contratos Pydantic.
  services/              Logica de negocio (auth, commerce, dashboard, email, variants, pricing, PayoutService).
  utils/                 Security (bcrypt), seed, CheckNetwork, TestDatabase, Response.
alembic/versions/        10 migraciones en cadena lineal (29fe206320ce -> a1b2c3d4e5f6).
tests/                   7 archivos, 113 funciones de prueba.
```

## I.4 Cadena de migraciones

```
29fe206320ce (base)
  -> d72ef7fa597e   upgrade table product
  -> 048871b47f63   add catalog attributes
  -> a90540bebea    variant combinations and discounts
  -> b6f8fd31fbe     backfill legacy to attributes
  -> cb6d38ee0bd     order item attributes snapshot
  -> d4e5f6a7b8c9    advertisement drop text fields
  -> e7a1c9d24b30    shipping carriers and order shipping
  -> f2b7c4e91a05    product applies tax
  -> a1b2c3d4e5f6    product search fuzzy trgm   (HEAD)
```

## I.5 Endpoints principales por router

TABLE:endpoints

<!-- PAGEBREAK -->

# ANEXO J — BACKUP Y RESTAURACIÓN

Fuente: `docs/PLAN_MIGRACION_REHNIMARKET.md` y `evidencias/backup/`.

## J.1 Manifiesto del respaldo ejecutado

```
Identificador (TS): 2026-08-31_16-59
Fecha UTC        : 2026-08-31 16:59:18
PostgreSQL dump  : rehni_market_postgres_2026-08-31_16-59.dump  (220 KB)
  tablas con datos: 37
MinIO tar        : rehni_market_minio_2026-08-31_16-59.tar.gz   (8,5 MB)
  objetos        : 166
SHA-256 (PostgreSQL): ef85a1134687650c282da799d5983a725e56641c4d60ef528914edde58ed78bc
SHA-256 (MinIO)     : 8f8a0112ead75ff6a2421eb24c07808c4c8ec386ff335dbdf9ef9d8b3ebebc63
```

## J.2 Comandos

```
scripts/backup_rehnimarket.sh                 Respaldo coordinado (PostgreSQL + MinIO + SHA-256 + manifiesto + rotacion).
scripts/restore_rehnimarket.sh <TS>           Restauracion en entorno aislado desechable + validacion.
```

## J.3 Resultado de la prueba de restauración

TABLE:restore_resultado

## J.4 Objetivos de recuperación

RPO propuesto: 24 horas (respaldo diario). RTO propuesto para un servidor nuevo: 4 horas. RTO propuesto en el mismo servidor: menor o igual a 1 hora. Son OBJETIVOS PROPUESTOS, no métricas medidas: el ciclo backup y restauración de datos sobre el volumen actual tardó menos de 1 minuto el respaldo y aproximadamente 30 segundos la restauración de datos en el entorno aislado, sin contar el aprovisionamiento del servidor ni el transporte de la copia.

<!-- PAGEBREAK -->

# ANEXO K — CONFIGURACIÓN DE DESPLIEGUE

## K.1 Diferencias entre el Compose de desarrollo y el de producción

TABLE:compose_diferencias

## K.2 Uso de la configuración por defecto

Nota de normalización (posterior a este documento): la configuración endurecida
descrita aquí como `docker-compose.prod.yml` / `Dockerfile.prod` / `.env.prod` es
ahora la configuración **por defecto** (`docker-compose.yml`,
`RehniMarket-frontend/Dockerfile`, `RehniMarket-backend/.env`); el modo desarrollo
pasa a `docker-compose.dev.yml` / `Dockerfile.dev` / `.env.dev`. Se levanta sin `-f`.

```
cp RehniMarket-backend/.env.public.example RehniMarket-backend/.env   # y rellenar
VITE_API_URL=https://api.tu-dominio \
VITE_REHNIMARKET_WHATSAPP=573001234567 \
  docker compose build
docker compose up -d
# + configurar un reverse proxy con TLS (Caddy, Traefik o Nginx) delante:
#     https://tu-dominio      -> frontend:80
#     https://api.tu-dominio  -> 127.0.0.1:BACKEND_PORT
```

## K.3 Estado

La configuración se construyó y se levantó en un proyecto Compose aislado, verificando el arranque ordenado por comprobaciones de salud, la respuesta de la API y del SPA, la ausencia de puertos publicados en PostgreSQL y MinIO, y la publicación del backend solo en la interfaz de bucle local. El entorno de prueba se desmontó. El proyecto NO se ha desplegado en un servidor de producción real.

<!-- PAGEBREAK -->

# ANEXO L — ACTA DE ENTREGA

Fuente: `docs/ACTA_ENTREGA_REHNIMARKET.md`. Se reproduce el formato. ESTADO: SIN DILIGENCIAR. Se completa y se firma el día de la entrega formal, después de ejecutar las pruebas de aceptación con el usuario final, realizar la capacitación y adjuntar la carpeta de evidencias. NO se incluyen firmas, nombres de asistentes ni fechas de sesiones por no existir.

## L.1 Identificación

- Nombre del proyecto: RehniMarket — Plataforma de comercio electrónico tipo marketplace.
- Programa y trimestre: Tecnólogo en Análisis y Desarrollo de Software (ADSO) — Sexto trimestre.
- Institución: SENA.
- Repositorio: https://github.com/RehnieyAl/Rehni-Market.git
- Versión entregada: __________ (commit: __________).
- Fecha de entrega: ____ / ____ / 2026.
- Lugar: ______________________________.

## L.2 Entregables

Código fuente del backend, del frontend web y de la aplicación móvil; orquestación Docker de desarrollo y de producción; migraciones de base de datos; scripts de respaldo y restauración; plantilla de prueba de carga; documentación de despliegue e instalación; manual técnico; manual de usuario final; plan de migración y respaldos; plan de pruebas de aceptación; informe de aseguramiento y calidad; bitácora PSP; requisitos e historias de usuario; consolidado de avance; auditoría final; carpeta de evidencias; registro de capacitación (pendiente).

## L.3 Componentes entregados y estado

- Backend (API, PostgreSQL, MinIO): __________. Despliegue local reproducible; comprobaciones de salud configuradas.
- Frontend web: __________. Demo local con el servidor de desarrollo; se entrega además la configuración de producción con Nginx, probada en aislado; NO desplegado a un servidor de producción.
- Aplicación móvil: __________. Se ejecuta con Expo Go; sin empaquetado nativo.

## L.4 Pruebas de aceptación

- Muestra técnica contra la API: 28 de 28 aprobadas (`evidencias/acceptance/resultados.txt`).
- Suite automatizada del backend: 113 de 113 aprobadas (`evidencias/tests/pytest.txt`).
- Pruebas de aceptación con el usuario final: ejecutadas el ____ / ____ / 2026. Resultado: ____ casos aprobados de ____ ejecutados.
- Defectos abiertos al momento de la firma: críticos ____; altos ____; medios ____; bajos ____.

## L.5 Capacitación

- Comprador: fecha __________; asistentes __________; evidencia __________.
- Empresa: fecha __________; asistentes __________; evidencia __________.
- Administrador y Owner: fecha __________; asistentes __________; evidencia __________.

## L.6 Pendientes y trabajo futuro

Configuración de producción con reverse proxy TLS; empaquetado de la aplicación móvil; integración continua; pruebas de cliente; automatización del respaldo; campaña de carga y auditoría de accesibilidad. Detalle en la sección 18 de este documento y en la sección 13 del informe de calidad.

## L.7 Niveles de servicio acordados

RehniMarket no define objetivos de nivel de servicio cuantitativos de latencia o disponibilidad. La línea base de rendimiento medida está en `evidencias/performance/resultado.txt`. Los niveles aplicables al contexto académico se acuerdan en este punto: ______________________________.

## L.8 Declaración de aceptación

El usuario o instructor declara haber recibido los entregables, haber presenciado la ejecución de las pruebas de aceptación y la capacitación, y acepta el proyecto RehniMarket con los pendientes registrados.

- Responsable de la entrega: nombre ______________; rol: Desarrollador del proyecto; documento ______________; fecha ____ / ____ / 2026; firma ______________.
- Responsable de la recepción (usuario o instructor): nombre ______________; rol ______________; documento ______________; fecha ____ / ____ / 2026; firma ______________.

<!-- FIN DEL DOCUMENTO -->
