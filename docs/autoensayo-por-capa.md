# Autoensayo por capa (sustituye el ensayo cruzado)

> Equipo de 1 persona: reemplaza el ensayo cruzado de `bc-testing-adso` S9 (teoría 2, «explicar,
> romper, escribir») y la revisión cruzada de `bc-asesoria-proyecto` S9
> (`.claude/referentes-sena.md`, regla 4). Las respuestas las escribe el autor **antes** de la
> sustentación; si es posible, un tercero hace las preguntas. No hay respuestas aquí a propósito.

## Backend (FastAPI + SQLAlchemy)

Preguntas que haría el jurado:

1. ¿Qué pasa, paso a paso, entre que el comprador pulsa «Comprar» y se descuenta el saldo? ¿Qué impide cobrar dos veces?
2. ¿Por qué el rol se lee de la BD en cada petición y no del JWT? ¿Qué prueba lo demuestra?
3. ¿Por qué `test_payouts.py` tiene dos `xfail(strict=True)`? ¿Qué pasaría si alguien corrige H-07 sin quitar el `xfail`?

Ejercicio «rompe algo y escribe la prueba»:
- Rompe: quita la comprobación de saldo en el checkout. ¿Qué prueba falla? Si ninguna, escríbela.
- Respuesta del autor: [PENDIENTE]

## Frontend web (React + Vite)

1. ¿Cómo sabe la app qué rol tiene el usuario y qué rutas puede ver (`RequireAuth`, `roleAccess.ts`)?
2. ¿Por qué la validación de registro existe dos veces (zod y Pydantic) y cómo se garantiza que coincidan?
3. ¿Por qué la cobertura del frontend es 10,6 % y qué probarías primero?

Ejercicio: cambia `passwordRule` para aceptar 7 caracteres. ¿Qué test de Vitest falla? Escribe uno para el modal de recarga si no lo detecta.
Respuesta del autor: [PENDIENTE]

## Base de datos y migraciones

1. ¿Por qué no se usa `alembic downgrade` para el rollback? Nombra la migración que lo impide.
2. ¿Qué índice garantiza que un pedido se reembolse una sola vez?
3. ¿Qué es H-01 y por qué `alembic check` no está en el CI?

Ejercicio: borra el índice único parcial de reembolsos en la BD de pruebas. ¿Qué test lo detecta?
Respuesta del autor: [PENDIENTE]

## Infraestructura (Docker, Caddy, CI)

1. ¿Qué necesita un clon limpio para arrancar y por qué los `env_file` son opcionales?
2. ¿Cómo obtiene Caddy el certificado en producción y qué variable cambia entre local y servidor?
3. ¿Qué jobs corren en `ci.yml` y qué bloquea un PR?

Ejercicio: introduce un error de sintaxis en una migración. ¿En qué paso del CI falla?
Respuesta del autor: [PENDIENTE]

## App móvil (Expo)

1. ¿Por qué quedó fuera del alcance de la entrega y qué faltaría para incluirla?
2. ¿Cómo se conecta a la API en desarrollo (`EXPO_PUBLIC_API_URL`, `BACKEND_BIND`)?

Respuesta del autor: [PENDIENTE]

## Registro

| Fecha | Capa | Quién preguntó (rol) | ¿Resuelto sin ayuda? | Qué repasar |
|---|---|---|:---:|---|
| [PENDIENTE] | | | | |
