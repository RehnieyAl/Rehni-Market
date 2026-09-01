# Historias de Usuario — RehniMarket

> ⚠️ **Este archivo NO es la fuente autoritativa de historias de usuario.**
>
> La documentación de historias de usuario **vigente y verificada contra el código**
> es **[`docs/RehniMarket-HU.md`](docs/RehniMarket-HU.md)** (HU‑001 … HU‑029), complementada
> por **`docs/RehniMarket-Requisitos.docx`** (65 RF + 31 RNF) y por la matriz de trazabilidad
> de **`docs/PLAN_PRUEBAS_ACEPTACION_REHNIMARKET.md`** §16.
>
> El contenido que sigue es un **backlog personal de la fase inicial del proyecto**
> (numeración propia HU‑001…HU‑093, distinta a la de `docs/RehniMarket-HU.md`). Se conserva
> únicamente como referencia histórica del alcance planificado al comienzo. **No refleja el
> estado actual**: varias historias listadas aquí como "pendientes" (carrito, pedidos,
> favoritos, direcciones) ya están implementadas, y algunas listadas aquí (p. ej. un módulo
> de "Soporte" con tickets) nunca se implementaron y quedaron fuera del alcance.
>
> Para cualquier evaluación, trazabilidad o prueba de aceptación, usar `docs/RehniMarket-HU.md`.

---

## Anexo histórico — Backlog inicial del proyecto (NO vigente)

### Autenticación y Usuarios

- HU-001 Registro de usuario comprador
- HU-002 Registro de empresa con certificado
- HU-003 Verificación de correo electrónico
- HU-004 Cambio de correo antes de verificar
- HU-005 Inicio de sesión
- HU-006 Solicitud de recuperación de contraseña
- HU-007 Restablecimiento de contraseña
- HU-008 Renovación de sesión (Refresh Token)
- HU-009 Consulta de perfil propio (resumen, nombre, rol y correo)

### Catálogo Público

- HU-010 Ver anuncios del Home
- HU-011 Ver productos del día
- HU-012 Ver categorías
- HU-013 Ver colores disponibles
- HU-014 Ver especificaciones de una categoría
- HU-015 Buscar productos por nombre
- HU-016 Ver detalle público de producto

### Dashboard Empresarial

- HU-017 Ver resumen del dashboard de empresa
- HU-018 Ver y editar perfil de empresa
- HU-019 Actualizar logo y banner de empresa
- HU-020 Crear producto
- HU-021 Listar productos propios
- HU-022 Ver detalle de producto propio
- HU-023 Editar producto
- HU-024 Activar o desactivar producto
- HU-025 Eliminar producto
- HU-026 Recibir notificación de aprobación empresarial (hecho)

### Gestión de Variantes

- HU-026 Crear variante de producto
- HU-027 Listar variantes de un producto
- HU-028 Ver detalle de variante
- HU-029 Editar variante
- HU-030 Eliminar variante
- HU-031 Gestionar imágenes de variante
- HU-032 Gestionar especificaciones de variante

### Administración de Empresas

- HU-033 Listar, buscar y filtrar empresas
- HU-034 Ver detalle de empresa
- HU-035 Aprobar o rechazar certificado empresarial
- HU-036 Bloquear o desbloquear empresa

### Administración de Usuarios

- HU-037 Listar y buscar usuarios
- HU-038 Ver detalle de usuario
- HU-039 Editar correo y rol de usuario
- HU-040 Bloquear o desbloquear usuario
- HU-041 Eliminar usuario

### Configuración del Sistema

- HU-042 Gestionar catálogos
- HU-043 Gestionar especificaciones por catálogo
- HU-044 Gestionar colores

### Publicidad

- HU-045 Crear anuncio del Home
- HU-046 Listar, editar, activar y eliminar anuncios

### Estadísticas y Monitoreo

- HU-047 Ver estadísticas generales del sistema
- HU-048 Ver actividad administrativa reciente
- HU-049 Ver usuarios recientes

### Gestión Owner

- HU-050 Asignar o retirar rol
- HU-051 Gestionar cuentas administrativas

### Infraestructura

- HU-052 Health Checks (Base de Datos e Internet)
- HU-053 Proxy de archivos almacenados (MinIO)

---

### Historias que en la fase inicial figuraban como "pendientes"

> Estado real a 2026-08: **implementadas** salvo el módulo de Soporte y parte de
> estadísticas empresariales.

**Carrito de Compras** — HU-055 a HU-059 → *implementadas* (`/cart`, checkout).
**Gestión de Pedidos** — HU-060 a HU-064 → *implementadas* (`/orders`).
**Gestión de Pedidos para Empresas** — HU-065 a HU-068 → *implementadas* (`/company/dashboard/orders`).
**Direcciones** — HU-069 a HU-072 → *implementadas* (`/addresses`).
**Favoritos** — HU-073 a HU-075 → *implementadas* (`/favorites`).
**Soporte (tickets)** — HU-076 a HU-079 → *NO implementado, fuera de alcance* (se sustituyó por el módulo de Reportes).
**Notificaciones** — HU-082 → *parcial* (correos de cambio de estado de pedido).
**Dashboard Comprador** — HU-084 a HU-086 → *implementado* (panel de usuario).
**Estadísticas Empresariales** — HU-090 a HU-093 → *parcialmente pendiente* (el panel de empresa muestra contadores por estado de pedido; los reportes de ventas por período/ingresos estimados no están).
