# Acta de Entrega — RehniMarket

> Plantilla: `bc-implantacion/bootcamp/week-09-aceptacion_y_entrega_formal/3-proyecto/starter/acta-de-entrega.md`.
> Personas por rol. Sin contraseñas, llaves, tokens ni IPs: el acta dice qué acceso se transfiere y
> cómo. Las firmas reales van en la copia impresa o firmada fuera del repositorio.

| Campo | Valor |
|---|---|
| Proyecto | RehniMarket — marketplace multiempresa con billetera RehniCoin |
| Cliente (organización) | [PENDIENTE: cliente simulado] |
| Equipo que entrega | Responsable técnico de RehniMarket (equipo de 1 persona) |
| Fecha | [PENDIENTE] |
| Lugar o medio | [PENDIENTE] |

## 1. Alcance entregado

| Funcionalidad | Requisito | Caso de aceptación | Estado |
|---|---|---|---|
| Registro y verificación de comprador | RF-01, RF-03 | CA-01 | [PENDIENTE] |
| Registro de empresa con NIT/DV | RF-02 | CA-02 | [PENDIENTE] |
| Verificación de empresas e inicio de sesión | RF-04, RF-27 | CA-03 | [PENDIENTE] |
| Publicación de productos con variantes y catálogo | RF-21, RF-07 | CA-04 | [PENDIENTE] |
| Compra con RehniCoin e IVA | RF-12 | CA-05, CA-06 | [PENDIENTE] |
| Cancelación con reembolso | RF-13 | CA-07 | [PENDIENTE] |
| Devoluciones | RF-14, RF-23 | CA-08 | [PENDIENTE] |
| Respaldo y restauración | Plan §3.2 | CA-09 | [PENDIENTE] |

Resto de funcionalidades (RF-05 a RF-36): ver Manual técnico y `CHANGELOG.md` `[1.0.0]`. La app
móvil queda fuera del alcance.

Versión del software: 1.0.0 · Etiqueta Git: `v1.0.0` [PENDIENTE: crearla] · Imagen: construida en el servidor desde la etiqueta (`rehni-market-backend`, `rehni-market-frontend`)

## 2. Ambientes

| Ambiente | Dónde | URL |
|---|---|---|
| Producción | VM Ubuntu Server 24.04 LTS en Azure | [PENDIENTE] |
| Pruebas | CI de GitHub Actions (`.github/workflows/ci.yml`) y `postgres-test` local | — |
| Código fuente | GitHub | <https://github.com/RehnieyAl/Rehni-Market> |
| Registro de imágenes | No se usa: las imágenes se construyen en el servidor (plan §5.1) | — |

## 3. Documentación entregada

| Documento | Versión | Ubicación |
|---|---|---|
| Plan de Implantación | 1.0 | `docs/plan-implantacion.md` |
| Manual de usuario (guía y preguntas frecuentes) | 3.0 | `docs/Manuales/Manual de usuario.pdf` |
| Manual técnico y Diccionario de datos | 3.0 | `docs/Manuales/` |
| Runbooks | 1.0 | `docs/runbooks/` |
| Estrategia de pruebas | 2026-11-16 | `docs/estrategia-pruebas.md` |

## 4. Resultado de las pruebas de aceptación

Decisión: [PENDIENTE] (detalle en `docs/aceptacion/pruebas-de-aceptacion.md`)

| Defecto abierto | Severidad | Fecha de corrección comprometida |
|---|---|---|
| H-07 periodo de liquidación solapado (#36) | Alta | [PENDIENTE] |
| H-08 devolución incluida en la liquidación (#37) | Alta | [PENDIENTE] |
| H-06 borrar dirección usada responde 500 (#35) | Media | [PENDIENTE] |
| [PENDIENTE: defectos de la sesión de aceptación] | | |

## 5. Resultado del simulacro cruzado

| Campo | Valor |
|---|---|
| Equipo que instaló | [PENDIENTE] |
| Duración | [PENDIENTE] |
| Huellas | [PENDIENTE] |
| Desviaciones corregidas en la versión del plan | [PENDIENTE] |

## 6. Transferencia de accesos

| Acceso | Cómo se transfiere | Fecha | ¿Rotado después? |
|---|---|---|:---:|
| Repositorio | Invitación como colaborador en GitHub o transferencia del repositorio | [PENDIENTE] | — |
| Servidor (VM de Azure) | El cliente agrega su llave SSH y su cuenta de Azure con rol propietario; se retira la del equipo | [PENDIENTE] | [PENDIENTE] |
| Contraseñas (PostgreSQL, MinIO, `SECRET_KEY`, correo, llave `age`) | En persona o por gestor de contraseñas compartido, nunca por correo ni chat | [PENDIENTE] | [PENDIENTE] |
| Dominio y proveedores (Azure, registrador, cuenta de correo, SonarCloud) | Cambio de titular o de administrador en cada panel | [PENDIENTE] | — |

## 7. Niveles de servicio acordados

Propuesta de `docs/plan-implantacion.md` §9.2, ajustada a un equipo de 1 persona y una VM:

| Nivel de servicio | Compromiso | Cómo se mide |
|---|---|---|
| Disponibilidad mensual | 99 % (hasta ~7 h 18 min sin servicio al mes) | Monitor externo de `/health/database` (plan §8.5) |
| Horario de soporte | Lunes a viernes, 08:00–17:00 (hora de Colombia) | — |
| Primera respuesta / solución P1 | 4 h hábiles / 1 día hábil | Fecha de la incidencia en GitHub |
| Primera respuesta / solución P2 | 1 día hábil / 3 días hábiles | Igual |
| Primera respuesta / solución P3 | 2 días hábiles / 10 días hábiles | Igual |
| Primera respuesta / solución P4 | 3 días hábiles / próxima versión | Igual |
| RPO / RTO | 24 h / 4 h | Log del respaldo diario y restauración de prueba mensual |
| Ventana de mantenimiento | Domingos 02:00–04:00, aviso 48 h antes | Anuncio en el Home |

[PENDIENTE: aceptación del cliente de cada nivel]

## 8. Garantía

| Campo | Valor |
|---|---|
| Duración | [PENDIENTE: propuesta 3 meses desde la firma] |
| Cubre | Defectos de las funcionalidades del §1 en la versión 1.0.0 |
| No cubre | Cambios de alcance, la app móvil, fallos del proveedor de nube o del correo, datos modificados fuera de la aplicación |

## 9. Pendientes

| Pendiente | Responsable (rol) | Fecha |
|---|---|---|
| Corregir H-06, H-07, H-08 (#35–#37) | Responsable técnico | [PENDIENTE] |
| Separar roles de BD (#44) y actualizar dependencias (#45) | Responsable técnico | [PENDIENTE] |
| Cron del respaldo, cifrado `age` y copias 2 y 3 | Responsable técnico | [PENDIENTE] |
| Monitor externo y alertas | Responsable técnico | [PENDIENTE] |

## 10. Firmas

| Rol | Firma | Fecha |
|---|---|---|
| Entrega (equipo) | [PENDIENTE: copia firmada fuera del repositorio] | |
| Recibe (cliente) | [PENDIENTE] | |
| Testigo (instructor) | [PENDIENTE] | |
