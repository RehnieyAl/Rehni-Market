# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

Monorepo (three independent projects, no shared build tooling) for **Lubix / RehniMarket**, a marketplace connecting product companies with users:

- `RehniMarket-backend/` — FastAPI + SQLAlchemy + Alembic + PostgreSQL + MinIO. This is where almost all business logic lives.
- `RehniMarket-frontend/` — React 19 + TypeScript + Vite + Tailwind v4. Web dashboard/storefront.
- `RehniMarket-mobile/` — Expo/React Native app. Currently an empty scaffold (default `App.tsx`); has its own `CLAUDE.md`/`AGENTS.md` pointing to Expo v57 docs — read those before writing mobile code, since the Expo API changed recently.
- `docker-compose.yml` (repo root) orchestrates all of the above together (Postgres, MinIO, backend, frontend).

There is no root package manager — each app is built/run independently (`uv` for the backend, `pnpm` for the frontend/mobile).

## Common commands

### Backend (`RehniMarket-backend/`, uses `uv`)

```bash
uv sync                                                    # install deps
uv run uvicorn app.main:app --reload --port 8000           # run dev server
uv run alembic revision --autogenerate -m "message"        # create migration
uv run alembic upgrade head                                # apply migrations
uv run pip-audit                                            # dependency CVE audit
```

There is no test suite in this backend currently — do not assume `pytest` exists.

Full stack via Docker (Postgres on 5434, MinIO on 9000, backend on 8001, frontend on 5173):

```bash
docker compose build
docker compose up -d
docker compose exec backend uv run alembic upgrade head
docker compose logs -f backend
```

Env vars come from `RehniMarket-backend/.env` (copy from `.env.example`). Notable one: `RUN_SEED=true` seeds an admin user/roles/default catalog on startup via `app/utils/seed.py` (see lifespan in `app/main.py`) — should be turned back to `false` after the first run.

### Frontend (`RehniMarket-frontend/`, uses `pnpm`)

```bash
pnpm install
pnpm dev          # vite dev server
pnpm build        # tsc -b && vite build
pnpm lint         # eslint .
pnpm preview
```

`VITE_API_URL` (in `.env`) points at the backend base URL. No test runner is configured.

### Mobile (`RehniMarket-mobile/`, uses `pnpm`)

```bash
pnpm install
pnpm start        # expo start
pnpm android / pnpm ios / pnpm web
```

## Backend architecture

Layered, per-domain: **router → service → repository → model**. Follow this pattern for new endpoints rather than putting DB queries or business rules directly in routers.

- `app/routers/*.py` — FastAPI `APIRouter`s. Thin: parse request via Pydantic schema, call a service function, return its result. Grouped by audience: `AuthRouters` (public auth flows), `publicRouters` (public catalog browsing), `CompanyRouter`/`mediaRouter` (authenticated company actions), `AdminCompanyRouters`/`AdminUserRouters`/`AdminDashboardRouters` (admin-only), `HealthRouter`.
- `app/services/**` — business logic, organized by domain: `authentication/` (register, login, verify email, forgot/reset password, refresh, me), `DashboardService/admin/*` and `DashboardService/company/*` (admin vs. company dashboard logic), `email/` (code generation + sending via templated emails), `publicService/`. Services raise domain errors via `api_error(...)` (see below) rather than returning error objects.
- `app/repository/**` — SQLAlchemy query functions per model/domain (`UserRepository.py`, `CompanyRepository.py`, `RoleRepository.py`, `CodeRepository.py`, plus `repository/admin/*` for admin-scoped queries). Repositories take a `Session` and do raw ORM queries; they don't commit — callers/services do (or they call `.flush()` and rely on the request-scoped session lifecycle).
- `app/models/**` — SQLAlchemy ORM models (`DeclarativeBase` from `app/database/Connection.py`). **All models must be imported in `app/models/__init__.py`** — this is required so SQLAlchemy resolves relationships between models correctly (Alembic autogenerate and app startup both depend on this).
- `app/schemas/**` — Pydantic request/response models, split into `schemaAuth/` (auth flows) and `SchemaDashboard/` (admin/company dashboard payloads, further split into `admin/` for admin-facing shapes).
- `app/middleware/**` — see Authentication & authorization section below.
- `app/core/ErrorCodes.py` + `app/core/Exceptions.py` — the app's error contract: `ErrorCodes` is a flat namespace of string error codes (auth, user, verification, roles, company, files, products, validation, db, server, rate limit); `api_error(status_code, code, message)` raises an `HTTPException` with `detail={"code": ..., "message": ...}`. Always raise errors this way instead of a bare `HTTPException` so the frontend's error handling (which matches on `code`) keeps working.
- `app/database/Connection.py` — engine/session setup; `get_db()` is the FastAPI dependency for a request-scoped `Session`.
- `app/utils/Security.py` — password hashing/verification (bcrypt via passlib).
- `app/services/authentication/JWTService.py` — access/refresh token creation and verification (`python-jose`).
- `app/services/NasService.py` — MinIO client wrapper (file storage for logos, banners, product images, company certificates); injected into routes via `Depends(get_nas_service)`.

### Authentication & authorization (backend)

Two custom ASGI middlewares run on every request (registered in `app/main.py`, in this order): `auth_middleware` then `rate_limit_middleware`.

- `app/middleware/PublicRoutes.py` — `PUBLIC_ROUTES`, an explicit allowlist of exact paths that skip auth entirely (login/register/verify/forgot-password endpoints, docs, health checks, public catalog reads). **Any new route that should be unauthenticated must be added here explicitly** — there's no pattern/prefix matching for this list, only exact path strings (except templated paths like `/public/catalogs/{catalog_id}/specifications` matched by FastAPI's own routing, not this list).
- Everything else requires `Authorization: Bearer <access_token>`, verified via `JWTService.verify_token`. On success the middleware attaches `request.state.user_id`, `request.state.role`, `request.state.user`.
- `app/middleware/RolePermissions.py` — `ROLES_PERMISSIONS_ROUTERS`, a dict of `role -> [allowed path prefixes]` (`admin`, `company`, `user`). `admin` bypasses this check entirely and can hit anything not in `PUBLIC_ROUTES`. For `company`/`user`, the request path must start with one of their listed prefixes or the middleware returns 403. **When adding a new authenticated endpoint, add its path to the right role(s) here** or it will be unreachable for non-admins.
- JWT payload carries `sub` (user id) and `role`; access vs. refresh tokens are distinguished by a `type` claim (`"access"`/`"refresh"`).
- Roles are `admin`, `company`, `user` — seeded via `app/utils/seed.py` when `RUN_SEED=true`.

### Alembic

`alembic.ini` uses `script_location = %(here)s/alembic`; migrations live in `alembic/versions/`. Run migrations through `uv run alembic ...` (not bare `alembic`) so it uses the project's venv/deps.

## Frontend architecture

Feature-based structure under `src/`:

- `src/features/<domain>/` — `public/auth` (login/register/verify/forgot-reset password pages + `AuthContext`/`AuthProvider`), `company/` (company dashboard: profile, products, orders), `admin/` (admin dashboard: users, companies). Each feature has its own `api/*Service.ts` (axios calls), `components/`, `types/request.ts` + `types/response.ts`.
- `src/pages/` — top-level route components (`public/Home`, `public/Products*`, `dashboard/Company`, `dashboard/Admin`, `user/*`), composed from `features/*` components.
- `src/shared/` — cross-feature UI: dashboard chrome (`Sidebar`, `Topbar`, `DashboardLayout`, `StatCard`), the alert/toast system (`shared/components/alert/*`, uses a context + `useAlert` hook), `navbar/`, `shared/config/dashboardNavigation.tsx` (nav item config), `shared/types/ErrorCode.ts` (mirrors the backend's `ErrorCodes`).
- `src/routers/AppRouter.tsx` — all routes in one file (`BrowserRouter`/`Routes`), no nested/lazy routing yet.
- `src/api/Client.ts` — the shared `axios` instance (`api`), configured with `VITE_API_URL`, a request interceptor that attaches the bearer token, and a response interceptor that funnels errors through `apiErrorHandler.ts` (which likely dispatches alerts based on the backend's `code` field — check it before changing error UX).
- `src/api/setupAuthInterceptor.ts` — silent-refresh flow: on a 401 (not already retried, not the refresh call itself), calls `/auth/refresh` with the stored refresh token, saves new tokens, and replays the original request; on any failure it clears tokens and redirects to `/login`.
- `src/api/session.ts` — token storage is `localStorage` (`accessToken`, `refreshToken`, `role`); `redirectToLogin()` also stashes a message in `sessionStorage.auth_alert` for display after redirect.
- Path alias `@/*` → `src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`) — use it for cross-feature imports instead of long relative paths.
- Tailwind v4 via `@tailwindcss/vite` plugin (no separate `tailwind.config.js` needed).

## Cross-cutting conventions

- **Error codes are the contract between backend and frontend.** Backend raises `api_error(status, ErrorCodes.X, message)`; frontend matches on `error.response.data.detail.code` (see `shared/types/ErrorCode.ts` and `apiErrorHandler.ts`). When adding a new failure case, add the code to both `app/core/ErrorCodes.py` and the frontend's `ErrorCode.ts`, not just one side.
- Backend code comments and user-facing messages are in Spanish; keep new backend comments/strings consistent with that.
- When adding a new backend endpoint that isn't public, remember both auth touch points: `PublicRoutes.py` (only if it should be unauthenticated) and `RolePermissions.py` (which roles besides admin may call it).


## Rehni-Market project rules

- The project name is Rehni-Market.
- Do not modify the backend architecture pattern.
- Follow router → service → repository → model.
- Do not modify existing API contracts unless explicitly requested.
- OWNER has the highest privileges.
- OWNER includes all ADMIN capabilities plus exclusive OWNER capabilities.
- Do not give OWNER unrestricted access by simply bypassing authorization.
- Keep authentication and authorization centralized.
- Do not modify frontend behavior unrelated to the requested task.
- Before large changes, inspect existing implementations and reuse established patterns.