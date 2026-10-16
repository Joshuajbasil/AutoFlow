# Milestone 1 — Foundation

Completed and verified on October 15, 2026 (America/New_York).

## Implemented

- React/Vite/MUI frontend, Express REST API and persistent MongoDB integration.
- Workshop, User and CustomerProfile models with timestamps, validation and compound uniqueness indexes.
- Customer registration, three-role login, protected pages, HttpOnly JWT cookies, logout/session invalidation and password changes.
- Administrator technician provisioning, paginated/searchable/filterable account directory and access activation controls.
- Database-backed account overview and role-specific navigation; personal settings for every role.
- Realistic, repeatable seed for one workshop and all three roles.
- Full product architecture roadmap, implemented API reference, environment template and local setup documentation.

## Verification results

- `npm test`: **22 passed** — 18 Supertest/MongoDB integration tests and 4 React component tests.
- `npm run build`: **passed**, with route-level code splitting and no oversized chunk warning.
- Dependency installation audit after updating Vitest: **0 vulnerabilities reported**.
- Browser: seeded administrator login, persisted session, real overview counts (2 customers, 2 technicians, 5 active accounts), directory navigation and server-backed search verified.
- Responsive browser checks: desktop at 1440px, directory at 390px, dashboard at 320px. Corrected a narrow-screen grid overflow and confirmed content width matches viewport width.
- Development MongoDB started with persistent WiredTiger storage; demo seed and both application servers started successfully.

## Local handoff

The initial setup generated a private, ignored `.env` with a random JWT secret and demo password. The demo account password is the `SEED_PASSWORD` value in that file. The current application is available at `http://localhost:5173` while the development processes remain running. After restarting your computer/session, start `npm run db:dev` and `npm run dev` in separate terminals. Do not overwrite the existing `.env` when following the fresh-install README.

This machine's sandbox blocked npm and localhost database connections, so installation/test/start commands needed elevated tool execution. npm 10 also hit a dependency-resolution bug during the Vitest upgrade; running the install through npm 11 resolved it. If that npm error recurs, use `npx --yes npm@11 install`. Dependency TLS verification remained enabled.

## Next milestone

Milestone 2: operational customer records, vehicles, capacity-safe appointments and repair orders. Operational dashboards, estimates, billing, Stripe, inventory, notifications and reports remain scheduled for milestones 2–5; they are not represented as working features in this foundation.
