# Análisis de Requisitos — RehniMarket

> **Aviso sobre la estructura de este documento.** La instrucción recibida pide seguir "las secciones y reglas del prompt principal", pero ese prompt principal **no fue suministrado**: solo se recibió la sección "1. Recopilación de información y fuentes". La estructura de este archivo es, por tanto, una propuesta propia. El contenido (inventarios, trazabilidad y hallazgos) es independiente de la estructura y puede reorganizarse cuando se disponga del prompt principal.

## 1. Información general

| Campo | Valor |
|---|---|
| **Proyecto** | RehniMarket (marketplace que conecta empresas vendedoras con usuarios compradores) |
| **Documento** | Análisis consolidado de requisitos e historias de usuario |
| **Fecha de elaboración** | 2026-10-09 |
| **Integrantes** | Yeinher Jose algarin cardozo — *transcrito tal cual de la celda B2 de la hoja `RF` del Excel; ninguna otra fuente registra integrantes* |
| **Estado** | Borrador para validación |
| **Alcance** | Recopilación y contraste de fuentes documentales. No se modificó el Excel, las historias de usuario ni el código fuente. |

## 2. Fuentes consultadas

### 2.1 Fuentes principales

| # | Fuente | Ruta real en el repositorio | Método de lectura | Resultado |
|---|---|---|---|---|
| F1 | Historias de usuario | `docs/docs++/RehniMarket-HU.md` | Lectura directa completa (429 líneas) | Leída completa: 4 actores, 29 historias (HU-001 a HU-029), 121 criterios de aceptación, resumen de cobertura por 14 módulos. |
| F2 | Matriz de requisitos funcionales (Excel) | `docs/docs++/requisitos funcionales .xlsx` | Extracción del XML interno del `.xlsx` con Python estándar (`zipfile` + `xml.etree`); `openpyxl` no está instalado en el entorno. Se leyeron hojas, celdas, tablas, formas gráficas, hipervínculos e imagen. | Leída completa: 2 hojas (`RF` y `Registro de usuarios`). Contiene **1 requisito** y **1 historia de usuario** con 3 escenarios. |

Notas sobre la localización de las fuentes:

- El nombre real del Excel es `requisitos funcionales .xlsx`, **con un espacio antes de la extensión**. Es el único `.xlsx` de `docs/docs++` cuyo contenido es una matriz de requisitos funcionales; los otros (`Pruebas_Integracion_RehniMarket.xlsx`, `Plantilla_Pruebas_Integracion.xlsx`) son de pruebas de integración.
- `RehniMarket-HU.md` no está en la raíz ni en `docs/`, sino en `docs/docs++/`. Varios documentos del repositorio lo citan como `docs/RehniMarket-HU.md`, ruta que hoy no existe.
- El Excel y `Requisitos-Funcionales.md` figuran como archivos **sin seguimiento en git** (`??`) al momento del análisis.

### 2.2 Fuentes secundarias encontradas en el repositorio

| # | Fuente | Ruta | Método y alcance de la lectura | Contenido relevante |
|---|---|---|---|---|
| F3 | Especificación de Requisitos Funcionales (v1.0, 2026-10-09) | `docs/docs++/Requisitos-Funcionales.md` | Lectura directa completa (576 líneas) | 148 RF (RF-001 a RF-148) derivados de F1, 32 reglas de negocio (RN-001 a RN-032), 22 observaciones (OBS-001 a OBS-022), matriz de trazabilidad RF → HU → CA. |
| F4 | Requisitos funcionales y no funcionales (Word) | `docs/docs++/RehniMarket-Requisitos.docx` | Extracción del XML interno del `.docx` con Python estándar. Se procesaron las fichas de los 65 RF (nombre, módulo, actor, prioridad, HU, estado) y la matriz de trazabilidad; el resto del texto se revisó por secciones, no línea a línea. | 65 RF (RF-001 a RF-065) con ficha completa y endpoint, 31 RNF, matriz HU → RF → endpoint. |
| F5 | Evaluación de requisitos no funcionales | `docs/docs++/_fuentes_entregables/08_Requisitos_No_Funcionales.md` | Lectura de la tabla resumen y del índice de secciones; las fichas individuales no se leyeron en detalle. | 31 RNF (RNF-001 a RNF-031) con categoría y estado. |
| F6 | Plan de pruebas de aceptación | `docs/docs++/PLAN_PRUEBAS_ACEPTACION_REHNIMARKET.md` | Lectura solo de la sección 16 (Trazabilidad con requisitos). | Trazabilidad HU → casos de prueba e inconsistencias documentación/código INC-01 a INC-06. |
| F7 | Backlog histórico de historias de usuario | `Historia de usuario.md` (raíz) | Lectura parcial del encabezado desde `git show HEAD:`; el archivo está **eliminado en el árbol de trabajo** (borrado sin confirmar). | Backlog inicial HU-001 a HU-093, autodeclarado "NO vigente". No se usó como fuente de requisitos. |

### 2.3 Fuentes relacionadas no analizadas

Se localizaron pero **no se leyeron**, por lo que no se afirma nada sobre su contenido: `docs/docs++/Historia de usuario - lubix-update-2.2.docx` (versión anterior del proyecto, "Lubix"), `docs/docs++/REHNIMARKET_DOCUMENTO_FINAL.md/.docx`, `INFORME_CALIDAD_REHNIMARKET.md`, `MANUAL_TECNICO_REHNIMARKET.md`, `MANUAL_USUARIO_REHNIMARKET.md`, `CONSOLIDADO_AVANCE_REHNIMARKET.md` y `README_ENTREGABLES.md` (de estos dos últimos solo se consultaron las líneas que mencionan RF-065).

El código fuente no se auditó. Solo se hicieron comprobaciones puntuales para contrastar hallazgos concretos; cada una se indica en la sección 9 con el archivo consultado.

## 3. Convenciones de identificadores

Las fuentes usan **tres numeraciones `RF-` distintas que colisionan** y **tres numeraciones `HU-` distintas**. Para conservar los identificadores originales sin ambigüedad, en este documento cada identificador se cita con un prefijo de fuente. El prefijo no forma parte del identificador original.

| Prefijo | Fuente | Requisitos | Historias de usuario |
|---|---|---|---|
| `X:` | F2 — Excel `requisitos funcionales .xlsx` | `X:RF-01` | `X:HU-01` |
| `HU-nnn` (sin prefijo) | F1 — `RehniMarket-HU.md` | — | `HU-001` a `HU-029` |
| `M:` | F3 — `Requisitos-Funcionales.md` | `M:RF-001` a `M:RF-148` | usa la numeración de F1 |
| `D:` | F4 — `RehniMarket-Requisitos.docx` | `D:RF-001` a `D:RF-065` | `D:HU-001` a `D:HU-032` (numeración propia, ver 5.3) |

Ejemplo de la colisión: `X:RF-01` es "Registro de usuarios", `M:RF-001` es "Productos destacados en el Home" y `D:RF-001` es "Listar, filtrar, ordenar y buscar productos públicos".

"CA n" designa el criterio de aceptación número *n* de una historia, en el orden en que aparece en F1.

## 4. Actores

| Actor | Rol | Descripción | Fuente |
|---|---|---|---|
| Visitante | — | Navega sin sesión; explora el catálogo público, no compra ni accede a paneles privados. | F1 §2; F4 §3 |
| Usuario | `user` | Comprador autenticado: favoritos, carrito, compras, pedidos, reseñas y billetera RehniCoin. F4 añade reportes. | F1 §2; F4 §3 |
| Empresa | `company` | Cuenta vendedora: catálogo propio, pedidos recibidos e información financiera. F4 añade el envío de pedidos. | F1 §2; F4 §3 |
| Administrador | `admin` | Personal interno: usuarios, empresas, catálogo global, anuncios, liquidaciones y recargas. F4 añade transportadoras y reportes. | F1 §2; F4 §3 |
| Owner | `owner` | Capacidades de Administrador más la gestión exclusiva de cuentas con privilegios elevados. | F1 §2 y HU-029; F4 §3 |

F1 presenta Administrador y Owner en una sola fila; F3 y F4 los separan. El Excel (F2) solo menciona el actor genérico "usuario".

## 5. Inventario de historias de usuario

### 5.1 Historias de `RehniMarket-HU.md` (F1)

Fuente de todas las filas: `docs/docs++/RehniMarket-HU.md` §3. Los criterios de aceptación están redactados como casillas **sin marcar** (`- [ ]`); la fuente no registra prioridad, estimación ni estado de aceptación.

| ID | Título | Actor | Nº de CA | Módulo (F1 §4) |
|---|---|---|---|---|
| HU-001 | Explorar y buscar el catálogo público | Visitante | 6 | Catálogo público y búsqueda |
| HU-002 | Consultar el detalle de un producto | Visitante | 6 | Catálogo público y búsqueda |
| HU-003 | Consultar el perfil público de una empresa | Visitante | 3 | Catálogo público y búsqueda |
| HU-004 | Registrarme como comprador o como empresa | Visitante | 4 | Autenticación y cuenta |
| HU-005 | Verificar mi correo electrónico | Visitante recién registrado | 4 | Autenticación y cuenta |
| HU-006 | Iniciar sesión y recuperar mi contraseña | Visitante con cuenta registrada | 4 | Autenticación y cuenta |
| HU-007 | Regresar al contexto donde estaba después de iniciar sesión | Visitante | 5 | Autenticación y cuenta |
| HU-008 | Cerrar sesión | Usuario, Empresa o Administrador | 2 | Autenticación y cuenta |
| HU-009 | Gestionar mi cuenta personal | Usuario, Empresa o Administrador | 4 | Autenticación y cuenta |
| HU-010 | Gestionar mis productos favoritos | Usuario | 7 | Favoritos |
| HU-011 | Gestionar mi carrito de compras | Usuario | 5 | Carrito y compra |
| HU-012 | Completar una compra | Usuario | 6 | Carrito y compra |
| HU-013 | Consultar y cancelar mis pedidos | Usuario | 3 | Pedidos |
| HU-014 | Escribir una reseña de un producto comprado | Usuario | 5 | Reseñas y calificaciones |
| HU-015 | Consultar mi saldo y movimientos de RehniCoins | Usuario | 3 | RehniCoins |
| HU-016 | Solicitar una recarga de RehniCoins | Usuario | 4 | RehniCoins |
| HU-017 | Gestionar mis direcciones de envío | Usuario | 3 | Direcciones |
| HU-018 | Gestionar el perfil de mi empresa | Empresa | 3 | Empresa (perfil y productos) |
| HU-019 | Publicar y gestionar mis productos | Empresa | 7 | Empresa (perfil y productos) |
| HU-020 | Gestionar los pedidos que recibo | Empresa | 4 | Pedidos |
| HU-021 | Gestionar mi información financiera y cuentas bancarias | Empresa | 4 | Finanzas de empresa |
| HU-022 | Gestionar cuentas de usuario | Administrador | 5 | Administración de usuarios y empresas |
| HU-023 | Gestionar empresas registradas | Administrador | 3 | Administración de usuarios y empresas |
| HU-024 | Gestionar el catálogo de la plataforma | Administrador | 3 | Catálogo administrativo y anuncios |
| HU-025 | Gestionar los anuncios del Home | Administrador | 3 | Catálogo administrativo y anuncios |
| HU-026 | Generar y administrar liquidaciones a empresas | Administrador | 5 | Liquidaciones |
| HU-027 | Recargar el saldo de RehniCoins de un usuario | Administrador | 4 | RehniCoins |
| HU-028 | Consultar el panel de estadísticas de la plataforma | Administrador | 2 | Panel administrativo |
| HU-029 | Administrar cuentas con privilegios elevados (exclusivo Owner) | Owner | 4 | Administración de usuarios y empresas |

**Total: 29 historias y 121 criterios de aceptación.** El texto completo de cada historia ("Como / Quiero / Para") y de sus criterios permanece en F1 y no se duplica aquí.

### 5.2 Historia de usuario del Excel (F2)

Fuente: hoja `Registro de usuarios` de `requisitos funcionales .xlsx`.

| Campo | Contenido literal | Celda |
|---|---|---|
| Título de la hoja | RF-01 REGISTRO DE USUARIOS | A1 |
| Historia de usuario | Como usuario, quiero registrarme e iniciar sesión con mis credenciales para acceder a las funcionalidades personalizadas del sistema. | A7 |
| Identificador de la historia | HU-01 — no está en ninguna celda: aparece como texto de una forma gráfica en la hoja `RF`, con hipervínculo hacia esta hoja | Forma en `RF`, fila 6 |

Escenarios (tabla `Tabla2`, rango A9:D12):

| # Escenario | Dado que (Contexto) | Cuando (Evento) | Entonces (Resultado esperado) |
|---|---|---|---|
| 1 | El usuario ingresa un correo y contraseña válidos | Hace clic en "Iniciar sesión" | El sistema permite el acceso al inventario. |
| 2 | El usuario deja campos vacíos | Intenta registrarse | El sistema muestra los campos obligatorios. |
| 3 | El correo ya existe | Intenta registrarse | El sistema informa que el correo ya está registrado. |

### 5.3 Otras numeraciones de historias de usuario detectadas

**Numeración del `.docx` (F4).** F4 declara que referencia las HU de `RehniMarket-HU.md`, pero cita identificadores hasta `HU-032` y asocia `HU-018` a Reportes y `HU-027` a Transportadoras, lo que no coincide con F1. Comparando módulos y títulos de los RF se **infiere** (no está documentado en ninguna fuente) que F4 fue escrito contra una versión de las historias con 32 entradas:

| HU citada en F4 | Tema según los RF de F4 | Equivalente inferido en F1 |
|---|---|---|
| D:HU-001 a D:HU-017 | Mismos temas que F1 | HU-001 a HU-017 |
| D:HU-018 | Crear reporte de producto o empresa | **Sin equivalente** |
| D:HU-019 a D:HU-026 | Perfil de empresa, productos, pedidos recibidos, finanzas, usuarios, empresas, catálogo, anuncios | HU-018 a HU-025 (desplazadas en 1) |
| D:HU-027 | Catálogo de transportadoras | **Sin equivalente** |
| D:HU-028 | Consultar y gestionar reportes (administración) | **Sin equivalente** |
| D:HU-029 | Liquidaciones | HU-026 |
| D:HU-030 | Recarga de RehniCoins por administrador | HU-027 |
| D:HU-031 | Panel de estadísticas | HU-028 |
| D:HU-032 | Gestión exclusiva de cuentas Owner | HU-029 |

No se localizó en el repositorio el documento de 32 historias al que corresponde esa numeración.

**Backlog histórico (F7).** `Historia de usuario.md` usaba una tercera numeración (HU-001 a HU-093) y se declaraba a sí mismo no vigente. No se incorpora al inventario.

## 6. Inventario de requisitos funcionales

### 6.1 Requisitos del Excel (F2)

Fuente: hoja `RF` de `requisitos funcionales .xlsx`, tabla `Tabla1` (rango A5:C25), título "MATRIZ DE REQUISITOS FUNCIONALES".

| ID original | NOMBRE DEL REQUISITO | DESCRIPCION | HISTORIA DE USUARIO | Fila |
|---|---|---|---|---|
| X:RF-01 | Registro de usuarios | Permite a los nuevos usuarios crear una cuenta en el sistema mediante el ingreso de sus datos personales (nombre, correo electrónico y contraseña). El sistema valida la información, garantiza que el correo sea único y almacena las credenciales de forma segura para permitir el acceso a la plataforma. | HU-01 (forma gráfica con hipervínculo a la hoja `Registro de usuarios`) | 6 |

- La matriz no tiene columna de identificador: `RF-01` solo aparece en el título de la hoja de detalle (celda A1 de `Registro de usuarios`).
- La tabla está dimensionada para 20 requisitos (filas 6 a 25) y **solo la fila 6 tiene contenido**.
- En la fila 7, vacía, hay una segunda forma gráfica con el texto "HU-01" y sin hipervínculo.
- La matriz no registra prioridad, actor, módulo ni estado.

### 6.2 Requisitos de `Requisitos-Funcionales.md` (F3)

Fuente: `docs/docs++/Requisitos-Funcionales.md` §5. Los 148 requisitos tienen prioridad "Por definir" (F3, OBS-001) y la fuente declara expresamente que no afirma su implementación ni su prueba (F3, OBS-002). La descripción completa de cada requisito ("El sistema debe…") permanece en F3.

| ID original | Módulo | Nombre | HU asociada | Criterio de aceptación (fuente) |
|---|---|---|---|---|
| M:RF-001 | Catálogo público y búsqueda | Productos destacados en el Home | HU-001 | HU-001, CA 1 |
| M:RF-002 | Catálogo público y búsqueda | Categorías disponibles en el Home | HU-001 | HU-001, CA 1 |
| M:RF-003 | Catálogo público y búsqueda | Listado completo de productos | HU-001 | HU-001, CA 2 |
| M:RF-004 | Catálogo público y búsqueda | Filtrado del listado de productos | HU-001 | HU-001, CA 2 |
| M:RF-005 | Catálogo público y búsqueda | Ordenamiento del listado | HU-001 | HU-001, CA 3 |
| M:RF-006 | Catálogo público y búsqueda | Búsqueda de productos por nombre | HU-001 | HU-001, CA 4 |
| M:RF-007 | Catálogo público y búsqueda | Visualización de anuncios en el Home | HU-001; HU-025 | HU-001, CA 5; HU-025, CA 3 |
| M:RF-008 | Catálogo público y búsqueda | Datos de catálogo provenientes de la fuente real | HU-001 | HU-001, CA 6 |
| M:RF-009 | Catálogo público y búsqueda | Acceso al detalle de producto desde cualquier listado | HU-002 | HU-002, CA 1 |
| M:RF-010 | Catálogo público y búsqueda | Información comercial del producto | HU-002 | HU-002, CA 2 |
| M:RF-011 | Catálogo público y búsqueda | Calificación del producto en el detalle | HU-002 | HU-002, CA 2 |
| M:RF-012 | Catálogo público y búsqueda | Galería de imágenes del producto | HU-002 | HU-002, CA 3 |
| M:RF-013 | Catálogo público y búsqueda | Selección de variante de color en el detalle | HU-002 | HU-002, CA 3 |
| M:RF-014 | Catálogo público y búsqueda | Stock disponible en el detalle | HU-002 | HU-002, CA 4 |
| M:RF-015 | Catálogo público y búsqueda | Opiniones de compradores en el detalle | HU-002 | HU-002, CA 4 |
| M:RF-016 | Catálogo público y búsqueda | Datos del vendedor y acceso a su perfil | HU-002 | HU-002, CA 5 |
| M:RF-017 | Catálogo público y búsqueda | Posición inicial del detalle de producto | HU-002 | HU-002, CA 6 |
| M:RF-018 | Catálogo público y búsqueda | Acceso al perfil público de la empresa | HU-003 | HU-003, CA 1 |
| M:RF-019 | Catálogo público y búsqueda | Identidad y verificación en el perfil de empresa | HU-003 | HU-003, CA 2 |
| M:RF-020 | Catálogo público y búsqueda | Calificación agregada de la empresa | HU-003 | HU-003, CA 2 |
| M:RF-021 | Catálogo público y búsqueda | Catálogo paginado de la empresa | HU-003 | HU-003, CA 3 |
| M:RF-022 | Autenticación y cuenta | Registro de cuenta de comprador | HU-004 | HU-004, CA 1 |
| M:RF-023 | Autenticación y cuenta | Registro de cuenta de empresa | HU-004 | HU-004, CA 2 |
| M:RF-024 | Autenticación y cuenta | Cuenta pendiente de verificación de correo | HU-004; HU-005 | HU-004, CA 3; HU-005, CA 4 |
| M:RF-025 | Autenticación y cuenta | Certificación pendiente de la empresa recién registrada | HU-004 | HU-004, CA 4 |
| M:RF-026 | Autenticación y cuenta | Ocultamiento público de la condición de empresa verificada | HU-004; HU-023 | HU-004, CA 4; HU-023, CA 2 |
| M:RF-027 | Autenticación y cuenta | Envío del código de verificación de correo | HU-005 | HU-005, CA 1 |
| M:RF-028 | Autenticación y cuenta | Verificación de la cuenta mediante código | HU-005 | HU-005, CA 2 |
| M:RF-029 | Autenticación y cuenta | Corrección del correo y reenvío del código | HU-005 | HU-005, CA 3 |
| M:RF-030 | Autenticación y cuenta | Rechazo informado del acceso sin verificar | HU-005 | HU-005, CA 4 |
| M:RF-031 | Autenticación y cuenta | Inicio de sesión con correo y contraseña | HU-006 | HU-006, CA 1 |
| M:RF-032 | Autenticación y cuenta | Solicitud de código de recuperación de contraseña | HU-006 | HU-006, CA 2 |
| M:RF-033 | Autenticación y cuenta | Definición de nueva contraseña con código | HU-006 | HU-006, CA 2 |
| M:RF-034 | Autenticación y cuenta | Mensaje de credenciales inválidas sin discriminar el dato | HU-006 | HU-006, CA 3 |
| M:RF-035 | Autenticación y cuenta | Destino por defecto tras iniciar sesión | HU-006; HU-007 | HU-006, CA 4; HU-007, CA 3 |
| M:RF-036 | Autenticación y cuenta | Redirección al inicio de sesión ante acciones protegidas | HU-007; HU-010; HU-011; HU-012 | HU-007, CA 1; HU-010, CA 6; HU-011, CA 5; HU-012, CA 6 |
| M:RF-037 | Autenticación y cuenta | Retorno a la pantalla de origen tras autenticarse | HU-007; HU-010; HU-011; HU-012 | HU-007, CA 2; HU-010, CA 6; HU-011, CA 5; HU-012, CA 6 |
| M:RF-038 | Autenticación y cuenta | Retorno tras expiración de la sesión | HU-007 | HU-007, CA 4 |
| M:RF-039 | Autenticación y cuenta | Precedencia de la verificación de correo sobre el retorno | HU-007 | HU-007, CA 5 |
| M:RF-040 | Autenticación y cuenta | Precedencia de la autorización por rol sobre el retorno | HU-007 | HU-007, CA 5 |
| M:RF-041 | Autenticación y cuenta | Cierre de sesión | HU-008 | HU-008, CA 1 |
| M:RF-042 | Autenticación y cuenta | Invalidación del acceso tras cerrar sesión | HU-008 | HU-008, CA 2 |
| M:RF-043 | Autenticación y cuenta | Consulta de los datos de la cuenta | HU-009 | HU-009, CA 1 |
| M:RF-044 | Autenticación y cuenta | Actualización de los datos de la cuenta | HU-009 | HU-009, CA 2 |
| M:RF-045 | Autenticación y cuenta | Cambio de contraseña | HU-009 | HU-009, CA 3 |
| M:RF-046 | Autenticación y cuenta | Propagación inmediata de los cambios de cuenta | HU-009 | HU-009, CA 4 |
| M:RF-047 | Favoritos | Marcar un producto como favorito | HU-010 | HU-010, CA 1 |
| M:RF-048 | Favoritos | Persistencia de los favoritos en el servidor | HU-010 | HU-010, CA 2 y CA 3 |
| M:RF-049 | Favoritos | Quitar un producto de favoritos | HU-010 | HU-010, CA 4 |
| M:RF-050 | Favoritos | Listado de favoritos del Usuario | HU-010 | HU-010, CA 5 |
| M:RF-051 | Favoritos | Sincronización del estado de favorito entre pantallas | HU-010 | HU-010, CA 5 |
| M:RF-052 | Favoritos | Restricción de favoritos al rol Usuario | HU-010 | HU-010, CA 7 |
| M:RF-053 | Carrito y compra | Agregar un producto al carrito | HU-011 | HU-011, CA 1 |
| M:RF-054 | Carrito y compra | Ajuste de cantidades limitado por el stock | HU-011 | HU-011, CA 2 |
| M:RF-055 | Carrito y compra | Quitar un producto del carrito | HU-011 | HU-011, CA 3 |
| M:RF-056 | Carrito y compra | Vaciar el carrito | HU-011 | HU-011, CA 3 |
| M:RF-057 | Carrito y compra | Subtotal del carrito | HU-011 | HU-011, CA 4 |
| M:RF-058 | Carrito y compra | Dirección de envío obligatoria para comprar | HU-012 | HU-012, CA 1 |
| M:RF-059 | Carrito y compra | Cálculo del total de la compra | HU-012 | HU-012, CA 2 |
| M:RF-060 | Carrito y compra | Pago con saldo de RehniCoins | HU-012 | HU-012, CA 2 |
| M:RF-061 | Carrito y compra | Bloqueo de la compra por saldo insuficiente | HU-012 | HU-012, CA 3 |
| M:RF-062 | Carrito y compra | Bloqueo de la compra por stock insuficiente | HU-012 | HU-012, CA 4 |
| M:RF-063 | Carrito y compra | Generación de pedidos por empresa vendedora | HU-012 | HU-012, CA 5 |
| M:RF-064 | Carrito y compra | Vaciado del carrito tras la compra | HU-012 | HU-012, CA 5 |
| M:RF-065 | Carrito y compra | Descuento del saldo tras la compra | HU-012 | HU-012, CA 5 |
| M:RF-066 | Pedidos | Listado de pedidos del Usuario | HU-013 | HU-013, CA 1 |
| M:RF-067 | Pedidos | Detalle de un pedido del Usuario | HU-013 | HU-013, CA 1 |
| M:RF-068 | Pedidos | Cancelación de pedido por el Usuario | HU-013 | HU-013, CA 2 |
| M:RF-069 | Pedidos | Inmutabilidad de los estados finales del pedido | HU-013; HU-020 | HU-013, CA 3; HU-020, CA 4 |
| M:RF-070 | Pedidos | Listado de pedidos de la Empresa | HU-020 | HU-020, CA 1 |
| M:RF-071 | Pedidos | Detalle de un pedido para la Empresa | HU-020 | HU-020, CA 2 |
| M:RF-072 | Pedidos | Avance del estado del pedido por la Empresa | HU-020 | HU-020, CA 3 |
| M:RF-073 | Pedidos | Cancelación de pedido por la Empresa | HU-020 | HU-020, CA 3 |
| M:RF-074 | Reseñas y calificaciones | Reseña condicionada a pedido entregado | HU-014 | HU-014, CA 1 |
| M:RF-075 | Reseñas y calificaciones | Registro de calificación y comentario | HU-014 | HU-014, CA 2 |
| M:RF-076 | Reseñas y calificaciones | Límite de una reseña por producto | HU-014 | HU-014, CA 3 |
| M:RF-077 | Reseñas y calificaciones | Eliminación de la propia reseña | HU-014 | HU-014, CA 4 |
| M:RF-078 | Reseñas y calificaciones | Recálculo de la calificación promedio | HU-014 | HU-014, CA 5 |
| M:RF-079 | RehniCoins | Consulta del saldo de RehniCoins | HU-015 | HU-015, CA 1 |
| M:RF-080 | RehniCoins | Historial de movimientos de la billetera | HU-015 | HU-015, CA 2 |
| M:RF-081 | RehniCoins | Origen del saldo y de los movimientos | HU-015 | HU-015, CA 3 |
| M:RF-082 | RehniCoins | Selección de la cantidad a recargar | HU-016 | HU-016, CA 1 |
| M:RF-083 | RehniCoins | Canalización de la solicitud de recarga por WhatsApp | HU-016 | HU-016, CA 2 |
| M:RF-084 | RehniCoins | No acreditación automática por la solicitud | HU-016 | HU-016, CA 3 |
| M:RF-085 | RehniCoins | Aviso por número de WhatsApp no configurado | HU-016 | HU-016, CA 4 |
| M:RF-086 | RehniCoins | Recarga manual del saldo de un Usuario | HU-027 | HU-027, CA 1 |
| M:RF-087 | RehniCoins | Restricción de la acreditación de saldo por rol | HU-027 | HU-027, CA 2 |
| M:RF-088 | RehniCoins | Historial de recargas realizadas | HU-027 | HU-027, CA 3 |
| M:RF-089 | RehniCoins | Disponibilidad inmediata del saldo recargado | HU-027 | HU-027, CA 4 |
| M:RF-090 | Direcciones | Registro de direcciones de envío | HU-017 | HU-017, CA 1 |
| M:RF-091 | Direcciones | Edición de una dirección de envío | HU-017 | HU-017, CA 2 |
| M:RF-092 | Direcciones | Eliminación de una dirección de envío | HU-017 | HU-017, CA 2 |
| M:RF-093 | Direcciones | Dirección predeterminada y su preselección | HU-017 | HU-017, CA 3 |
| M:RF-094 | Empresa (perfil y productos) | Consulta del perfil comercial | HU-018 | HU-018, CA 1 |
| M:RF-095 | Empresa (perfil y productos) | Actualización del perfil comercial | HU-018 | HU-018, CA 1 |
| M:RF-096 | Empresa (perfil y productos) | Actualización de logo y banner | HU-018 | HU-018, CA 2 |
| M:RF-097 | Empresa (perfil y productos) | Consulta del estado de verificación | HU-018 | HU-018, CA 3 |
| M:RF-098 | Empresa (perfil y productos) | Estado de verificación no modificable por la Empresa | HU-018 | HU-018, CA 3 |
| M:RF-099 | Empresa (perfil y productos) | Creación de un producto | HU-019 | HU-019, CA 1 |
| M:RF-100 | Empresa (perfil y productos) | Descuento sobre un producto | HU-019 | HU-019, CA 2 |
| M:RF-101 | Empresa (perfil y productos) | Edición de un producto | HU-019 | HU-019, CA 3 |
| M:RF-102 | Empresa (perfil y productos) | Visibilidad pública del producto | HU-019 | HU-019, CA 4 |
| M:RF-103 | Empresa (perfil y productos) | Eliminación de un producto | HU-019 | HU-019, CA 4 |
| M:RF-104 | Empresa (perfil y productos) | Creación de variantes de color | HU-019 | HU-019, CA 5 |
| M:RF-105 | Empresa (perfil y productos) | Edición de una variante | HU-019 | HU-019, CA 6 |
| M:RF-106 | Empresa (perfil y productos) | Eliminación de una variante | HU-019 | HU-019, CA 6 |
| M:RF-107 | Empresa (perfil y productos) | Gestión exclusiva por la empresa propietaria | HU-019 | HU-019, CA 7 |
| M:RF-108 | Finanzas de empresa | Registro de cuentas bancarias | HU-021 | HU-021, CA 1 |
| M:RF-109 | Finanzas de empresa | Cuenta bancaria predeterminada | HU-021 | HU-021, CA 1 |
| M:RF-110 | Finanzas de empresa | Edición de una cuenta bancaria | HU-021 | HU-021, CA 2 |
| M:RF-111 | Finanzas de empresa | Eliminación de una cuenta bancaria | HU-021 | HU-021, CA 2 |
| M:RF-112 | Finanzas de empresa | Consulta del balance disponible | HU-021 | HU-021, CA 3 |
| M:RF-113 | Finanzas de empresa | Consulta del historial de liquidaciones | HU-021 | HU-021, CA 3 |
| M:RF-114 | Finanzas de empresa | Cuenta bancaria predeterminada requerida para liquidar | HU-021; HU-026 | HU-021, CA 4; HU-026, CA 5 |
| M:RF-115 | Administración de usuarios y empresas | Listado de usuarios registrados | HU-022 | HU-022, CA 1 |
| M:RF-116 | Administración de usuarios y empresas | Detalle de una cuenta de usuario | HU-022 | HU-022, CA 1 |
| M:RF-117 | Administración de usuarios y empresas | Actualización de una cuenta de usuario | HU-022 | HU-022, CA 2 |
| M:RF-118 | Administración de usuarios y empresas | Cambio de estado de una cuenta | HU-022 | HU-022, CA 2 |
| M:RF-119 | Administración de usuarios y empresas | Eliminación de una cuenta | HU-022 | HU-022, CA 3 |
| M:RF-120 | Administración de usuarios y empresas | Restricción del Administrador frente al rol Owner | HU-022; HU-029 | HU-022, CA 4; HU-029, CA 1 y CA 2 |
| M:RF-121 | Administración de usuarios y empresas | Prohibición de eliminar cuentas Owner | HU-022; HU-029 | HU-022, CA 5; HU-029, CA 3 |
| M:RF-122 | Administración de usuarios y empresas | Listado de empresas registradas | HU-023 | HU-023, CA 1 |
| M:RF-123 | Administración de usuarios y empresas | Detalle de una empresa registrada | HU-023 | HU-023, CA 1 |
| M:RF-124 | Administración de usuarios y empresas | Aprobación o rechazo de la certificación de una empresa | HU-023 | HU-023, CA 2 |
| M:RF-125 | Administración de usuarios y empresas | Activación o desactivación de la cuenta de una empresa | HU-023 | HU-023, CA 3 |
| M:RF-126 | Administración de usuarios y empresas | Asignación del rol Owner reservada al Owner | HU-029 | HU-029, CA 1 |
| M:RF-127 | Administración de usuarios y empresas | Administración de cuentas Owner reservada al Owner | HU-029 | HU-029, CA 2 |
| M:RF-128 | Administración de usuarios y empresas | Alcance de capacidades del rol Owner | HU-029 | HU-029, CA 4; §2 — Actores |
| M:RF-129 | Catálogo administrativo y anuncios | Creación de categorías de productos | HU-024 | HU-024, CA 1 |
| M:RF-130 | Catálogo administrativo y anuncios | Edición de categorías de productos | HU-024 | HU-024, CA 1 |
| M:RF-131 | Catálogo administrativo y anuncios | Activación o desactivación de categorías | HU-024 | HU-024, CA 1 |
| M:RF-132 | Catálogo administrativo y anuncios | Eliminación de categorías de productos | HU-024 | HU-024, CA 1 |
| M:RF-133 | Catálogo administrativo y anuncios | Definición de especificaciones por categoría | HU-024 | HU-024, CA 2 |
| M:RF-134 | Catálogo administrativo y anuncios | Creación de colores para variantes | HU-024 | HU-024, CA 3 |
| M:RF-135 | Catálogo administrativo y anuncios | Edición de colores para variantes | HU-024 | HU-024, CA 3 |
| M:RF-136 | Catálogo administrativo y anuncios | Eliminación de colores para variantes | HU-024 | HU-024, CA 3 |
| M:RF-137 | Catálogo administrativo y anuncios | Creación de un anuncio | HU-025 | HU-025, CA 1 |
| M:RF-138 | Catálogo administrativo y anuncios | Edición de un anuncio | HU-025 | HU-025, CA 2 |
| M:RF-139 | Catálogo administrativo y anuncios | Activación o desactivación de un anuncio | HU-025 | HU-025, CA 2 y CA 3 |
| M:RF-140 | Catálogo administrativo y anuncios | Eliminación de un anuncio | HU-025 | HU-025, CA 2 |
| M:RF-141 | Liquidaciones | Generación de una liquidación | HU-026 | HU-026, CA 1 |
| M:RF-142 | Liquidaciones | Vista previa de una liquidación | HU-026 | HU-026, CA 2 |
| M:RF-143 | Liquidaciones | Listado de liquidaciones generadas | HU-026 | HU-026, CA 3 |
| M:RF-144 | Liquidaciones | Marcado de una liquidación como pagada | HU-026 | HU-026, CA 4 |
| M:RF-145 | Liquidaciones | Bloqueo del remarcado de una liquidación pagada | HU-026 | HU-026, CA 4 |
| M:RF-146 | Panel administrativo | Estadísticas generales de la plataforma | HU-028 | HU-028, CA 1 |
| M:RF-147 | Panel administrativo | Consulta de la actividad reciente | HU-028 | HU-028, CA 2 |
| M:RF-148 | Panel administrativo | Consulta de los usuarios más recientes | HU-028 | HU-028, CA 2 |

### 6.3 Requisitos de `RehniMarket-Requisitos.docx` (F4)

Fuente: `docs/docs++/RehniMarket-Requisitos.docx` §4. Las HU se muestran **con la numeración propia del `.docx`** (ver 5.3 para su equivalencia). La columna "Estado declarado" es lo que afirma F4, no una verificación hecha en este análisis.

| ID original | Nombre | Módulo | Actor(es) | Prioridad | HU citada (numeración del .docx) | Estado declarado |
|---|---|---|---|---|---|---|
| D:RF-001 | Listar, filtrar, ordenar y buscar productos públicos | Catálogo público | Visitante, Usuario | Alta | HU-001 | Implementado |
| D:RF-002 | Consultar productos del día | Catálogo público | Visitante, Usuario | Media | HU-001 | Implementado |
| D:RF-003 | Consultar categorías activas | Catálogo público | Visitante, Usuario, Empresa | Alta | HU-001 | Implementado |
| D:RF-004 | Consultar anuncios activos del Home | Catálogo público | Visitante, Usuario | Media | HU-001 | Implementado |
| D:RF-005 | Consultar detalle público de un producto | Catálogo público | Visitante, Usuario | Alta | HU-002 | Implementado |
| D:RF-006 | Consultar especificaciones de una categoría | Catálogo público | Visitante, Usuario, Empresa | Media | HU-002 | Implementado |
| D:RF-007 | Consultar reseñas públicas de un producto | Catálogo público | Visitante, Usuario | Media | HU-002 | Implementado |
| D:RF-008 | Consultar perfil público de una empresa | Catálogo público | Visitante, Usuario | Media | HU-003 | Implementado |
| D:RF-009 | Consultar productos de una empresa | Catálogo público | Visitante, Usuario | Media | HU-003 | Implementado |
| D:RF-010 | Consultar calificación de una empresa | Catálogo público | Visitante, Usuario | Media | HU-003 | Implementado |
| D:RF-011 | Registrar cuenta de usuario | Autenticación y cuenta | Visitante | Alta | HU-004 | Implementado |
| D:RF-012 | Registrar cuenta de empresa | Autenticación y cuenta | Visitante | Alta | HU-004 | Implementado |
| D:RF-013 | Verificar correo electrónico | Autenticación y cuenta | Visitante | Alta | HU-005 | Implementado |
| D:RF-014 | Corregir correo antes de verificar la cuenta | Autenticación y cuenta | Visitante | Media | HU-005 | Implementado |
| D:RF-015 | Iniciar sesión | Autenticación y cuenta | Visitante | Alta | HU-006 | Implementado |
| D:RF-016 | Recuperar contraseña por código enviado al correo | Autenticación y cuenta | Visitante | Alta | HU-006 | Implementado |
| D:RF-017 | Renovar sesión mediante refresh token | Autenticación y cuenta | Usuario, Empresa, Administrador, Owner | Alta | HU-007 | Implementado |
| D:RF-018 | Consultar y actualizar mi cuenta | Autenticación y cuenta | Usuario, Empresa, Administrador, Owner | Media | HU-009 | Implementado |
| D:RF-019 | Cerrar sesión | Autenticación y cuenta | Usuario, Empresa, Administrador, Owner | Media | HU-008 | Implementado |
| D:RF-020 | Gestionar productos favoritos | Favoritos | Usuario | Media | HU-010 | Implementado en la web. No implementado en RehniMarket Mobile (el botón solo cambia un estado visual local). |
| D:RF-021 | Gestionar el carrito de compras | Carrito y compra | Usuario | Alta | HU-011 | Implementado en la web. No implementado en RehniMarket Mobile (placeholder, sin persistencia real). |
| D:RF-022 | Completar el checkout con pago en RehniCoin | Carrito y compra | Usuario | Alta | HU-012 | Implementado |
| D:RF-023 | Consultar mis pedidos y su detalle | Pedidos | Usuario | Alta | HU-013 | Implementado |
| D:RF-024 | Cancelar mi pedido | Pedidos | Usuario | Alta | HU-013 | Implementado (la cancelación no reembolsa; el reembolso automático es solo el de RF-052 / suspensión de empresa) |
| D:RF-025 | Consultar pedidos recibidos por la empresa | Pedidos | Empresa | Alta | HU-021 | Implementado |
| D:RF-026 | Actualizar el estado de un pedido | Pedidos | Empresa | Alta | HU-021 | Implementado |
| D:RF-027 | Asignar transportadora y código de seguimiento al enviar un pedido | Pedidos | Empresa | Alta | HU-021 | Implementado |
| D:RF-028 | Editar transportadora/código de seguimiento mientras el pedido está enviado | Pedidos | Empresa | Media | HU-021 | Implementado |
| D:RF-029 | Visualizar información de envío y enlace de seguimiento | Pedidos | Usuario | Media | HU-013 | Implementado |
| D:RF-030 | Consultar elegibilidad para reseñar un producto | Reseñas y calificaciones | Usuario | Media | HU-014 | Implementado |
| D:RF-031 | Crear, editar y eliminar mi reseña | Reseñas y calificaciones | Usuario | Media | HU-014 | Implementado |
| D:RF-032 | Consultar saldo y movimientos de mi billetera | RehniCoins | Usuario | Media | HU-015 | Implementado |
| D:RF-033 | Solicitar recarga de RehniCoins vía WhatsApp | RehniCoins | Usuario | Media | HU-016 | Implementado |
| D:RF-034 | Recargar saldo a un usuario | RehniCoins | Administrador, Owner | Media | HU-030 | Implementado |
| D:RF-035 | Consultar historial de recargas administrativas | RehniCoins | Administrador, Owner | Baja | HU-030 | Implementado |
| D:RF-036 | Gestionar direcciones de envío | Direcciones | Usuario | Media | HU-017 | Implementado |
| D:RF-037 | Crear un reporte de producto o empresa | Reportes | Usuario | Media | HU-018 | Implementado |
| D:RF-038 | Consultar y filtrar reportes | Reportes | Administrador, Owner | Media | HU-028 | Implementado |
| D:RF-039 | Actualizar el estado de un reporte | Reportes | Administrador, Owner | Media | HU-028 | Implementado |
| D:RF-040 | Consultar y actualizar el perfil de mi empresa | Empresa (perfil y productos) | Empresa | Media | HU-019 | Implementado |
| D:RF-041 | Crear un producto | Empresa (perfil y productos) | Empresa | Alta | HU-020 | Implementado |
| D:RF-042 | Consultar mis productos | Empresa (perfil y productos) | Empresa | Alta | HU-020 | Implementado |
| D:RF-043 | Editar un producto | Empresa (perfil y productos) | Empresa | Alta | HU-020 | Implementado |
| D:RF-044 | Activar/desactivar un producto | Empresa (perfil y productos) | Empresa | Media | HU-020 | Implementado |
| D:RF-045 | Eliminar un producto (baja lógica) | Empresa (perfil y productos) | Empresa | Media | HU-020 | Implementado |
| D:RF-046 | Gestionar variantes de color de un producto | Empresa (perfil y productos) | Empresa | Alta | HU-020 | Implementado |
| D:RF-047 | Gestionar imágenes de una variante | Empresa (perfil y productos) | Empresa | Media | HU-020 | Implementado |
| D:RF-048 | Gestionar especificaciones de una variante | Empresa (perfil y productos) | Empresa | Media | HU-020 | Implementado |
| D:RF-049 | Gestionar cuentas bancarias de la empresa | Finanzas de empresa | Empresa | Media | HU-022 | Implementado |
| D:RF-050 | Consultar balance y liquidaciones propias | Finanzas de empresa | Empresa | Media | HU-022 | Implementado |
| D:RF-051 | Gestionar cuentas de usuario | Administración de usuarios y empresas | Administrador, Owner | Alta | HU-023 | Implementado |
| D:RF-052 | Gestionar empresas registradas | Administración de usuarios y empresas | Administrador, Owner | Alta | HU-024 | Implementado |
| D:RF-053 | Restringir la gestión de cuentas Owner al propio rol Owner | Administración de usuarios y empresas | Owner | Alta | HU-032 | Implementado |
| D:RF-054 | Gestionar categorías del catálogo | Catálogo administrativo y anuncios | Administrador, Owner | Media | HU-025 | Implementado |
| D:RF-055 | Gestionar especificaciones de una categoría | Catálogo administrativo y anuncios | Administrador, Owner | Media | HU-025 | Implementado |
| D:RF-056 | Gestionar colores disponibles | Catálogo administrativo y anuncios | Administrador, Owner | Media | HU-025 | Implementado |
| D:RF-057 | Gestionar anuncios del Home | Catálogo administrativo y anuncios | Administrador, Owner | Media | HU-026 | Implementado |
| D:RF-058 | Gestionar el catálogo de transportadoras | Transportadoras | Administrador, Owner | Media | HU-027 | Implementado |
| D:RF-059 | Consultar transportadoras activas | Transportadoras | Empresa | Media | HU-021, HU-027 | Implementado |
| D:RF-060 | Generar una liquidación | Liquidaciones | Administrador, Owner | Media | HU-029 | Implementado |
| D:RF-061 | Consultar vista previa y periodos disponibles para liquidar | Liquidaciones | Administrador, Owner | Media | HU-029 | Implementado |
| D:RF-062 | Consultar liquidaciones generadas | Liquidaciones | Administrador, Owner | Media | HU-029 | Implementado |
| D:RF-063 | Marcar una liquidación como pagada | Liquidaciones | Administrador, Owner | Media | HU-029 | Implementado |
| D:RF-064 | Consultar estadísticas y actividad reciente de la plataforma | Panel administrativo | Administrador, Owner | Baja | HU-031 | Implementado |
| D:RF-065 | Reembolso automático al cancelar un pedido individual | Pedidos | Usuario, Empresa (beneficiario: Usuario) | Media | HU-013, HU-021 (y contraste con HU-024) | No implementado (la cancelación individual no reembolsa; hoy se resuelve con una recarga/ajuste manual de Admin/Owner, ver RF-034) |

Resumen declarado por F4 (§7): 65 RF, de los cuales 62 implementados de forma completa, 2 implementados solo en la web (D:RF-020 y D:RF-021) y 1 no implementado (D:RF-065). Prioridades: 23 Alta, 40 Media, 2 Baja.

## 7. Requisitos no funcionales (referencia)

Fuente: `docs/docs++/_fuentes_entregables/08_Requisitos_No_Funcionales.md` §2 (los mismos 31 identificadores aparecen en F4 §5). Se listan solo como referencia, porque el encargo se centra en requisitos funcionales e historias de usuario.

| ID original | Requisito no funcional | Categoría | Estado declarado |
|---|---|---|---|
| RNF-001 | Autenticacion basada en JWT (access + refresh token) | Seguridad | Implementado |
| RNF-002 | Renovacion silenciosa de sesion | Seguridad | Implementado |
| RNF-003 | Autorizacion centralizada por rol y por ruta | Seguridad | Implementado |
| RNF-004 | Verificacion de pertenencia (ownership) sobre los propios recursos | Seguridad | Implementado |
| RNF-005 | Cifrado irreversible de contrasenas | Seguridad | Implementado |
| RNF-006 | Verificacion de correo obligatoria | Seguridad | Implementado |
| RNF-007 | Recuperacion de contrasena por codigo de un solo uso | Seguridad | Implementado |
| RNF-008 | Secretos y credenciales fuera del codigo fuente | Seguridad | Implementado |
| RNF-009 | Almacenamiento seguro de sesion en el cliente movil | Seguridad | Implementado |
| RNF-010 | Restriccion de acciones administrativas sensibles al nivel de privilegio correcto | Seguridad | Implementado |
| RNF-011 | Paginacion en listados de volumen potencialmente alto | Rendimiento | Implementado |
| RNF-012 | Calculo de contadores agregados con una sola consulta agrupada | Rendimiento | Implementado |
| RNF-013 | Contrato de errores consistente entre backend y frontend | Usabilidad | Implementado |
| RNF-014 | Restauracion del contexto tras iniciar sesion desde una accion protegida | Usabilidad | Implementado |
| RNF-015 | Verificacion de salud del backend y su conectividad | Disponibilidad | Implementado |
| RNF-016 | Reinicio automatico de los servicios ante fallos | Confiabilidad | Implementado |
| RNF-017 | Atomicidad e idempotencia en operaciones financieras criticas | Confiabilidad | Implementado |
| RNF-018 | Arquitectura en capas consistente en todo el backend | Mantenibilidad | Implementado |
| RNF-019 | Control de versiones del esquema de base de datos | Mantenibilidad | Implementado |
| RNF-020 | Auditoria de vulnerabilidades de dependencias | Mantenibilidad | Implementado |
| RNF-021 | Servicios desacoplados y escalables de forma independiente | Escalabilidad | Implementado |
| RNF-022 | Almacenamiento de archivos independiente del servidor de aplicacion | Portabilidad | Implementado |
| RNF-023 | Configuracion externalizada por entorno | Portabilidad | Implementado |
| RNF-024 | Compilacion y tipado estricto del frontend web | Compatibilidad | Implementado |
| RNF-025 | Interfaz web adaptable a distintos tamanos de pantalla | Compatibilidad | Implementado |
| RNF-026 | Levantamiento de todo el stack con un solo comando | Despliegue | Implementado |
| RNF-027 | Verificacion estatica antes de integrar cambios en el backend | Calidad | Parcial |
| RNF-028 | Suite de pruebas automatizadas | Calidad | No implementado (en la fuente); ver nota de estado actual |
| RNF-029 | Ejecucion del cliente movil sobre Android e iOS | Compatibilidad movil | Parcial |
| RNF-030 | Adaptacion del cliente movil a distintos anchos de pantalla de telefono | Compatibilidad movil | Implementado |
| RNF-031 | Diseno diferenciado para tablet | Compatibilidad movil | No implementado |

## 8. Reglas de negocio

Fuente: `docs/docs++/Requisitos-Funcionales.md` §7, que las extrae de los criterios de aceptación de F1. Los identificadores `RF-` de la columna "Requisitos relacionados" corresponden a la numeración `M:`. El Excel (F2) y F4 no contienen una sección de reglas de negocio.

| ID | Regla de negocio | Requisitos relacionados (numeración M:) | Fuente en F1 |
|---|---|---|---|
| RN-001 | Una cuenta debe tener su correo verificado antes de poder iniciar sesión; el intento sin verificar se rechaza indicando explícitamente el motivo. | RF-024, RF-030, RF-039 | HU-004 CA 3; HU-005 CA 4; HU-007 CA 5 |
| RN-002 | Solo una empresa con certificación aprobada por la administración se muestra como "empresa verificada" ante los compradores. | RF-026, RF-124 | HU-004 CA 4; HU-023 CA 2 |
| RN-003 | El estado de verificación de una empresa (aprobado, pendiente o rechazado) lo determina la administración; para la empresa es informativo y no modificable. | RF-097, RF-098, RF-124 | HU-018 CA 3; HU-023 CA 2 |
| RN-004 | Un fallo de inicio de sesión por credenciales inválidas no revela cuál de los dos datos es incorrecto. | RF-034 | HU-006 CA 3 |
| RN-005 | La funcionalidad de favoritos está disponible únicamente para el rol Usuario; no para Empresa ni Administrador. | RF-052 | HU-010 CA 7 |
| RN-006 | La cantidad de un producto en el carrito no puede superar el stock disponible. | RF-054 | HU-011 CA 2 |
| RN-007 | Completar una compra requiere que el Usuario tenga registrada al menos una dirección de envío. | RF-058, RF-093 | HU-012 CA 1 |
| RN-008 | El pago de una compra se realiza con el saldo de RehniCoins de la cuenta del Usuario. | RF-060, RF-061, RF-065 | HU-012 CA 2 y CA 3 |
| RN-009 | El total de una compra incluye un impuesto del 19 % sobre el subtotal. | RF-059 | HU-012 CA 2 |
| RN-010 | 1 RehniCoin equivale a 1 peso colombiano. | RF-079 | HU-015 CA 1 |
| RN-011 | Una compra genera un pedido por cada empresa vendedora involucrada. | RF-063 | HU-012 CA 5 |
| RN-012 | El Usuario puede cancelar un pedido únicamente mientras su estado sea pendiente o pagado. | RF-068 | HU-013 CA 2 |
| RN-013 | El flujo de estados de un pedido es: pendiente o pagado → en preparación → enviado → entregado. | RF-072, RF-066 | HU-020 CA 3; HU-013 CA 1 |
| RN-014 | Un pedido entregado o cancelado no admite más cambios de estado. | RF-069 | HU-013 CA 3; HU-020 CA 4 |
| RN-015 | Un Usuario solo puede reseñar un producto del que tenga al menos un pedido en estado entregado. | RF-074 | HU-014 CA 1 |
| RN-016 | Un Usuario puede dejar una sola reseña por producto. | RF-076 | HU-014 CA 3 |
| RN-017 | La calificación de una reseña es de 1 a 5 estrellas y el comentario es opcional. | RF-075 | HU-014 CA 2 |
| RN-018 | La calificación promedio y el conteo de opiniones del producto y de la empresa se recalculan a partir de las reseñas reales existentes. | RF-011, RF-020, RF-078 | HU-014 CA 5; HU-002 CA 2; HU-003 CA 2 |
| RN-019 | Una solicitud de recarga no acredita saldo automáticamente: el saldo se actualiza solo cuando un Administrador realiza la recarga manualmente tras verificar el pago fuera de la plataforma. | RF-084, RF-086 | HU-016 CA 3; HU-027 (narrativa y CA 1) |
| RN-020 | El monto de una solicitud de recarga debe ser un número entero mayor que cero. | RF-082 | HU-016 CA 1 |
| RN-021 | Acreditar saldo en una billetera es exclusivo de las cuentas Administrador y Owner. | RF-087 | HU-027 CA 2 |
| RN-022 | Un producto y sus variantes solo pueden ser gestionados por la empresa que los creó. | RF-107 | HU-019 CA 7 |
| RN-023 | Una liquidación requiere que la empresa tenga configurada una cuenta bancaria predeterminada. | RF-114, RF-109, RF-141 | HU-021 CA 4; HU-026 CA 5 |
| RN-024 | Una liquidación ya pagada no puede volver a marcarse como pagada. | RF-145 | HU-026 CA 4 |
| RN-025 | El valor de una liquidación se calcula sobre las ventas válidas de la empresa en el periodo menos la comisión de la plataforma. | RF-141 | HU-026 CA 1 |
| RN-026 | Un Administrador que no sea Owner no puede modificar ni bloquear una cuenta Owner, ni asignar el rol Owner; esas acciones son exclusivas del rol Owner. | RF-120, RF-126, RF-127 | HU-022 CA 4; HU-029 CA 1 y CA 2 |
| RN-027 | Ninguna cuenta con rol Owner puede eliminarse, ni siquiera por otro Owner. | RF-121 | HU-022 CA 5; HU-029 CA 3 |
| RN-028 | Solo los anuncios activos se muestran a los visitantes en el Home. | RF-007, RF-139 | HU-025 CA 3 |
| RN-029 | Los datos mostrados al actor (precio, descuento, stock, saldo y movimientos) provienen del catálogo real y del servidor; no se simulan ni se calculan en la pantalla. | RF-008, RF-081 | HU-001 CA 6; HU-015 CA 3 |
| RN-030 | El perfil público de una empresa lista únicamente sus productos activos y disponibles. | RF-021 | HU-003 CA 3 |
| RN-031 | El retorno al contexto de origen tras iniciar sesión no reemplaza los flujos de verificación de correo ni de autorización por rol. | RF-039, RF-040 | HU-007 CA 5 |
| RN-032 | La solicitud de recarga se canaliza por WhatsApp hacia el número oficial configurado por la plataforma, que no está incorporado dentro de la aplicación; si no está configurado, el sistema informa el error. | RF-083, RF-085 | HU-016 CA 2 y CA 4 |

Reglas implícitas en el Excel (F2), sin identificador propio: el correo de registro debe ser único (X:RF-01, descripción; escenario 3) y los campos del registro son obligatorios (escenario 2). Ninguna de las dos figura como regla numerada en F3.

## 9. Trazabilidad consolidada

### 9.1 Historia de usuario → requisitos en cada fuente

Los RF de F4 se ubican en la historia de F1 equivalente según la correspondencia inferida de 5.3.

| HU (F1) | Título | Excel (F2) | `Requisitos-Funcionales.md` (F3) | `.docx` (F4) |
|---|---|---|---|---|
| HU-001 | Explorar y buscar el catálogo público | — | M:RF-001 a 008 | D:RF-001 a 004 |
| HU-002 | Consultar el detalle de un producto | — | M:RF-009 a 017 | D:RF-005 a 007 |
| HU-003 | Consultar el perfil público de una empresa | — | M:RF-018 a 021 | D:RF-008 a 010 |
| HU-004 | Registrarme como comprador o como empresa | X:RF-01 | M:RF-022 a 026 | D:RF-011 a 012 |
| HU-005 | Verificar mi correo electrónico | — | M:RF-024, 027 a 030 | D:RF-013 a 014 |
| HU-006 | Iniciar sesión y recuperar mi contraseña | X:HU-01 (escenario 1) | M:RF-031 a 035 | D:RF-015 a 016 |
| HU-007 | Regresar al contexto donde estaba después de iniciar sesión | — | M:RF-035 a 040 | D:RF-017 |
| HU-008 | Cerrar sesión | — | M:RF-041 a 042 | D:RF-019 |
| HU-009 | Gestionar mi cuenta personal | — | M:RF-043 a 046 | D:RF-018 |
| HU-010 | Gestionar mis productos favoritos | — | M:RF-036 a 037, 047 a 052 | D:RF-020 |
| HU-011 | Gestionar mi carrito de compras | — | M:RF-036 a 037, 053 a 057 | D:RF-021 |
| HU-012 | Completar una compra | — | M:RF-036 a 037, 058 a 065 | D:RF-022 |
| HU-013 | Consultar y cancelar mis pedidos | — | M:RF-066 a 069 | D:RF-023 a 024, 029, 065 |
| HU-014 | Escribir una reseña de un producto comprado | — | M:RF-074 a 078 | D:RF-030 a 031 |
| HU-015 | Consultar mi saldo y movimientos de RehniCoins | — | M:RF-079 a 081 | D:RF-032 |
| HU-016 | Solicitar una recarga de RehniCoins | — | M:RF-082 a 085 | D:RF-033 |
| HU-017 | Gestionar mis direcciones de envío | — | M:RF-090 a 093 | D:RF-036 |
| HU-018 | Gestionar el perfil de mi empresa | — | M:RF-094 a 098 | D:RF-040 |
| HU-019 | Publicar y gestionar mis productos | — | M:RF-099 a 107 | D:RF-041 a 048 |
| HU-020 | Gestionar los pedidos que recibo | — | M:RF-069 a 073 | D:RF-025 a 028, 059, 065 |
| HU-021 | Gestionar mi información financiera y cuentas bancarias | — | M:RF-108 a 114 | D:RF-049 a 050 |
| HU-022 | Gestionar cuentas de usuario | — | M:RF-115 a 121 | D:RF-051 |
| HU-023 | Gestionar empresas registradas | — | M:RF-026, 122 a 125 | D:RF-052 |
| HU-024 | Gestionar el catálogo de la plataforma | — | M:RF-129 a 136 | D:RF-054 a 056 |
| HU-025 | Gestionar los anuncios del Home | — | M:RF-007, 137 a 140 | D:RF-057 |
| HU-026 | Generar y administrar liquidaciones a empresas | — | M:RF-114, 141 a 145 | D:RF-060 a 063 |
| HU-027 | Recargar el saldo de RehniCoins de un usuario | — | M:RF-086 a 089 | D:RF-034 a 035 |
| HU-028 | Consultar el panel de estadísticas de la plataforma | — | M:RF-146 a 148 | D:RF-064 |
| HU-029 | Administrar cuentas con privilegios elevados (exclusivo Owner) | — | M:RF-120 a 121, 126 a 128 | D:RF-053 |

### 9.2 Requisitos sin historia de usuario en `RehniMarket-HU.md`

| Requisito | Tema | HU citada por su fuente | Situación frente a F1 |
|---|---|---|---|
| D:RF-037 | Crear un reporte de producto o empresa | D:HU-018 | Ninguna historia de F1 describe reportes. |
| D:RF-038, D:RF-039 | Consultar, filtrar y actualizar reportes | D:HU-028 | Ídem. |
| D:RF-058 | Gestionar el catálogo de transportadoras | D:HU-027 | Ninguna historia de F1 describe transportadoras. |
| D:RF-059 | Consultar transportadoras activas | D:HU-021, D:HU-027 | Parcial: solo el lado "pedidos recibidos" equivale a HU-020. |
| D:RF-027, D:RF-028, D:RF-029 | Asignar, editar y visualizar transportadora y código de seguimiento | D:HU-021, D:HU-013 | Se ubican en HU-020 y HU-013, pero ningún criterio de aceptación de F1 menciona transportadora ni seguimiento. |
| D:RF-017 | Renovar sesión mediante refresh token | D:HU-007 | HU-007 trata del retorno al contexto tras iniciar sesión; ningún criterio menciona la renovación de sesión. |

### 9.3 Correspondencia del Excel con las demás fuentes

| Elemento del Excel | Equivalente en F1 | Equivalente en F3 | Equivalente en F4 |
|---|---|---|---|
| X:RF-01 Registro de usuarios | HU-004 (CA 1) | M:RF-022 | D:RF-011 |
| X:HU-01 "registrarme" | HU-004 | M:RF-022 a M:RF-026 | D:RF-011, D:RF-012 |
| X:HU-01 "iniciar sesión" y escenario 1 | HU-006 (CA 1) | M:RF-031 | D:RF-015 |
| Escenario 2 (campos vacíos) | Sin criterio equivalente | Sin requisito equivalente | No verificado en la ficha de D:RF-011 |
| Escenario 3 (correo ya registrado) | Sin criterio equivalente | Sin requisito equivalente | No verificado en la ficha de D:RF-011 |

Estas equivalencias son una propuesta de este análisis; ninguna fuente las declara.

## 10. Hallazgos del análisis

Cada hallazgo indica su evidencia. Ninguno fue resuelto: todos requieren decisión del equipo.

### 10.1 Sobre el Excel (F2)

| ID | Hallazgo | Evidencia |
|---|---|---|
| H-01 | **La matriz está prácticamente vacía.** Contiene 1 requisito de los 20 que admite la tabla, frente a 148 (F3) y 65 (F4) documentados en otras fuentes. | Hoja `RF`, `Tabla1` A5:C25; solo fila 6 con datos. |
| H-02 | **La historia mezcla dos funcionalidades.** X:HU-01 cubre "registrarme e iniciar sesión", pero el requisito al que pertenece (X:RF-01) es solo de registro. El escenario 1 es de inicio de sesión, no de registro. | `Registro de usuarios` A7 y fila 10. |
| H-03 | **El resultado del escenario 1 no corresponde al dominio.** "El sistema permite el acceso al inventario": ninguna otra fuente describe un inventario como destino del inicio de sesión; F1 (HU-006 CA 4) dirige al Home. | `Registro de usuarios` D10; F1 HU-006. |
| H-04 | **Los datos del registro difieren.** El Excel pide nombre, correo y contraseña; HU-004 CA 1 pide además el teléfono. | `RF` B6; F1 HU-004 CA 1. |
| H-05 | **El Excel omite el registro de empresa y la verificación de correo.** HU-004 CA 2 a CA 4 y HU-005 establecen que la cuenta queda pendiente de verificación y no puede iniciar sesión hasta verificar el correo; el Excel afirma que el registro permite "el acceso a la plataforma" sin ese paso. | `RF` B6; F1 HU-004, HU-005. |
| H-06 | **La descripción incluye un atributo no funcional.** "Almacena las credenciales de forma segura" corresponde a RNF-005 (cifrado irreversible de contraseñas), no a un requisito funcional. | `RF` B6; F5 RNF-005. |
| H-07 | **La trazabilidad RF → HU no está en celdas.** El identificador HU-01 solo existe como texto de una forma gráfica con hipervínculo; no puede filtrarse, ordenarse ni leerse como dato de la tabla. Hay además una forma "HU-01" duplicada y sin enlace en la fila 7. | `xl/drawings/drawing1.xml` del `.xlsx`. |
| H-08 | **Faltan columnas básicas.** La matriz no tiene identificador, prioridad, actor, módulo ni estado. | Encabezados de `Tabla1`: NOMBRE DEL REQUISITO, DESCRIPCION, HISTORIA DE USUARIO. |
| H-09 | **Los escenarios 2 y 3 no tienen respaldo en F1.** Ningún criterio de HU-004 menciona campos obligatorios ni correo duplicado. Son criterios válidos que F1 no recoge. | `Registro de usuarios` filas 11 y 12; F1 HU-004. |

### 10.2 Sobre los identificadores

| ID | Hallazgo | Evidencia |
|---|---|---|
| H-10 | **Tres numeraciones `RF-` colisionan.** El mismo identificador designa requisitos distintos según el documento, y el Excel usa dos dígitos (`RF-01`) frente a tres en F3 y F4. | Sección 3 de este documento. |
| H-11 | **Las historias no comparten numeración.** `X:HU-01` equivale a HU-004 y HU-006 de F1; F1 ya tiene una HU-001 con otro contenido (catálogo público). | F2; F1 HU-001, HU-004, HU-006. |
| H-12 | **F4 referencia historias que no existen en F1.** Cita hasta HU-032 y usa HU-018, HU-027 y HU-028 para temas sin historia en F1; a partir de HU-018 todos sus identificadores están desplazados respecto de F1. Quien siga un enlace de F4 hacia F1 llegará a una historia equivocada. | F4 §6.1; sección 5.3 de este documento. |
| H-13 | **F3 y F4 no son comparables uno a uno.** F3 descompone cada criterio de aceptación (148 RF); F4 agrupa por funcionalidad y endpoint (65 RF). Ninguno referencia al otro. | F3 §5; F4 §4. |
| H-14 | **Las prioridades no coinciden entre fuentes.** F3 deja los 148 RF en "Por definir"; F4 asigna Alta/Media/Baja a sus 65 RF; el Excel no registra prioridad. | F3 OBS-001; F4 §4. |

### 10.3 Vacíos de cobertura

| ID | Hallazgo | Evidencia |
|---|---|---|
| H-15 | **Reportes y transportadoras no tienen historia de usuario en F1** ni requisitos en F3, aunque F4 los documenta como implementados (8 RF). | Sección 9.2; F4 D:RF-027 a 029, 037 a 039, 058, 059. |
| H-16 | **El módulo de devoluciones no aparece en ninguna fuente de requisitos.** No tiene historia en F1 ni requisito en F2, F3 o F4. F3 lo registra solo como observación (OBS-017). Existe en el código. | F3 OBS-017; `RehniMarket-backend/app/models/ModelReturnRequest.py`, `app/services/commerce/ReturnService.py`, migración `f7a2b9c1d3e4_return_requests`. |
| H-17 | **El plan de pruebas no traza contra requisitos funcionales.** Su matriz va de HU a casos de prueba y declara que no pudo inspeccionar el `.docx`; no existe trazabilidad RF → caso de prueba en ninguna numeración. | F6 §16.1. |

### 10.4 Contradicciones entre documentación y código

Comprobaciones puntuales, no una auditoría del código.

| ID | Hallazgo | Evidencia |
|---|---|---|
| H-18 | **D:RF-065 está desactualizado.** F4 lo declara "No implementado" (la cancelación de un pedido no reembolsa), y lo repiten `CONSOLIDADO_AVANCE_REHNIMARKET.md` y `README_ENTREGABLES.md`. En el código actual el servicio de cancelación del comprador sí invoca el reembolso a la billetera, con control de idempotencia. | F4 D:RF-065, D:RF-024; `RehniMarket-backend/app/services/commerce/OrderService.py` (`cancel_my_order_service` llama a `refund_wallet` tras `has_order_been_refunded`). |
| H-19 | **HU-004 CA 4 contradice el código.** La historia dice que una empresa con certificación pendiente "puede iniciar sesión"; el servicio de inicio de sesión la rechaza con `COMPANY_PENDING`. M:RF-025 hereda el enunciado de la historia. | F1 HU-004 CA 4; F6 INC-02; `app/services/authentication/LoginService.py` línea 76. |
| H-20 | **HU-025 CA 1 contradice el código.** La historia describe el anuncio "con imagen, texto y enlace"; los campos de texto fueron eliminados. M:RF-137 conserva el enunciado de la historia. | F1 HU-025 CA 1; F3 OBS-005; F6 INC-01; migración `d4e5f6a7b8c9_advertisement_drop_text_fields`. |
| H-21 | **El impuesto del 19 % podría no ser universal.** HU-012 CA 2 y RN-009 lo fijan sin excepciones; en el código, un comentario del servicio de devoluciones indica que el IVA se aplica "solo si el producto aplica IVA (`Product.applies_tax`)". No se revisó el servicio de checkout para confirmarlo. | F1 HU-012 CA 2; F3 OBS-010; `app/services/commerce/ReturnService.py` líneas 85-86. |

### 10.5 Defectos internos de las fuentes

| ID | Hallazgo | Evidencia |
|---|---|---|
| H-22 | **Referencias cruzadas incorrectas en F1.** HU-016 CA 3 remite a HU-021 (debería ser HU-027) y HU-022 CA 4 remite a HU-026 (debería ser HU-029). | F1 HU-016, HU-022; F3 OBS-003, OBS-004. |
| H-23 | **Integrantes registrados solo en el Excel.** F3 declara "No disponible en la fuente consultada"; el Excel sí registra un integrante. | `RF` B2; F3 §1. |
| H-24 | **Rutas obsoletas.** F3, F4, F6 y el backlog histórico citan `docs/RehniMarket-HU.md` y `docs/RehniMarket-Requisitos.docx`; ambos archivos están en `docs/docs++/`. | Sección 2.1 de este documento. |
| H-25 | **Criterios no verificables u omisiones en F1** ya catalogados por F3: lista abierta de estadísticas (OBS-006), comisión y periodo de liquidación sin definir (OBS-009), vigencia e intentos de los códigos sin documentar (OBS-013), cambio de correo sin reverificación (OBS-014), efectos de eliminar cuentas y direcciones (OBS-015, OBS-016). | F3 §8. |

## 11. Pendientes de validación

Decisiones que este análisis no puede tomar por el equipo, ordenadas por dependencia:

1. **Suministrar el prompt principal**, para ajustar las secciones de este documento a las reglas que define.
2. **Elegir una numeración única de historias y de requisitos** (H-10 a H-12). De ella dependen todas las demás correcciones de trazabilidad.
3. **Decidir cuál es la fuente de requisitos funcionales vigente**: el Excel (formato de entrega, 1 requisito), F3 (148, derivados de F1) o F4 (65, derivados del código). Hoy conviven sin referenciarse (H-01, H-13).
4. **Completar la matriz del Excel** si es el entregable exigido, y corregir en ella X:HU-01 (H-02 a H-05, H-07, H-08).
5. **Escribir historias de usuario para reportes, transportadoras y devoluciones**, o declararlos fuera de alcance (H-15, H-16).
6. **Corregir en F1** HU-004 CA 4, HU-025 CA 1 y las dos remisiones cruzadas (H-19, H-20, H-22), y **en F4** el estado de D:RF-065 (H-18).
7. **Definir prioridades** con un único criterio (H-14).
8. **Confirmar la regla del impuesto** (H-21).

## 12. Resumen de cifras

| Concepto | Cantidad | Fuente |
|---|---|---|
| Historias de usuario vigentes | 29 (HU-001 a HU-029) | F1 |
| Criterios de aceptación | 121 | F1 (conteo de casillas `- [ ]`) |
| Historias en el Excel | 1 (X:HU-01), con 3 escenarios | F2 |
| Requisitos funcionales en el Excel | 1 (X:RF-01) de 20 filas disponibles | F2 |
| Requisitos funcionales en `Requisitos-Funcionales.md` | 148 (M:RF-001 a M:RF-148) | F3 |
| Requisitos funcionales en el `.docx` | 65 (D:RF-001 a D:RF-065) | F4 |
| Requisitos no funcionales | 31 (RNF-001 a RNF-031) | F4, F5 |
| Reglas de negocio numeradas | 32 (RN-001 a RN-032) | F3 |
| Módulos funcionales | 14 en F1 y F3; 16 en F4 (añade Reportes y Transportadoras) | F1 §4; F4 §4 |
| Requisitos de F4 sin historia equivalente en F1 | 4 sin historia (D:RF-037 a 039, 058), 1 con equivalencia parcial (D:RF-059) y 4 sin criterio que los respalde (D:RF-017, 027 a 029) | Sección 9.2 |
| Hallazgos de este análisis | 25 (H-01 a H-25) | Sección 10 |

Las tablas de las secciones 6.2, 6.3, 7, 8 y 9.1 se generaron por extracción automática de las fuentes, no por transcripción manual; los totales de esta sección se obtuvieron contando sus filas.
