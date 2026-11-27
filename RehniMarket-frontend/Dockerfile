FROM node:22-alpine AS build

WORKDIR /app
ENV CI=true

RUN corepack enable && corepack prepare pnpm@11.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Con CI=true pnpm ya exige el lockfile; --frozen-lockfile lo deja explícito, igual que en CI.
RUN pnpm install --frozen-lockfile

COPY . .

# Solo variables públicas: lo que se pasa aquí queda en el bundle del navegador.
ARG VITE_API_URL

ENV VITE_API_URL=$VITE_API_URL

RUN pnpm build

FROM caddy:2.11-alpine AS runtime

# La configuración (Caddyfile) la monta docker-compose desde ../caddy/
COPY --from=build /app/dist /srv

EXPOSE 80 443

HEALTHCHECK --interval=15s --timeout=4s --retries=5 --start-period=5s \
  CMD wget -qO- http://127.0.0.1:8081/ >/dev/null 2>&1 || exit 1

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]