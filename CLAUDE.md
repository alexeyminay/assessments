# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Web application "Ассессменты" — email/password login with roles `admin` and `user`. Currently contains only the auth layer; business features are to be added on top.

## Commands

### Backend (`backend/Assessments/`)

```bash
./gradlew build              # compile + test
./gradlew test               # run tests only
./gradlew installDist        # build distribution (output: build/install/Assessments)
./gradlew run                # run locally (requires postgres)
```

### Frontend (`web/`)

```bash
npm install      # install deps
npm run dev      # dev server on :5173, proxies /api → localhost:8080
npm run build    # production build to dist/
npm run lint     # eslint
```

### Local stack (`infra/`)

```bash
docker compose -f infra/docker-compose.yml up --build   # postgres + backend + web
```

Postgres initialises with `init.sql` (creates `pgcrypto`), then Flyway runs migrations automatically on backend startup. No manual DB setup needed.

## Architecture

### Backend

Clean architecture in three layers per feature module:

- **`domain/`** — interfaces and use cases. No framework dependencies. Use cases return sealed `Result` types instead of throwing.
- **`data/`** — Exposed ORM implementations, HikariCP connection pool, Flyway migrations in `src/main/resources/db/migration/`.
- **`presentation/`** — Ktor route functions (extension functions on `Route`).

`Main.kt` wires everything manually — no DI framework.

Auth flow: `POST /login` → BCrypt verify → issue JWT (24h, HS256) + refresh token (30d, stored as SHA-256 hash in `tokens` table) → return both to client. `POST /refresh` rotates the refresh token atomically. JWT carries `sub` (userId), `email`, and `role` claims.

### Frontend

Same clean architecture mirrored in TypeScript:

- **`auth/domain/`** — interfaces (`AuthRepository`, `TokenStorage`) and use cases (`LoginUseCase`, `LogoutUseCase`).
- **`auth/data/`** — `HttpAuthRepository` (fetch calls to `/api/*`), `LocalStorageTokenStorage`, `AuthFetch` (transparent JWT refresh on 401).
- **`auth/presentation/`** — `LoginPage.tsx`, `useAuth` hook.

`App.tsx` wires instances at module level (no context/provider). `AuthFetch` wraps `fetch` and handles token refresh transparently — use it for all authenticated API calls.

Nginx in the web container proxies `/api/*` → `backend:8080`, stripping the `/api` prefix.

### Adding a new feature

Backend: add a module `src/main/kotlin/<feature>/{domain,data,presentation}`, write a Flyway migration `VN__description.sql`, register routes in `Main.kt`.

Frontend: add `src/<feature>/{domain,data,presentation}`, inject `authFetch` from `App.tsx` into the repository.

### Roles

Stored as `VARCHAR` in `users.role`. Returned in login/refresh responses and embedded in the JWT `role` claim. Currently `admin` and `user`. Backend enforces nothing yet — add route-level checks in `presentation/` when needed.

## CI/CD

`.github/workflows/deploy.yml` — on push to `main`:
1. Builds backend and frontend Docker images, pushes to `ghcr.io/alexeyminay/assessments/{backend,frontend}`.
2. SSHs to server, runs `git pull` + `docker compose -f infra/docker-compose.prod.yml pull/up`.

Required GitHub secrets: `SERVER_HOST`, `SERVER_USER`, `SSH_PRIVATE_KEY`.

Server path: `/opt/assessments`. Secrets file (not in git): `infra/.env` — see `infra/.env.example`.
