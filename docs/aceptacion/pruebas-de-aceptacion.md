# Pruebas de aceptación — RehniMarket 1.0.0

> Formato: `bc-implantacion/bootcamp/week-09-aceptacion_y_entrega_formal/2-practicas/01-pruebas-de-aceptacion/README.md`
> (partes 1 a 5). Sección 10.2 de `docs/plan-implantacion.md`. Los resultados, la decisión y las
> firmas los llena el equipo con lo que pase en la sesión real con el cliente simulado.

| Campo | Valor |
|---|---|
| Ambiente | Producción: [PENDIENTE: URL de la VM de Azure] |
| Versión | 1.0.0 (etiqueta `v1.0.0`) [PENDIENTE: crear etiqueta] |
| Cliente simulado (rol) | [PENDIENTE: compañero o instructor que hace de cliente] |
| Equipo (rol) | Responsable técnico |
| Fecha | [PENDIENTE] |

## 1. Requisitos acordados

Requisitos funcionales del Manual técnico (`docs/Manuales/scripts/contenido_tecnico.py`, RF-01 a
RF-36). Se eligen los que sostienen el negocio y uno de operación:

| ID | Requisito |
|---|---|
| RF-01 / RF-03 | Registrar comprador y verificar el correo con un código de 6 dígitos que vence a los 5 minutos |
| RF-02 | Registrar empresa con NIT, DV calculado y certificado en PDF |
| RF-04 | Iniciar sesión según el estado de la cuenta y de la empresa |
| RF-07 | Consultar el catálogo con búsqueda tolerante a errores y filtros |
| RF-12 | Confirmar compra: validar stock y saldo, cobrar en RehniCoin, IVA 19 %, un pedido por empresa |
| RF-13 | Cancelar pedidos en PENDING o PAID con reembolso y reposición de stock |
| RF-14 / RF-23 | Solicitar devolución de un ítem entregado; la empresa la aprueba con reembolso |
| RF-21 | La empresa publica un producto con variantes |
| RF-27 | Administración verifica empresas |
| Plan §3.2 | Respaldo diario y recuperación en menos de 4 horas (RPO 24 h / RTO 4 h) |

## 2. Casos de aceptación

| ID | Requisito | Dado | Cuando | Entonces |
|---|---|---|---|---|
| CA-01 | RF-01 / RF-03 | Una persona sin cuenta con un correo propio | Se registra como comprador e ingresa el código que llega al correo | La cuenta queda verificada e inicia sesión en la tienda |
| CA-02 | RF-02 | Un visitante con un NIT y un DV que no coinciden | Envía el registro de empresa | El formulario rechaza el DV e indica que no coincide con el NIT, sin crear la empresa |
| CA-03 | RF-04 / RF-27 | Una empresa registrada con certificado pendiente | Administración aprueba el certificado y la empresa inicia sesión | La empresa entra a su panel y ya puede publicar |
| CA-04 | RF-21 / RF-07 | Una empresa verificada | Publica un producto con dos variantes (p. ej. talla) y un visitante lo busca con una letra errada | El producto aparece en el catálogo y en el detalle se ven las dos variantes con su precio |
| CA-05 | RF-12 | Un comprador con saldo RehniCoin suficiente y dos productos de empresas distintas en el carrito | Confirma la compra | Se crean dos pedidos, el total incluye IVA 19 % donde aplica y el saldo baja exactamente en el total |
| CA-06 | RF-12 | Un comprador con saldo insuficiente | Intenta confirmar la compra | La compra se rechaza con un mensaje de saldo insuficiente y el saldo no cambia |
| CA-07 | RF-13 | Un pedido en estado PAID | El comprador lo cancela | El pedido queda cancelado, el saldo vuelve completo una sola vez y el stock se repone |
| CA-08 | RF-14 / RF-23 | Un pedido entregado | El comprador pide la devolución de un ítem con un motivo y la empresa la aprueba | El comprador recibe el reembolso del ítem en RehniCoin y ve la devolución como aprobada |
| CA-09 | Plan §3.2 | Un respaldo del día y su huella SHA-256 | Otra persona restaura en un servidor limpio siguiendo el plan (simulacro, §10.3) | Huellas idénticas, conteos iguales y servicio arriba en menos de 4 h |

Evidencia para CA-09: no se prueba desde la pantalla; se usa el registro del simulacro
(`docs/aceptacion/registro-del-simulacro.md`) y la sección 3.5 del plan.

## 3. Criterios de salida

Acordar y firmar **antes** de ejecutar:

| Criterio | Valor propuesto | Valor acordado |
|---|---|---|
| Casos ejecutados | 9 de 9 | [PENDIENTE] |
| Defectos bloqueantes abiertos | 0 | [PENDIENTE] |
| Defectos mayores abiertos | 0 | [PENDIENTE] |
| Tratamiento de defectos menores | Pasan al acta con fecha de corrección | [PENDIENTE] |

Firma (rol) y fecha del acuerdo: [PENDIENTE]

## 4. Ejecución

| Caso | Resultado (pasa / falla) | Evidencia | Defecto (ID y severidad) |
|---|---|---|---|
| CA-01 | [PENDIENTE] | | |
| CA-02 | [PENDIENTE] | | |
| CA-03 | [PENDIENTE] | | |
| CA-04 | [PENDIENTE] | | |
| CA-05 | [PENDIENTE] | | |
| CA-06 | [PENDIENTE] | | |
| CA-07 | [PENDIENTE] | | |
| CA-08 | [PENDIENTE] | | |
| CA-09 | [PENDIENTE] | | |

Defectos encontrados:

| ID | Caso | Descripción | Severidad | Pasos para reproducir |
|---|---|---|---|---|
| | | | | |

Riesgos conocidos antes de ejecutar (incidencias abiertas que el cliente debe conocer):
H-07 (#36) y H-08 (#37) en liquidaciones a empresas, fuera de estos casos.

## 5. Decisión

| Campo | Valor |
|---|---|
| Decisión | [PENDIENTE: aceptado / aceptado con observaciones / rechazado] |
| Justificación (criterio por criterio) | [PENDIENTE] |
| Defectos que pasan al acta con fecha de corrección | [PENDIENTE] |
| Fecha y firmas (roles) | [PENDIENTE] |
