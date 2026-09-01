FROM node:22-alpine

WORKDIR /app

RUN corepack enable
RUN corepack prepare pnpm@11.15.0 --activate

EXPOSE 5173

CMD ["sh", "-c", "pnpm install && pnpm dev --host 0.0.0.0 --port 5173"]