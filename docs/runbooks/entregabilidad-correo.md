# Entregabilidad del correo de Rehni Market

Diagnóstico de por qué los correos llegan a Spam, qué se corrigió en el código y qué queda pendiente fuera del
repositorio. Ningún valor DNS de este documento es inventado: lo que no se pudo comprobar figura como
`[PENDIENTE: …]`.

## 1. Configuración actual (comprobada el 25/11/2026)

| Elemento | Valor | Fuente |
|---|---|---|
| Proveedor SMTP | Gmail, `smtp.gmail.com:587` con STARTTLS | `.env` local y `deploy/env.prod.example` (`SMTP_HOST` vacío = Gmail) |
| Autenticación | Cuenta `@gmail.com` con contraseña de aplicación | `GMAIL_USERNAME` / `GMAIL_APP_PASSWORD` |
| `From` | La misma cuenta `@gmail.com` (`EMAIL_FROM` vacío) | `app/Config.py` |
| Envelope sender / `Return-Path` | Lo fija Gmail con la cuenta autenticada | Comportamiento de `smtp.gmail.com` |
| SPF de `gmail.com` | `v=spf1 redirect=_spf.google.com` | `dig TXT gmail.com` |
| DMARC de `gmail.com` | `v=DMARC1; p=none; sp=quarantine; …` | `dig TXT _dmarc.gmail.com` |
| DKIM | Lo firma Google con `d=gmail.com` | Comportamiento de Gmail; `[PENDIENTE: confirmar con los encabezados de un mensaje real]` |

Con `From` igual a la cuenta autenticada, SPF y DKIM quedan alineados con `gmail.com`. **No hay dominio propio**,
así que no existen registros SPF, DKIM ni DMARC de Rehni Market que configurar en este momento.

## 2. Causas probables de la clasificación como Spam (antes de este cambio)

1. **Mensajes solo HTML.** No había parte `text/plain`; los filtros penalizan los correos que solo traen HTML.
2. **Imágenes remotas por HTTP y por IP.** Los correos de pedidos incluían fotos de productos servidas desde
   `URL_BACKEND` (`http://<IP>:8000/media/proxy…`): enlaces sin TLS a una IP son una señal fuerte de spam.
3. **Sin `Date` ni `Message-ID` propios** (los añadía el servidor) y sin `Auto-Submitted`.
4. **Remitente sin nombre visible** (solo la dirección `@gmail.com`).
5. **Remitente de un buzón gratuito** enviando volumen transaccional: limita la reputación y no se puede firmar
   con un dominio propio. Es la causa de fondo y no se resuelve desde el código.
6. Posibles **ráfagas de correos de códigos** (reenvíos sin límite en la recuperación de contraseña).

## 3. Corregido en el código

- `EmailService.build_message`: `multipart/alternative` con `text/plain` (generado del HTML) + `text/html`, ambos
  UTF-8; `Date`, `Message-ID` con el dominio del remitente, `MIME-Version` y `Auto-Submitted: auto-generated`.
- Correos sin fotografías de productos ni imágenes remotas; los enlaces solo se incluyen si son `https` a un host
  público (nunca `http`, `localhost` ni `127.*`).
- `EMAIL_FROM_NAME` (opcional): nombre visible sin cambiar la dirección ni la autenticación.
- `EMAIL_REPLY_TO_CONTACT` (opcional, apagado): `Reply-To` con el correo de contacto publicado por el owner.
  Actívalo solo si el proveedor lo admite para la cuenta remitente.
- Aviso en el arranque si `EMAIL_FROM` usa un dominio distinto al de la cuenta SMTP (DMARC fallaría).
- Reenvío de códigos con cooldown de 60 s y topes por correo, cuenta e IP: no hay ráfagas de correos.

## 4. Pendiente fuera del repositorio (requiere autorización)

| Acción | Detalle |
|---|---|
| Enviar un mensaje de prueba a un buzón autorizado y revisar sus encabezados | Comprobar `Authentication-Results` (`spf=`, `dkim=`, `dmarc=`) y la carpeta de llegada. `[PENDIENTE: resultado real]` |
| Dominio propio + proveedor transaccional | Para firmar con DKIM propio y publicar DMARC del dominio. Requiere elegir proveedor y dominio. `[PENDIENTE: decisión de negocio]` |
| Registros DNS del dominio propio | SPF, la clave DKIM y DMARC los entrega el proveedor elegido; no se pueden escribir antes. `[PENDIENTE: valores del proveedor]` |
| PTR / reputación de IP | No aplica mientras se envíe por Gmail (la IP de salida es de Google). |

## 5. Limitaciones de las pruebas

- Las pruebas automáticas nunca envían correo real: `_transmit` se sustituye por un buzón en memoria.
- La revisión visual se hizo con Chromium (320–1440 px). Gmail Android/iOS, Apple Mail y Outlook no se pueden
  emular con fidelidad desde el repositorio: `[PENDIENTE: revisión en los clientes reales con un buzón de prueba]`.
- No se puede afirmar que los correos lleguen a la bandeja de entrada: depende de la reputación del remitente
  y de los filtros de cada proveedor.
