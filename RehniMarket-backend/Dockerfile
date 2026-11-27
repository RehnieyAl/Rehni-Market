FROM python:3.13-slim

WORKDIR /app

# Versión fija de uv: con :latest, dos builds del mismo commit podían resolver distinto.
COPY --from=ghcr.io/astral-sh/uv:0.11.29 /uv /usr/local/bin/uv

COPY pyproject.toml uv.lock ./

# --no-build: solo wheels, sin ejecutar scripts de instalación de paquetes (igual que CI).
RUN uv sync --frozen --no-dev --no-build

COPY . .

EXPOSE 8000

CMD ["uv", "run", "--no-sync", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]