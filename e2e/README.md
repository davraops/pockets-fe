# E2E tests (Playwright)

Browser smoke tests for Pockets live in `e2e/smoke/`. They exercise the React app against a **real backend** (and S3 for file uploads).

## Prerequisites

| Requirement | Used by |
|-------------|---------|
| Node.js + `npm install` in `pockets-fe` | All |
| `npx playwright install chromium` (first run) | All |
| `E2E_USERNAME` + `E2E_PASSWORD` | Authenticated specs |
| Backend stack running locally | CRUD specs |
| AWS S3 bucket + credentials | `archivos.spec.ts` |
| `E2E_PRESIGNED_UPLOAD=true` | Presigned upload (`@nightly`) |

## Start the full stack (local)

### 1. Backend (`pockets`)

From the backend repo:

```bash
cd ../pockets
npm install
npm run offline:all   # core :7000, financial :7001, lifestyle :7002
```

Ensure `.env` has database and (for files) AWS credentials. Migrations must be applied.

Create or reset the dedicated E2E user:

```bash
cd ../pockets
npm run reset:e2e-user
# or first-time only:
node scripts/create-test-user.js e2e '123qweZ!' 'E2E Test User' '1990-01-01'
```

`reset:e2e-user` deletes the account (and all related data via CASCADE) and recreates it with known credentials.

Default local credentials: **`e2e` / `123qweZ!`**

### 2. Frontend (`pockets-fe`)

```bash
cd pockets-fe
npm install
npm run dev   # http://localhost:3000 — proxies /api/* to offline ports
```

Vite proxies (see `vite.config.ts`):

- `/api/core` → `http://localhost:7000`
- `/api/financial` → `http://localhost:7001`
- `/api/lifestyle` → `http://localhost:7002`

### 3. S3 for Archivos

Small uploads (≤ 10 MB) and presigned uploads (> 10 MB) need a real `pockets-user-files-*` bucket with CORS allowing `PUT` from `http://localhost:3000`.

## Run tests

```bash
# All e2e (Playwright starts dev server if not running)
E2E_USERNAME=e2e E2E_PASSWORD='123qweZ!' npm run test:e2e

# Smoke suites by area
npm run test:e2e:smoke

# Regression — deeper CRUD + hub navigation (slower)
npm run test:e2e:regression

# Everything except @nightly presigned upload
npm run test:e2e

# Nightly / presigned upload only
E2E_PRESIGNED_UPLOAD=true E2E_USERNAME=user E2E_PASSWORD=pass npm run test:e2e:nightly

# Mobile viewport (390×844) — Home, Finanzas hub, Transacciones
npm run test:e2e:mobile

# Visual regression — 10 critical routes × desktop + mobile (requires baselines)
npm run test:e2e:visual

# Regenerate screenshot baselines after intentional CSS/layout changes
npm run test:e2e:visual:update

# Interactive UI
npm run test:e2e:ui
```

### Optional env vars

| Variable | Default | Purpose |
|----------|---------|---------|
| `E2E_BASE_URL` | `http://localhost:3000` | App URL |
| `E2E_USERNAME` | `e2e` (local dev) | Login user |
| `E2E_PASSWORD` | `123qweZ!` (local dev) | Login password |
| `E2E_PRESIGNED_UPLOAD` | unset | Enable large-file presigned test |

## Spec map

### Smoke (`e2e/smoke/`)

| File | Routes | Backend | Notes |
|------|--------|---------|-------|
| `auth.spec.ts` | `/login`, `/`, `/finanzas` | core (+ financial deep link) | Login, redirect, deep link |
| `home.spec.ts` | `/`, `/finanzas`, `/tiempo` | core + financial | Home launchers + hub navigation |
| `finanzas-hubs.spec.ts` | `/finanzas/credito`, `/cripto`, `/ahorro` + leaves | financial | Section hubs → tarjetas, wallet, CDTs |
| `finanzas-secondary.spec.ts` | proyectos, subscripciones, tarjetas-débito, inflación, listas-mercado, diseñador, crypto-vendors, cripto-transacciones | core + financial | Secondary finanzas modules (P4) |
| `finanzas.spec.ts` | `/finanzas/*` | core + financial | CRUD cuenta/transacción |
| `registros.spec.ts` | `/registros/*` | lifestyle | Cuadernos + secretos |
| `tiempo.spec.ts` | `/tiempo/metas`, `/tiempo/valores` | lifestyle | Goals + personal values |
| `trabajo.spec.ts` | `/trabajo/procesos` | lifestyle | Hiring processes smoke |
| `archivos.spec.ts` | `/registros/archivos` | lifestyle + **S3** | Multipart + optional presigned |
| `justicia.spec.ts` | `/justicia/procesos` | **Mocked** | No live Rama Judicial |

### Mobile (`e2e/mobile/`)

| File | Routes | Backend | Notes |
|------|--------|---------|-------|
| `critical.spec.ts` | `/`, `/finanzas`, `/finanzas/cuentas`, `/finanzas/transacciones`, `/registros`, `/tiempo/mi-dia` | core + financial + lifestyle | Viewport 390×844 (`@mobile`) |

### Visual (`e2e/visual/`)

| File | Routes | Backend | Notes |
|------|--------|---------|-------|
| `critical-routes.spec.ts` | 51 app routes (hubs, CRUD, tools, audit docs) | core + financial + lifestyle (+ judicial mocks) | Desktop 1280×900 + mobile 390×844 (`@visual`). Masks clock/date/notifications and live data lists. Baselines in `critical-routes.spec.ts-snapshots/`. |

### Regression (`e2e/regression/`)

| File | Routes | Coverage |
|------|--------|----------|
| `tiempo.spec.ts` | Hub, fechas, rutinas, mi-día, mi-diario, metas delete | Hub nav + CRUD + delete rutina/meta |
| `trabajo.spec.ts` | Hub, contratos, actividades, procesos cierre | Contract → activity + kanban + close proceso |
| `registros.spec.ts` | empleados, vehículos, patrimonio, generador, secretos decrypt, archivos viewer, cuaderno blocks | CRUD + decrypt + preview + editor |
| `finanzas.spec.ts` | presupuestos, deudas, tarjetas-credito, me-deben, cdts, cripto-wallet, proyectos, tarjetas-débito, subscripciones | Create + edit / persist |
| `ajustes.spec.ts` | `/ajustes` | Profile save (no destructive actions) |
| `notificaciones.spec.ts` | `/notificaciones` | Create via API + mark as read |

Tag `@regression` on regression specs. Default credentials (`e2e` / `123qweZ!`) apply via `e2e/fixtures/auth.ts`.

`justicia.spec.ts` uses `page.route()` fixtures in `e2e/fixtures/judicialMocks.ts` so CI never depends on the external judicial API.

## CI recommendations

| Job | Specs | When |
|-----|-------|------|
| PR smoke | `e2e/smoke/` (except archivos presigned) | Every PR |
| Mobile viewport | `e2e/mobile/` | PR or pre-release |
| PR / merge regression | `e2e/regression/` | Nightly or pre-release |
| Nightly S3 | `archivos` with `E2E_PRESIGNED_UPLOAD=true` | Once per day on staging |

### Staging nightly (presigned S3)

Run against a deployed frontend (`E2E_BASE_URL`) with the staging backend and a bucket whose CORS allows the staging origin for `PUT`:

```bash
E2E_BASE_URL=https://staging.example.com \
E2E_USERNAME=e2e \
E2E_PASSWORD='…' \
E2E_PRESIGNED_UPLOAD=true \
npm run test:e2e:nightly
```

The test asserts the full presigned flow: `upload-url` → S3 `PUT` → `complete`, then the file appears in the list.

Playwright config uses `workers: 1` and `fullyParallel: false` to avoid data collisions on shared test users.

## Troubleshooting

- **Login skip / tests skipped:** set `E2E_USERNAME` and `E2E_PASSWORD`.
- **Network errors on CRUD:** confirm `npm run offline:all` is running and migrations are applied.
- **Archivos upload fails:** check AWS credentials in backend `.env` and S3 CORS for `localhost:3000`.
- **Justicia empty:** ensure mocks are registered before navigation (`setupJudicialMocks` in `beforeEach`).
- **Procesos judiciales “configure nombre”:** test user needs `nombre_completo` in Ajustes, or mocks still work once name is loaded from `GET /user-details`.
