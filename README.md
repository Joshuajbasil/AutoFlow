# AutoFlow

An automotive workshop management application built with React, Vite, JavaScript, MUI, React Router, Axios, Express and MongoDB/Mongoose.

**Milestone 1 — Foundation is implemented.** This repository has a real persistent backend and connected frontend. It is not yet the complete five-milestone product: vehicle records, scheduling, repairs, estimates, invoices, Stripe, inventory, notifications and financial reporting will be implemented in subsequent milestones.

## What works now

- Workshop-scoped accounts, bcrypt password hashing, JWT cookie sessions and server-side session revocation.
- Customer signup using a workshop code; owner-managed technician accounts.
- Role-aware responsive navigation and protected routes for administrators, technicians and customers.
- Administrator account search, role/access filters, sorting, pagination, and activation/deactivation with confirmation.
- Database-backed overview with account counts and recent registrations; personal dashboards never expose other customers.
- Personal profile editing and password changes.
- Strict request validation, tenant isolation, rate limiting, Helmet, CORS, CSRF request checks, centralized errors, loading/error/empty states.
- Idempotent demo seed and backend integration tests using a disposable actual MongoDB server.

## Requirements

- Node.js 22.12+ and npm 10+.
- MongoDB 7+ locally or a MongoDB Atlas connection. M1 works with standalone MongoDB; future transactional scheduling, inventory and payments will require a replica set.
- Access to npm for dependency installation. The first backend test run downloads a MongoDB binary via mongodb-memory-server; it does not use or modify your application database.

## Setup

From the repository root:

```sh
npm install
```

Copy `.env.example` to `.env` (PowerShell: `Copy-Item .env.example .env`). Generate a secret:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Set JWT_SECRET to the generated value, MONGODB_URI to your database connection, and SEED_PASSWORD to a strong development password of at least 12 characters (maximum 72 UTF-8 bytes). The placeholder JWT secret is intentionally rejected. Environment files are ignored by Git.

Start MongoDB locally using your installation/service, or configure Atlas with a database user and network access for your development machine. The default URI is `mongodb://127.0.0.1:27017/autoflow`. If neither is available, run `npm run db:dev` in a separate terminal: this downloads and starts a real MongoDB process bound to localhost with persistent WiredTiger storage under `.local/mongodb`. Keep it running while using the app. This optional helper is for local development only and requires port 27017 to be free.

```sh
npm run seed
npm run dev
```

Open [AutoFlow](http://localhost:5173). Vite listens on 127.0.0.1:5173 and proxies API requests to 127.0.0.1:4000. The API health endpoint is [health](http://localhost:4000/api/health). To start individually: `npm run dev -w server` and `npm run dev -w client`.

## Demo accounts

Workshop code: **autoflow-demo**. All newly seeded accounts use your **SEED_PASSWORD**, never a hardcoded application password.

| Role | Email |
| --- | --- |
| Administrator | owner@autoflow.demo |
| Technician | tech@autoflow.demo |
| Customer | customer@autoflow.demo |
| Additional technician | casey@autoflow.demo |
| Additional customer | sam@autoflow.demo |

Seed inserts missing records without deleting data or resetting existing passwords. It is disabled in production. Customer profiles are created by seed; self-registered customer CRM extensions are safely initialized on profile reads. Workshop/owner provisioning is currently a trusted seed/deployment operation; there is no public owner signup.

## Verify

```sh
npm test
npm run build
```

Backend tests cover real persistence, password hashing/login, role escalation, duplicate users, tenant boundaries, pagination, profile editing, session revocation, deactivation, CSRF, rate limiting and configuration. Frontend tests cover role guards and login submission/error display. Tests use mocked HTTP behavior only in frontend component tests; backend integration tests use real MongoDB.

Manual flow: sign in as owner → add technician → search/filter the directory → deactivate/reactivate the technician → sign out → log in as the technician → edit profile/change password → register a customer → verify customer access does not include People & access. Reload the browser to verify session restoration and restart the API to verify MongoDB persistence.

## Environment

| Variable | Purpose |
| --- | --- |
| NODE_ENV | development / test / production |
| PORT | API port, default 4000 (update Vite proxy if changed) |
| MONGODB_URI | MongoDB connection string; keep credentials out of source control |
| JWT_SECRET | Random secret of at least 32 characters |
| CLIENT_ORIGIN | Exact frontend origin, no trailing slash; default http://localhost:5173 |
| TRUST_PROXY | 0 by default; 1 only behind one trusted proxy |
| SEED_PASSWORD | Development seed password; required only by seed |

No client-side secret variables are needed. Stripe configuration will be added with the working payment integration in Milestone 4.

## Build and deployment boundary

`npm run build` emits `client/dist`. `npm start` starts the API and requires reachable MongoDB/configuration. Serve `client/dist` through a static host with SPA history fallback, and reverse proxy `/api` to Express on the **same HTTPS origin**. Production requires NODE_ENV=production and an HTTPS CLIENT_ORIGIN; cookies become Secure. Run `npm run db:indexes -w server` against the configured database before deploying (automatic index creation is disabled in production). This adds declared indexes without dropping existing ones. Do not deploy the demo seed or expose the development servers publicly.

This milestone is not a production-readiness certification. Before a public rollout complete the remaining product workflows, password recovery/verification, operational logging, backups/restore testing, shared rate-limit storage for multiple API instances and deployment security review. Sessions expire after eight hours; sign in again. Logout signs out all sessions for that account.

## Structure

```text
client/src/   components, context, hooks, layouts, pages, services, theme
server/src/   config, controllers, middleware, models, routes, services, utils, validators
server/tests/ integration tests
server/scripts/seed.js
docs/ARCHITECTURE.md   full entity plan, consistency rules and milestone roadmap
docs/API.md            implemented API contract
```

## Milestones

1. **Foundation:** identity, MongoDB, permissions, account management and layouts.
2. **Core workshop management:** customers, vehicles, capacity-safe appointments and repair orders.
3. **Full service workflow:** diagnostics, estimates/approval, assignments, repair timeline and pickup.
4. **Business operations:** invoices, verified Stripe webhooks, idempotent stock movements and notifications.
5. **Polish and testing:** database-backed operational reporting with Recharts, complete workflow coverage and deployment hardening.

See [architecture](docs/ARCHITECTURE.md) and [API reference](docs/API.md).
