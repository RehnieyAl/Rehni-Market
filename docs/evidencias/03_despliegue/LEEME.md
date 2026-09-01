# Evidencias — Criterio 3 — Despliegue y publicacion

Esta carpeta es un AREA DE PREPARACION para las evidencias del criterio, sobre todo
las capturas de pantalla y grabaciones que deben tomarse DURANTE la sustentacion.

## Evidencia reproducible ya existente

La evidencia automatizada y reproducible de este criterio esta en la carpeta
`evidencias/` de la raiz del repositorio (NO en `docs/evidencias/`), y se regenera
con los comandos descritos en `evidencias/README.md`. Archivos relevantes:

evidencias/deployment/ (todos), en especial 10_prod_compose_smoke.txt

## Capturas y material a conseguir en la sustentacion

- [ ] Captura de `docker compose ps` con los servicios healthy
      (nota: la evidencia previa `10_prod_compose_smoke.txt` se genero cuando la
       configuracion endurecida se llamaba `docker-compose.prod.yml`; hoy es
       la configuracion por defecto `docker-compose.yml`)
- [ ] Captura del navegador cargando el frontend (web) servido por Nginx
- [ ] Si se llega a publicar en un servidor real: captura del dominio con HTTPS (candado) — PENDIENTE, requiere infraestructura externa

## Regla

No se incluye ninguna captura inventada. Lo que aun no se ha ejecutado o capturado
se deja marcado como PENDIENTE en el documento .docx correspondiente y en esta lista.
